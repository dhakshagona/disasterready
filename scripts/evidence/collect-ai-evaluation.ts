import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';

import { readGzipJsonLines } from './shared';

type EvaluationCase = {
  evaluationId: string;
  providerId: string;
  hazard: string;
  officialText: string;
  deterministicSummary: string;
  inputSha256: string;
};

type EvaluationAttempt = {
  evaluationId: string;
  providerId: string;
  inputSha256: string;
  attemptedAt: string;
  latencyMs: number;
  response: unknown;
};

const datasetPath = path.resolve('evidence/data/ai-safety-100.jsonl.gz');
const attemptsPath = path.resolve('evidence/private/ai-safety-attempts.jsonl');
const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const maximumRequests = Number.parseInt(process.env.AI_EVAL_MAX_REQUESTS ?? '40', 10);
const requestIntervalMs = 16_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function existingSuccessfulKeys(): Promise<Set<string>> {
  let content = '';
  try {
    content = await readFile(attemptsPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const ids = new Set<string>();
  for (const line of content.split(/\r?\n/).filter(Boolean)) {
    const attempt = JSON.parse(line) as EvaluationAttempt;
    if (isRecord(attempt.response) && attempt.response.status === 'ok' && attempt.inputSha256) {
      ids.add(`${attempt.evaluationId}:${attempt.inputSha256}`);
    }
  }
  return ids;
}

async function pause(durationMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function main(): Promise<void> {
  if (!projectUrl || !publishableKey) {
    throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the process environment');
  }
  if (!Number.isInteger(maximumRequests) || maximumRequests < 1 || maximumRequests > 40) {
    throw new Error('AI_EVAL_MAX_REQUESTS must be an integer from 1 through 40');
  }

  const cases = await readGzipJsonLines<EvaluationCase>(datasetPath);
  const completed = await existingSuccessfulKeys();
  const pending = cases.filter((item) => !completed.has(`${item.evaluationId}:${item.inputSha256}`)).slice(0, maximumRequests);
  await import('./shared').then(({ ensureParent }) => ensureParent(attemptsPath));
  let attempted = 0;
  let successful = 0;
  for (const evaluationCase of pending) {
    const startedAt = performance.now();
    const response = await fetch(`${projectUrl}/functions/v1/simplify-alert`, {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hazard: evaluationCase.hazard,
        officialText: evaluationCase.officialText,
        deterministicSummary: evaluationCase.deterministicSummary,
      }),
    });
    const payload = await response.json().catch(() => ({ status: 'transport-invalid', httpStatus: response.status }));
    const attempt: EvaluationAttempt = {
      evaluationId: evaluationCase.evaluationId,
      providerId: evaluationCase.providerId,
      inputSha256: evaluationCase.inputSha256,
      attemptedAt: new Date().toISOString(),
      latencyMs: Number((performance.now() - startedAt).toFixed(3)),
      response: payload,
    };
    await appendFile(attemptsPath, `${JSON.stringify(attempt)}\n`, 'utf8');
    attempted += 1;
    if (isRecord(payload) && payload.status === 'ok') successful += 1;
    if (isRecord(payload) && payload.status === 'fallback' && payload.reason === 'rate-limited') break;
    if (attempted < pending.length) await pause(requestIntervalMs);
  }
  console.log(JSON.stringify({ attempted, successful, alreadySuccessful: completed.size, remaining: cases.length - completed.size - successful }, null, 2));
  console.log(`Private attempt log: ${attemptsPath}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
