import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import { normalizeNwsFeature } from '../../src/infrastructure/nws/normalizer';
import { ensureParent, readGzipJsonLines, sha256, writeJson, type EvidenceHazard, type NwsEvidenceRecord } from './shared';

type EvaluationCase = {
  evaluationId: string;
  providerId: string;
  hazard: EvidenceHazard;
  officialText: string;
  deterministicSummary: string;
  inputSha256: string;
  sourceDatasetSha256: string;
};

const inputPath = path.resolve('evidence/data/nws-alerts-1000.jsonl.gz');
const outputPath = path.resolve('evidence/data/ai-safety-100.jsonl.gz');
const manifestPath = path.resolve('evidence/data/ai-safety-100.manifest.json');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function replayTime(record: NwsEvidenceRecord): string {
  if (!isRecord(record.feature) || !isRecord(record.feature.properties)) return record.collectedAt;
  const sent = record.feature.properties.sent ?? record.feature.properties.effective;
  return typeof sent === 'string' && Number.isFinite(Date.parse(sent))
    ? new Date(Date.parse(sent) + 1).toISOString()
    : record.collectedAt;
}

function selectRoundRobin(cases: EvaluationCase[], limit: number): EvaluationCase[] {
  const groups = new Map<EvidenceHazard, EvaluationCase[]>();
  for (const evaluationCase of cases) {
    const group = groups.get(evaluationCase.hazard) ?? [];
    group.push(evaluationCase);
    groups.set(evaluationCase.hazard, group);
  }
  for (const group of groups.values()) group.sort((left, right) => left.providerId.localeCompare(right.providerId));
  const represented = [...groups.entries()].filter(([, group]) => group.length).sort(([left], [right]) => left.localeCompare(right));
  const selected: EvaluationCase[] = [];
  let index = 0;
  while (selected.length < limit && represented.some(([, group]) => index < group.length)) {
    for (const [, group] of represented) {
      const item = group[index];
      if (item && selected.length < limit) selected.push(item);
    }
    index += 1;
  }
  return selected;
}

async function main(): Promise<void> {
  const sourceRecords = await readGzipJsonLines<NwsEvidenceRecord>(inputPath);
  const sourceBytes = await import('node:fs/promises').then(({ readFile }) => readFile(inputPath));
  const sourceDatasetSha256 = sha256(sourceBytes);
  const eligible = sourceRecords.flatMap((record, index): EvaluationCase[] => {
    const alert = normalizeNwsFeature(record.feature, replayTime(record));
    if (!alert || alert.hazard === 'other' || alert.summary.length > 500) return [];
    const officialText = alert.instructionText ?? alert.originalText;
    if (officialText.length > 12_000) return [];
    return [{
      evaluationId: `ai-eval-${String(index + 1).padStart(4, '0')}`,
      providerId: alert.providerId,
      hazard: alert.hazard,
      officialText,
      deterministicSummary: alert.summary,
      inputSha256: sha256(JSON.stringify({ hazard: alert.hazard, officialText, deterministicSummary: alert.summary })),
      sourceDatasetSha256,
    }];
  });
  const selected = selectRoundRobin(eligible, 100);
  if (selected.length < 100) throw new Error(`Only ${selected.length} eligible official alerts were available`);

  const data = gzipSync(`${selected.map((item) => JSON.stringify(item)).join('\n')}\n`, { level: 9 });
  await ensureParent(outputPath);
  await writeFile(outputPath, data);
  const counts = Object.fromEntries([...new Set(selected.map((item) => item.hazard))].sort().map((hazard) => [hazard, selected.filter((item) => item.hazard === hazard).length]));
  await writeJson(manifestPath, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceDataset: path.relative(process.cwd(), inputPath).replaceAll('\\', '/'),
    sourceDatasetSha256,
    selection: 'Deterministic round-robin selection across supported hazards after production normalization',
    eligibleRecords: eligible.length,
    selectedRecords: selected.length,
    hazardCounts: counts,
    datasetFile: path.relative(process.cwd(), outputPath).replaceAll('\\', '/'),
    datasetSha256: sha256(data),
  });
  console.log(`Prepared ${selected.length} official alert cases for AI safety evaluation.`);
  console.log(`Dataset: ${outputPath}`);
  console.log(`Manifest: ${manifestPath}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
