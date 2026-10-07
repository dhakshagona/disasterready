import { readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';

import packageJson from '../package.json';

const baseMigration = readFileSync('supabase/migrations/20260808020000_create_analytics_events.sql', 'utf8');
const hardeningMigration = readFileSync('supabase/migrations/20260808100000_harden_backend.sql', 'utf8');
const rateLimitFixMigration = readFileSync('supabase/migrations/20260808120000_fix_rate_limit_timestamp.sql', 'utf8');
const analyticsRpcMigration = readFileSync('supabase/migrations/20260808130000_add_analytics_ingestion_rpc.sql', 'utf8');
const functionFiles = [
  'supabase/functions/record-events/index.ts',
  'supabase/functions/simplify-alert/index.ts',
  'supabase/functions/shelter-proxy/index.ts',
];

describe('Supabase backend configuration', () => {
  it('keeps analytics private and limits the service role to the ingestion RPC', () => {
    expect(baseMigration).toContain('enable row level security');
    expect(baseMigration).toContain('revoke all on table public.analytics_events from anon, authenticated');
    expect(hardeningMigration).toContain('revoke all on table public.analytics_events from service_role');
    expect(analyticsRpcMigration).toContain('revoke all on table public.analytics_events from service_role');
    expect(analyticsRpcMigration).toContain('public.ingest_analytics_events');
    expect(analyticsRpcMigration).toContain('grant execute on function public.ingest_analytics_events(jsonb) to service_role');
    expect(hardeningMigration).not.toContain('grant all on table public.analytics_events to service_role');
  });

  it('defines protected rate limiting, receipt-time reporting, and retention', () => {
    expect(hardeningMigration).toContain('private.edge_rate_limits');
    expect(hardeningMigration).toContain('public.consume_edge_rate_limits');
    expect(hardeningMigration).toContain('p_checks jsonb');
    expect(hardeningMigration).toContain('check_limit > 1000000');
    expect(hardeningMigration).toContain('pg_advisory_xact_lock');
    expect(hardeningMigration).toContain("date_trunc('day', received_at at time zone 'UTC')");
    expect(hardeningMigration).toContain('public.delete_expired_analytics_events');
    expect(hardeningMigration).toContain('public.delete_expired_edge_rate_limits');
    expect(rateLimitFixMigration).toContain('rate_time timestamptz := statement_timestamp()');
    expect(rateLimitFixMigration).toContain('stored_window <= rate_time');
  });

  it('keeps every deployed Edge Function import inside the function bundle', () => {
    for (const file of functionFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/from ['"]\.\.\/\.\.\//);
    }
  });

  it('pins the deployment CLI and declares every public function', () => {
    expect(packageJson.devDependencies.supabase).toBe('2.113.0');
    const config = readFileSync('supabase/config.toml', 'utf8');
    expect(config).toContain('[functions.record-events]');
    expect(config).toContain('[functions.simplify-alert]');
    expect(config).toContain('[functions.shelter-proxy]');
  });
});
