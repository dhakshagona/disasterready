import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import { LiveAlertService, type AlertCache, type AlertCacheEntry, type AlertSource } from '../../src/application/alerts/live-alert-service';
import { NotificationDecisionService, type NotificationReceiptRepository } from '../../src/application/notifications/notification-decision-service';
import { PlainLanguageService } from '../../src/application/plain-language/plain-language-service';
import { SafetyResourceService, type ShelterCache, type ShelterCacheEntry, type ShelterSource } from '../../src/application/safety-resources/safety-resource-service';
import type { Alert, UserPreferences } from '../../src/domain/models';
import { normalizeNwsFeature, parseNwsFeatureCollection } from '../../src/infrastructure/nws/normalizer';
import {
  LocalAlertCache,
  LocalChecklistProgressRepository,
  LocalPreferencesRepository,
  LocalShelterCache,
} from '../../src/infrastructure/storage/local-repositories';
import type { KeyValueStorage } from '../../src/infrastructure/storage/storage-port';
import { ensureParent, percentage, writeJson } from './shared';

type ScenarioResult = {
  id: string;
  family: string;
  expectedOutcome: string;
  passed: boolean;
  durationMs: number;
  detail?: string;
};

type Scenario = Omit<ScenarioResult, 'passed' | 'durationMs' | 'detail'> & {
  run(): Promise<void>;
};

const reportPath = path.resolve('evidence/results/reliability-matrix-report.json');
const markdownPath = path.resolve('evidence/results/reliability-matrix-report.md');
const nowIso = '2026-10-06T20:05:00.000Z';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function makeAlert(sequence: number, overrides: Partial<Alert> = {}): Alert {
  return {
    id: `alert-${sequence}`,
    providerId: `provider-${sequence}`,
    hazard: 'flood',
    headline: 'Flash Flood Warning',
    summary: 'Flash flooding is occurring.',
    severity: 'severe',
    urgency: 'immediate',
    certainty: 'observed',
    status: 'active',
    areaDescription: 'Travis County, Texas',
    issuedAt: `2026-10-06T19:${String(sequence % 60).padStart(2, '0')}:00.000Z`,
    expiresAt: '2026-10-06T22:00:00.000Z',
    source: 'National Weather Service',
    originalText: 'Flash flooding is occurring. Move to higher ground immediately. Do not drive through flooded roads.',
    retrievedAt: nowIso,
    freshness: 'current',
    isDemo: false,
    doNow: [],
    ...overrides,
  };
}

function makePreferences(sequence: number, overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    hazards: ['flood', 'tornado', 'hurricane', 'wildfire', 'air-quality', 'winter-storm'],
    location: {
      id: `location-${sequence}`,
      label: 'Saved place',
      city: 'Austin',
      region: 'TX',
      postalCode: '78701',
      latitude: 30.2672 + sequence / 10_000,
      longitude: -97.7431 - sequence / 10_000,
    },
    notificationsEnabled: true,
    language: 'en',
    textSize: 'standard',
    highContrast: false,
    plainLanguage: true,
    reducedMotion: false,
    ...overrides,
  };
}

function makeNwsFeature(sequence: number): Record<string, unknown> {
  return {
    id: `https://api.weather.gov/alerts/test-${sequence}`,
    type: 'Feature',
    geometry: null,
    properties: {
      id: `urn:test:${sequence}`,
      areaDesc: 'Travis County, Texas',
      sent: nowIso,
      effective: nowIso,
      expires: '2026-10-06T22:00:00.000Z',
      status: 'Actual',
      messageType: 'Alert',
      severity: 'Severe',
      certainty: 'Observed',
      urgency: 'Immediate',
      event: 'Flash Flood Warning',
      senderName: 'National Weather Service',
      headline: `Flash Flood Warning ${sequence}`,
      description: 'Flash flooding is occurring.',
      instruction: 'Move to higher ground immediately. Do not drive through flooded roads.',
    },
  };
}

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

class MemoryAlertCache implements AlertCache {
  value: AlertCacheEntry | null = null;
  failWrite = false;

  async get(): Promise<AlertCacheEntry | null> {
    return this.value;
  }

  async set(_locationId: string, entry: AlertCacheEntry): Promise<void> {
    if (this.failWrite) throw new Error('storage unavailable');
    this.value = entry;
  }
}

class MemoryShelterCache implements ShelterCache {
  value: ShelterCacheEntry | null = null;

  async get(): Promise<ShelterCacheEntry | null> {
    return this.value;
  }

  async set(_locationId: string, entry: ShelterCacheEntry): Promise<void> {
    this.value = entry;
  }
}

class MemoryReceipts implements NotificationReceiptRepository {
  readonly values = new Set<string>();

  async has(fingerprint: string): Promise<boolean> {
    return this.values.has(fingerprint);
  }

  async record(fingerprint: string): Promise<void> {
    this.values.add(fingerprint);
  }
}

function scenario(
  family: string,
  sequence: number,
  expectedOutcome: string,
  run: () => Promise<void>,
): Scenario {
  return { id: `${family}-${String(sequence).padStart(3, '0')}`, family, expectedOutcome, run };
}

function createScenarios(): Scenario[] {
  const scenarios: Scenario[] = [];

  for (let index = 1; index <= 12; index += 1) {
    scenarios.push(scenario('duplicate-alert', index, 'A repeated provider version notifies once', async () => {
      const receipts = new MemoryReceipts();
      const service = new NotificationDecisionService(receipts);
      const candidate = makeAlert(index);
      const preferences = makePreferences(index);
      const first = await service.evaluate(candidate, preferences);
      const second = await service.evaluate(candidate, preferences);
      assert(first.shouldNotify && first.reason === 'eligible', 'First alert was not eligible');
      assert(!second.shouldNotify && second.reason === 'duplicate', 'Duplicate alert was not suppressed');
      assert(receipts.values.size === 1, 'Duplicate receipt was recorded more than once');
    }));

    scenarios.push(scenario('provider-update', index, 'A new issue time is treated as a distinct provider update', async () => {
      const service = new NotificationDecisionService(new MemoryReceipts());
      const preferences = makePreferences(index);
      const original = makeAlert(index, { providerId: `shared-provider-${index}` });
      const update = makeAlert(index + 100, {
        providerId: original.providerId,
        issuedAt: `2026-10-06T20:${String(index).padStart(2, '0')}:00.000Z`,
      });
      assert((await service.evaluate(original, preferences)).shouldNotify, 'Original alert did not notify');
      assert((await service.evaluate(update, preferences)).shouldNotify, 'Provider update was incorrectly suppressed');
    }));

    scenarios.push(scenario('expired-alert', index, 'Expired alerts never generate a notification', async () => {
      const decision = await new NotificationDecisionService(new MemoryReceipts()).evaluate(
        makeAlert(index, { status: 'expired' }),
        makePreferences(index),
      );
      assert(!decision.shouldNotify && decision.reason === 'inactive-alert', 'Expired alert was not rejected');
    }));

    scenarios.push(scenario('malformed-nws', index, 'Malformed provider input fails closed without an uncaught crash', async () => {
      const malformed: unknown[] = [
        null,
        undefined,
        7,
        'feature',
        [],
        {},
        { properties: null },
        { properties: {} },
        { properties: { id: 'id' } },
        { properties: { id: 'id', event: 'Flood Warning' } },
        { properties: { id: 'id', event: 'Flood Warning', headline: 'Warning' } },
        { properties: { ...((makeNwsFeature(index).properties as Record<string, unknown>)), expires: null } },
      ];
      const value = normalizeNwsFeature(malformed[index - 1], nowIso);
      assert(value === null, 'Malformed feature was accepted');
    }));

    scenarios.push(scenario('saved-location-fallback', index, 'A saved location works without live device location permission', async () => {
      const preferences = makePreferences(index);
      const requestedPoints: Array<{ latitude: number; longitude: number }> = [];
      const source: AlertSource = {
        getActive: async (point) => {
          requestedPoints.push(point);
          return [makeAlert(index)];
        },
      };
      const feed = await new LiveAlertService({ source, cache: new MemoryAlertCache(), now: () => new Date(nowIso) }).getFeed(preferences);
      assert(feed.source === 'live' && feed.active.length === 1, 'Saved-location alert lookup failed');
      assert(requestedPoints[0]?.latitude === preferences.location.latitude, 'Saved latitude was not used');
      assert(requestedPoints[0]?.longitude === preferences.location.longitude, 'Saved longitude was not used');
    }));

    scenarios.push(scenario('no-shelter', index, 'An empty verified shelter response stays empty and explicit', async () => {
      const source: ShelterSource = { getNearby: async () => [] };
      const feed = await new SafetyResourceService({ source, cache: new MemoryShelterCache(), now: () => new Date(nowIso) }).getFeed(makePreferences(index).location);
      assert(feed.source === 'live' && !feed.isOffline, 'Empty shelter response was treated as a failure');
      assert(feed.shelters.length === 0, 'A shelter was fabricated');
    }));

    scenarios.push(scenario('network-failure', index, 'A network failure returns cached alert data with disclosed freshness', async () => {
      const cache = new MemoryAlertCache();
      cache.value = { alerts: [makeAlert(index)], retrievedAt: index % 2 ? '2026-10-06T19:45:00.000Z' : '2026-10-06T17:00:00.000Z' };
      const source: AlertSource = { getActive: async () => { throw new Error('network timeout'); } };
      const feed = await new LiveAlertService({ source, cache, now: () => new Date(nowIso) }).getFeed(makePreferences(index));
      assert(feed.source === 'cache' && feed.isOffline, 'Cache fallback was not used');
      assert(feed.active[0]?.freshness === (index % 2 ? 'cached' : 'stale'), 'Cache freshness was not disclosed');
    }));

    scenarios.push(scenario('ai-failure', index, 'Unsafe or unavailable AI output falls back to deterministic text', async () => {
      const fallbackCases = [
        async () => { throw new Error('provider unavailable'); },
        async () => { const error = new Error('timeout'); error.name = 'AbortError'; throw error; },
        async () => ({ wrongField: 'invalid schema' }),
        async () => ({ plainSummary: 'Flooding is nearby.' }),
      ];
      const provider = { simplify: fallbackCases[(index - 1) % fallbackCases.length]! };
      const alert = makeAlert(index);
      const result = await new PlainLanguageService({ provider }).simplify(alert);
      assert(result.source === 'deterministic', 'AI failure bypassed deterministic fallback');
      assert(result.summary === alert.summary, 'Fallback changed the deterministic summary');
    }));

    scenarios.push(scenario('preference-change', index, 'Hazard preference changes immediately filter alert visibility', async () => {
      const candidate = makeAlert(index, { hazard: index % 2 ? 'flood' : 'tornado' });
      const source: AlertSource = { getActive: async () => [candidate] };
      const service = new LiveAlertService({ source, cache: new MemoryAlertCache(), now: () => new Date(nowIso) });
      const matching = await service.getFeed(makePreferences(index, { hazards: [candidate.hazard] }));
      const changed = await service.getFeed(makePreferences(index, { hazards: [candidate.hazard === 'flood' ? 'tornado' : 'flood'] }));
      assert(matching.active.length === 1, 'Matching preference hid the alert');
      assert(changed.active.length === 0, 'Changed preference did not hide the alert');
    }));

    scenarios.push(scenario('overlapping-hazards', index, 'Concurrent hazards remain visible and sorted by risk', async () => {
      const source: AlertSource = {
        getActive: async () => [
          makeAlert(index, { id: `flood-${index}`, hazard: 'flood', severity: 'severe' }),
          makeAlert(index + 100, { id: `tornado-${index}`, hazard: 'tornado', severity: 'extreme' }),
          makeAlert(index + 200, { id: `wildfire-${index}`, hazard: 'wildfire', severity: 'moderate' }),
        ],
      };
      const feed = await new LiveAlertService({ source, cache: new MemoryAlertCache(), now: () => new Date(nowIso) }).getFeed(makePreferences(index));
      assert(feed.active.length === 3, 'An overlapping hazard was lost');
      assert(feed.active[0]?.hazard === 'tornado', 'Highest-severity hazard was not first');
      assert(feed.active.every((alert) => alert.doNow.length > 0), 'A supported hazard lacked reviewed actions');
    }));
  }

  [250, 500, 1_000, 2_000].forEach((size, index) => {
    scenarios.push(scenario('large-payload', index + 1, `${size} official-format features normalize without loss`, async () => {
      const payload = { type: 'FeatureCollection', features: Array.from({ length: size }, (_, itemIndex) => makeNwsFeature(itemIndex + 1)) };
      const alerts = parseNwsFeatureCollection(payload, nowIso);
      assert(alerts.length === size, `Expected ${size} alerts and received ${alerts.length}`);
    }));
  });

  for (let index = 1; index <= 8; index += 1) {
    scenarios.push(scenario('offline-shelter-cache', index, 'A cold offline start returns cached shelter data with source and timestamp', async () => {
      const cache = new MemoryShelterCache();
      const retrievedAt = index % 2 ? '2026-10-06T19:55:00.000Z' : '2026-10-06T18:00:00.000Z';
      cache.value = {
        shelters: [{
          id: `shelter-${index}`,
          name: `Verified Shelter ${index}`,
          status: 'open',
          address: '100 Main St, Austin, TX 78701',
          latitude: 30.27,
          longitude: -97.74,
          lastUpdatedAt: retrievedAt,
          source: 'FEMA National Shelter System',
          sourceUrl: 'https://gis.fema.gov/',
          isVerified: true,
        }],
        retrievedAt,
        radiusMiles: 100,
      };
      const source: ShelterSource = { getNearby: async () => { throw new Error('offline'); } };
      const feed = await new SafetyResourceService({ source, cache, now: () => new Date(nowIso) }).getFeed(makePreferences(index).location);
      assert(feed.source === 'cache' && feed.isOffline, 'Cached shelters were not returned offline');
      assert(feed.retrievedAt === retrievedAt, 'Shelter retrieval timestamp was lost');
      assert(feed.shelters[0]?.source === 'FEMA National Shelter System', 'Shelter source was lost');
      assert(feed.isStale === (index % 2 === 0), 'Shelter staleness was not disclosed');
    }));

    scenarios.push(scenario('offline-checklist', index, 'Checklist progress survives a cold repository restart', async () => {
      const storage = new MemoryStorage();
      const firstRepository = new LocalChecklistProgressRepository(storage);
      await firstRepository.setCompleted(`plan-${index}`, new Set([`step-${index}`, `step-${index + 1}`]));
      const restartedRepository = new LocalChecklistProgressRepository(storage);
      const completed = await restartedRepository.getCompleted(`plan-${index}`);
      assert(completed.has(`step-${index}`) && completed.has(`step-${index + 1}`), 'Checklist progress did not survive restart');
    }));
  }

  const corruptCases = [
    async (storage: MemoryStorage) => {
      storage.values.set('alerts:location', '{invalid');
      assert(await new LocalAlertCache(storage).get('location') === null, 'Corrupt alert cache was accepted');
    },
    async (storage: MemoryStorage) => {
      storage.values.set('shelters:location', '{invalid');
      assert(await new LocalShelterCache(storage).get('location') === null, 'Corrupt shelter cache was accepted');
    },
    async (storage: MemoryStorage) => {
      storage.values.set('preferences:guest', '{invalid');
      assert(await new LocalPreferencesRepository(storage).get() === null, 'Corrupt preferences were accepted');
    },
    async (storage: MemoryStorage) => {
      storage.values.set('checklist:plan', '{invalid');
      assert((await new LocalChecklistProgressRepository(storage).getCompleted('plan')).size === 0, 'Corrupt checklist was accepted');
    },
  ];
  corruptCases.forEach((run, index) => {
    scenarios.push(scenario('corrupt-storage', index + 1, 'Corrupt local data fails closed', async () => run(new MemoryStorage())));
  });

  for (let index = 1; index <= 4; index += 1) {
    scenarios.push(scenario('storage-write-failure', index, 'A cache write failure does not discard successful live data', async () => {
      const cache = new MemoryAlertCache();
      cache.failWrite = true;
      const source: AlertSource = { getActive: async () => [makeAlert(index)] };
      const feed = await new LiveAlertService({ source, cache, now: () => new Date(nowIso) }).getFeed(makePreferences(index));
      assert(feed.source === 'live' && feed.active.length === 1 && !feed.isOffline, 'Live data was discarded after cache failure');
    }));
  }

  return scenarios;
}

async function main(): Promise<void> {
  const scenarios = createScenarios();
  const results: ScenarioResult[] = [];
  for (const candidate of scenarios) {
    const startedAt = performance.now();
    try {
      await candidate.run();
      results.push({
        id: candidate.id,
        family: candidate.family,
        expectedOutcome: candidate.expectedOutcome,
        passed: true,
        durationMs: Number((performance.now() - startedAt).toFixed(3)),
      });
    } catch (error) {
      results.push({
        id: candidate.id,
        family: candidate.family,
        expectedOutcome: candidate.expectedOutcome,
        passed: false,
        durationMs: Number((performance.now() - startedAt).toFixed(3)),
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const passed = results.filter((result) => result.passed).length;
  const families = Object.fromEntries([...new Set(results.map((result) => result.family))].sort().map((family) => {
    const familyResults = results.filter((result) => result.family === family);
    return [family, {
      attempted: familyResults.length,
      passed: familyResults.filter((result) => result.passed).length,
      failed: familyResults.filter((result) => !result.passed).length,
    }];
  }));
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    runtime: { node: process.version, platform: process.platform, architecture: process.arch },
    summary: {
      attempted: results.length,
      passed,
      failed: results.length - passed,
      passRatePercent: percentage(passed, results.length),
    },
    families,
    results,
  };
  await writeJson(reportPath, report);

  const familyRows = Object.entries(families)
    .map(([family, values]) => `| ${family} | ${values.attempted} | ${values.passed} | ${values.failed} |`)
    .join('\n');
  const failures = results.filter((result) => !result.passed);
  const failureRows = failures.length
    ? failures.map((result) => `| ${result.id} | ${result.detail ?? 'Unknown failure'} |`).join('\n')
    : '| None | All scenarios passed |';
  const markdown = `# Reliability failure matrix\n\nGenerated: ${report.generatedAt}\n\n## Summary\n\n| Metric | Result |\n| --- | ---: |\n| Attempted scenarios | ${report.summary.attempted} |\n| Passed | ${report.summary.passed} |\n| Failed | ${report.summary.failed} |\n| Pass rate | ${report.summary.passRatePercent}% |\n\n## Scenario families\n\n| Family | Attempted | Passed | Failed |\n| --- | ---: | ---: | ---: |\n${familyRows}\n\n## Failures\n\n| Scenario | Detail |\n| --- | --- |\n${failureRows}\n\nEvery run has a machine-readable record in the JSON report. This harness exercises production domain and application services with controlled adapters. It does not claim device, carrier, or external-service availability.\n`;
  await ensureParent(markdownPath);
  await writeFile(markdownPath, markdown, 'utf8');

  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`JSON report: ${reportPath}`);
  console.log(`Markdown report: ${markdownPath}`);
  if (failures.length) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
