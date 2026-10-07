import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

export type EvidenceHazard =
  | 'flood'
  | 'tornado'
  | 'hurricane'
  | 'wildfire'
  | 'air-quality'
  | 'winter-storm'
  | 'earthquake'
  | 'other';

export type NwsEvidenceRecord = {
  providerId: string;
  expectedHazard: EvidenceHazard;
  collectedAt: string;
  feature: unknown;
};

export async function ensureParent(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await ensureParent(filePath);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function readGzipJsonLines<T = NwsEvidenceRecord>(filePath: string): Promise<T[]> {
  const compressed = await readFile(filePath);
  const text = gunzipSync(compressed).toString('utf8').trim();
  if (!text) return [];
  return text.split('\n').map((line) => JSON.parse(line) as T);
}

export function sha256(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function percentile(sortedValues: number[], percentileValue: number): number {
  if (!sortedValues.length) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sortedValues.length) - 1),
  );
  return sortedValues[index] ?? 0;
}

export function percentage(numerator: number, denominator: number): number {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}

export function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`Expected a positive integer, received ${value}`);
  return parsed;
}
