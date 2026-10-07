import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ensureParent, percentage, percentile, writeJson } from './shared';

type CsvRow = Record<string, string>;

const observationsPath = path.resolve('evidence/private/usability-observations.csv');
const susPath = path.resolve('evidence/private/usability-sus.csv');
const reportPath = path.resolve('evidence/results/usability-report.json');
const markdownPath = path.resolve('evidence/results/usability-report.md');
const strict = process.argv.includes('--strict');

function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const next = content[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.length)) rows.push(row);
  }
  const [headers, ...values] = rows;
  if (!headers) return [];
  return values.map((items) => Object.fromEntries(headers.map((header, index) => [header.trim(), items[index]?.trim() ?? ''])));
}

async function readCsv(filePath: string): Promise<CsvRow[]> {
  try {
    return parseCsv(await readFile(filePath, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function numberValue(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isYes(value: string | undefined): boolean {
  return value?.toLowerCase() === 'yes' || value === '1' || value?.toLowerCase() === 'true';
}

function susScore(row: CsvRow): number | null {
  const values = Array.from({ length: 10 }, (_, index) => numberValue(row[`q${index + 1}`]));
  if (values.some((value) => value === null || value < 1 || value > 5)) return null;
  const numericValues = values as number[];
  const adjusted = numericValues.reduce((sum, value, index) => sum + (index % 2 === 0 ? value - 1 : 5 - value), 0);
  return adjusted * 2.5;
}

async function main(): Promise<void> {
  const observations = await readCsv(observationsPath);
  const susRows = await readCsv(susPath);
  const participantIds = [...new Set([...observations, ...susRows].map((row) => row.session_id).filter(Boolean))];
  const scenarioIds = ['alert-to-action', 'checklist-recovery', 'safety-route-trust'];
  const scenarioMetrics = Object.fromEntries(scenarioIds.map((scenarioId) => {
    const rows = observations.filter((row) => row.scenario_id === scenarioId);
    const successful = rows.filter((row) => isYes(row.success_without_help)).length;
    const times = rows.flatMap((row) => {
      const value = numberValue(row.time_seconds);
      return value === null ? [] : [value];
    }).sort((left, right) => left - right);
    return [scenarioId, {
      attempted: rows.length,
      successful,
      completionPercent: percentage(successful, rows.length),
      medianTimeSeconds: percentile(times, 50),
      p95TimeSeconds: percentile(times, 95),
    }];
  }));
  const susScores = susRows.flatMap((row) => {
    const score = susScore(row);
    return score === null ? [] : [score];
  }).sort((left, right) => left - right);
  const safetySignals = {
    demoMistakenAsReal: observations.filter((row) => isYes(row.demo_mistaken_as_real)).length,
    unavailableMistakenAsClear: observations.filter((row) => isYes(row.unavailable_mistaken_as_clear)).length,
    shelterMistakenAsGuaranteed: observations.filter((row) => isYes(row.shelter_mistaken_as_guaranteed)).length,
    aiMistakenAsOfficial: observations.filter((row) => isYes(row.ai_mistaken_as_official)).length,
  };
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    evidenceStatus: participantIds.length >= 30 ? 'study-complete' : participantIds.length ? 'study-in-progress' : 'not-started',
    participantCount: participantIds.length,
    participantTarget: { minimum: 30, preferred: 50 },
    scenarioMetrics,
    sus: {
      completedQuestionnaires: susScores.length,
      mean: susScores.length ? Number((susScores.reduce((sum, score) => sum + score, 0) / susScores.length).toFixed(2)) : null,
      median: susScores.length ? percentile(susScores, 50) : null,
    },
    safetySignals,
    claimReady: participantIds.length >= 30 && susScores.length === participantIds.length,
  };
  await writeJson(reportPath, report);

  const scenarioRows = Object.entries(scenarioMetrics)
    .map(([scenarioId, metrics]) => `| ${scenarioId} | ${metrics.attempted} | ${metrics.completionPercent}% | ${metrics.medianTimeSeconds} | ${metrics.p95TimeSeconds} |`)
    .join('\n');
  const markdown = `# Usability study results\n\nGenerated: ${report.generatedAt}\n\nEvidence status: **${report.evidenceStatus}**\n\nNo result is claimed until real participant records are present.\n\n## Participation\n\n| Metric | Result |\n| --- | ---: |\n| Unique participants | ${report.participantCount} |\n| Minimum target | ${report.participantTarget.minimum} |\n| Preferred target | ${report.participantTarget.preferred} |\n| Completed SUS questionnaires | ${report.sus.completedQuestionnaires} |\n| Mean SUS | ${report.sus.mean ?? 'Pending'} |\n| Median SUS | ${report.sus.median ?? 'Pending'} |\n\n## Scenarios\n\n| Scenario | Attempts | Completion | Median seconds | p95 seconds |\n| --- | ---: | ---: | ---: | ---: |\n${scenarioRows}\n\n## Safety comprehension signals\n\n| Signal | Count |\n| --- | ---: |\n| Demo mistaken as real | ${safetySignals.demoMistakenAsReal} |\n| Unavailable data mistaken as all-clear | ${safetySignals.unavailableMistakenAsClear} |\n| Shelter listing mistaken as guaranteed capacity | ${safetySignals.shelterMistakenAsGuaranteed} |\n| AI wording mistaken as official text | ${safetySignals.aiMistakenAsOfficial} |\n`;
  await ensureParent(markdownPath);
  await writeFile(markdownPath, markdown, 'utf8');
  console.log(JSON.stringify({ evidenceStatus: report.evidenceStatus, participantCount: report.participantCount, claimReady: report.claimReady }, null, 2));
  console.log(`JSON report: ${reportPath}`);
  console.log(`Markdown report: ${markdownPath}`);
  if (strict && !report.claimReady) process.exitCode = 2;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
