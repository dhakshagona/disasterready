import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import { expectedHazardForEvent } from './nws-hazard-taxonomy';
import {
  ensureParent,
  parsePositiveInteger,
  sha256,
  writeJson,
  type EvidenceHazard,
  type NwsEvidenceRecord,
} from './shared';

type UnknownRecord = Record<string, unknown>;

const positionalArguments = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));
const target = parsePositiveInteger(positionalArguments[0], 1_000);
const outputPath = path.resolve(positionalArguments[1] ?? 'evidence/data/nws-alerts-1000.jsonl.gz');
const manifestPath = path.resolve(positionalArguments[2] ?? 'evidence/data/nws-alerts-1000.manifest.json');
const maximumPages = 100;
const requestPauseMs = 1_000;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function featureIdentity(feature: unknown): { providerId: string; event: string } | null {
  if (!isRecord(feature) || !isRecord(feature.properties)) return null;
  const providerId = recordString(feature.properties, 'id') ?? recordString(feature, 'id');
  const event = recordString(feature.properties, 'event');
  return providerId && event ? { providerId, event } : null;
}

function nextPage(payload: UnknownRecord): string | null {
  const pagination = payload.pagination ?? payload['@pagination'];
  if (!isRecord(pagination)) return null;
  return recordString(pagination, 'next');
}

function countByHazard(records: NwsEvidenceRecord[]): Record<EvidenceHazard, number> {
  const counts: Record<EvidenceHazard, number> = {
    flood: 0,
    tornado: 0,
    hurricane: 0,
    wildfire: 0,
    'air-quality': 0,
    'winter-storm': 0,
    earthquake: 0,
    other: 0,
  };
  for (const record of records) counts[record.expectedHazard] += 1;
  return counts;
}

function selectRoundRobin(records: NwsEvidenceRecord[], limit: number): NwsEvidenceRecord[] {
  const groups = new Map<EvidenceHazard, NwsEvidenceRecord[]>();
  for (const record of records) {
    const group = groups.get(record.expectedHazard) ?? [];
    group.push(record);
    groups.set(record.expectedHazard, group);
  }
  for (const group of groups.values()) group.sort((left, right) => left.providerId.localeCompare(right.providerId));

  const hazards = [...groups.entries()]
    .filter(([, group]) => group.length)
    .sort(([left], [right]) => left.localeCompare(right));
  const selected: NwsEvidenceRecord[] = [];
  let index = 0;
  while (selected.length < limit && hazards.some(([, group]) => index < group.length)) {
    for (const [, group] of hazards) {
      const record = group[index];
      if (record && selected.length < limit) selected.push(record);
    }
    index += 1;
  }
  return selected;
}

async function sleep(durationMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function main(): Promise<void> {
  const collectedAt = new Date().toISOString();
  const end = new Date();
  const start = new Date(end.getTime() - (6 * 24 * 60 * 60 * 1_000));
  const firstUrl = new URL('https://api.weather.gov/alerts');
  firstUrl.searchParams.set('start', start.toISOString());
  firstUrl.searchParams.set('end', end.toISOString());
  firstUrl.searchParams.set('limit', '500');

  const sourcePages: string[] = [];
  const distinct = new Map<string, NwsEvidenceRecord>();
  let url: string | null = firstUrl.toString();
  for (let page = 0; url && page < maximumPages; page += 1) {
    sourcePages.push(url);
    const response = await fetch(url, {
      headers: {
        Accept: 'application/geo+json',
        'User-Agent': 'DisasterReady evidence harness (educational public-safety project)',
      },
    });
    if (!response.ok) throw new Error(`NWS collection failed with status ${response.status}`);
    const payload = await response.json() as unknown;
    if (!isRecord(payload) || !Array.isArray(payload.features)) throw new Error('NWS collection returned an invalid feature collection');

    for (const feature of payload.features) {
      const identity = featureIdentity(feature);
      if (!identity || distinct.has(identity.providerId)) continue;
      distinct.set(identity.providerId, {
        providerId: identity.providerId,
        expectedHazard: expectedHazardForEvent(identity.event),
        collectedAt,
        feature,
      });
    }

    url = nextPage(payload);
    if (url) await sleep(requestPauseMs);
  }

  const available = [...distinct.values()];
  const selected = selectRoundRobin(available, target);
  const selectedCategoryCounts = countByHazard(selected);
  const representedCategories = Object.values(selectedCategoryCounts).filter((count) => count > 0).length;
  if (selected.length < target) {
    throw new Error(`The official seven-day NWS window supplied ${selected.length} distinct records, below the ${target} record target`);
  }
  if (representedCategories < 5) {
    throw new Error(`The official seven-day NWS window supplied ${representedCategories} represented categories, below the 5 category target`);
  }

  const jsonLines = `${selected.map((record) => JSON.stringify(record)).join('\n')}\n`;
  const compressed = gzipSync(jsonLines, { level: 9 });
  await ensureParent(outputPath);
  await writeFile(outputPath, compressed);
  await writeJson(manifestPath, {
    schemaVersion: 1,
    source: 'National Weather Service API',
    sourceDocumentation: 'https://www.weather.gov/documentation/services-web-api',
    collectedAt,
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    requestedRecords: target,
    availableDistinctRecords: available.length,
    selectedDistinctRecords: selected.length,
    selection: 'Deterministic round-robin selection across reviewed hazard categories, sorted by provider identifier',
    availableCategoryCounts: countByHazard(available),
    selectedCategoryCounts,
    representedCategories,
    sourcePages,
    datasetFile: path.relative(process.cwd(), outputPath).replaceAll('\\', '/'),
    datasetSha256: sha256(compressed),
  });

  console.log(`Collected ${selected.length} distinct official NWS alert records across ${representedCategories} categories.`);
  console.log(`Dataset: ${outputPath}`);
  console.log(`Manifest: ${manifestPath}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
