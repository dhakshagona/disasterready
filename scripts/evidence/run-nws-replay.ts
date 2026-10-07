import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { selectActionPlan } from '../../src/domain/action-plans/select-action-plan';
import { normalizeNwsFeature } from '../../src/infrastructure/nws/normalizer';
import {
  percentage,
  percentile,
  readGzipJsonLines,
  sha256,
  ensureParent,
  writeJson,
  type EvidenceHazard,
  type NwsEvidenceRecord,
} from './shared';

type UnknownRecord = Record<string, unknown>;

const positionalArguments = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));
const datasetPath = path.resolve(positionalArguments[0] ?? 'evidence/data/nws-alerts-1000.jsonl.gz');
const reportPath = path.resolve(positionalArguments[1] ?? 'evidence/results/nws-replay-report.json');
const markdownPath = path.resolve(positionalArguments[2] ?? 'evidence/results/nws-replay-report.md');
const strict = process.argv.includes('--strict');

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function replayTime(record: NwsEvidenceRecord): string {
  if (!isRecord(record.feature) || !isRecord(record.feature.properties)) return record.collectedAt;
  const sent = record.feature.properties.sent ?? record.feature.properties.effective;
  if (typeof sent !== 'string' || !Number.isFinite(Date.parse(sent))) return record.collectedAt;
  return new Date(Date.parse(sent) + 1).toISOString();
}

function eventName(record: NwsEvidenceRecord): string {
  if (!isRecord(record.feature) || !isRecord(record.feature.properties)) return 'Unknown event';
  return typeof record.feature.properties.event === 'string' ? record.feature.properties.event : 'Unknown event';
}

async function main(): Promise<void> {
  const records = await readGzipJsonLines(datasetPath);
  if (!records.length) throw new Error('The NWS replay dataset is empty');
  const datasetBytes = await readFile(datasetPath);

  const latencies: number[] = [];
  const failures: Array<{ providerId: string; event: string; reason: string }> = [];
  const categories = new Map<EvidenceHazard, { attempted: number; accepted: number; correct: number; plans: number }>();
  let accepted = 0;
  let correct = 0;
  let crashCount = 0;
  let planEligible = 0;
  let plansCreated = 0;

  for (const record of records) {
  const category = categories.get(record.expectedHazard) ?? { attempted: 0, accepted: 0, correct: 0, plans: 0 };
  category.attempted += 1;
  const startedAt = performance.now();
  try {
    const alert = normalizeNwsFeature(record.feature, replayTime(record));
    if (!alert) {
      failures.push({ providerId: record.providerId, event: eventName(record), reason: 'normalizer-rejected' });
      categories.set(record.expectedHazard, category);
      latencies.push(performance.now() - startedAt);
      continue;
    }
    accepted += 1;
    category.accepted += 1;
    if (alert.hazard === record.expectedHazard) {
      correct += 1;
      category.correct += 1;
    } else {
      failures.push({
        providerId: record.providerId,
        event: eventName(record),
        reason: `expected-${record.expectedHazard}-received-${alert.hazard}`,
      });
    }

    if (alert.status === 'active' && alert.hazard !== 'other') {
      planEligible += 1;
      const plan = selectActionPlan(alert);
      if (plan) {
        plansCreated += 1;
        category.plans += 1;
      } else {
        failures.push({ providerId: record.providerId, event: eventName(record), reason: 'missing-reviewed-action-plan' });
      }
    } else {
      selectActionPlan(alert);
    }
  } catch (error) {
    crashCount += 1;
    failures.push({
      providerId: record.providerId,
      event: eventName(record),
      reason: error instanceof Error ? `exception-${error.name}` : 'exception-unknown',
    });
  }
  categories.set(record.expectedHazard, category);
  latencies.push(performance.now() - startedAt);
  }

  const sortedLatencies = [...latencies].sort((left, right) => left - right);
const representedCategories = [...categories.values()].filter((category) => category.attempted > 0).length;
const metrics = {
  attemptedRecords: records.length,
  acceptedRecords: accepted,
  pipelineCompletionPercent: percentage(accepted, records.length),
  classificationAgreementPercent: percentage(correct, accepted),
  representedCategories,
  planEligibleRecords: planEligible,
  plansCreated,
  actionPlanCoveragePercent: percentage(plansCreated, planEligible),
  crashCount,
  cpuLatencyMs: {
    median: Number(percentile(sortedLatencies, 50).toFixed(3)),
    p95: Number(percentile(sortedLatencies, 95).toFixed(3)),
    maximum: Number((sortedLatencies.at(-1) ?? 0).toFixed(3)),
  },
};
const targets = {
  recordsAtLeast1000: metrics.attemptedRecords >= 1_000,
  categoriesAtLeast5: representedCategories >= 5,
  pipelineCompletionAtLeast99Percent: metrics.pipelineCompletionPercent >= 99,
  classificationAgreementAtLeast98Percent: metrics.classificationAgreementPercent >= 98,
  medianCpuLatencyBelow2000Ms: metrics.cpuLatencyMs.median < 2_000,
  p95CpuLatencyBelow5000Ms: metrics.cpuLatencyMs.p95 < 5_000,
  zeroCrashes: crashCount === 0,
};
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  dataset: path.relative(process.cwd(), datasetPath).replaceAll('\\', '/'),
  datasetSha256: sha256(datasetBytes),
  runtime: { node: process.version, platform: process.platform, architecture: process.arch },
  latencyScope: 'Local CPU wall time for normalization and deterministic action-plan selection. Network and rendering are excluded.',
  metrics,
  targets,
  categories: Object.fromEntries([...categories.entries()].sort(([left], [right]) => left.localeCompare(right))),
  failureCount: failures.length,
  failures: failures.slice(0, 100),
};
  await writeJson(reportPath, report);

const categoryRows = [...categories.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([hazard, values]) => `| ${hazard} | ${values.attempted} | ${values.accepted} | ${percentage(values.correct, values.accepted)}% | ${values.plans} |`)
  .join('\n');
const targetRows = Object.entries(targets)
  .map(([name, passed]) => `| ${name} | ${passed ? 'PASS' : 'MISS'} |`)
  .join('\n');
const markdown = `# NWS replay benchmark\n\nGenerated: ${report.generatedAt}\n\nDataset SHA-256: \`${report.datasetSha256}\`\n\n## Results\n\n| Metric | Result |\n| --- | ---: |\n| Attempted records | ${metrics.attemptedRecords} |\n| Accepted records | ${metrics.acceptedRecords} |\n| Pipeline completion | ${metrics.pipelineCompletionPercent}% |\n| Classification agreement | ${metrics.classificationAgreementPercent}% |\n| Represented categories | ${metrics.representedCategories} |\n| Action-plan coverage | ${metrics.actionPlanCoveragePercent}% |\n| Median CPU latency | ${metrics.cpuLatencyMs.median} ms |\n| p95 CPU latency | ${metrics.cpuLatencyMs.p95} ms |\n| Maximum CPU latency | ${metrics.cpuLatencyMs.maximum} ms |\n| Uncaught crashes | ${metrics.crashCount} |\n\nCPU latency excludes NWS requests, rendering, notification delivery, and user interaction.\n\n## Category results\n\n| Hazard | Attempted | Accepted | Classification agreement | Plans created |\n| --- | ---: | ---: | ---: | ---: |\n${categoryRows}\n\n## Target check\n\n| Target | Result |\n| --- | --- |\n${targetRows}\n\n## Failure accounting\n\nFailures recorded: ${failures.length}. Machine-readable details are in the JSON report. Missing or rejected records remain in the denominator.\n`;
  await ensureParent(markdownPath);
  await writeFile(markdownPath, markdown, 'utf8');

  console.log(JSON.stringify(metrics, null, 2));
  console.log(`JSON report: ${reportPath}`);
  console.log(`Markdown report: ${markdownPath}`);
  if (strict && Object.values(targets).some((passed) => !passed)) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
