import { describe, expect, it } from '@jest/globals';

import {
  getDatabaseSecretKey,
  getPublishableKeys,
  hasValidPublishableKey,
  secretKeyHeaders,
} from '../supabase/functions/_shared/supabase-keys';

function environment(values: Record<string, string | undefined>) {
  return (name: string) => values[name];
}

describe('Supabase hosted key contract', () => {
  it('reads modern named key dictionaries and accepts a matching apikey', () => {
    const readEnvironment = environment({
      SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'sb_publishable_default', mobile: 'sb_publishable_mobile' }),
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'sb_secret_default' }),
    });
    const request = new Request('https://example.test', { headers: { apikey: 'sb_publishable_mobile' } });

    expect(getPublishableKeys(readEnvironment)).toEqual(['sb_publishable_default', 'sb_publishable_mobile']);
    expect(getDatabaseSecretKey(readEnvironment)).toBe('sb_secret_default');
    expect(hasValidPublishableKey(request, readEnvironment)).toBe(true);
  });

  it('supports legacy hosted keys without sending new secret keys as bearer tokens', () => {
    const legacy = environment({ SUPABASE_ANON_KEY: 'legacy-anon', SUPABASE_SERVICE_ROLE_KEY: 'legacy-secret' });

    expect(getPublishableKeys(legacy)).toEqual(['legacy-anon']);
    expect(getDatabaseSecretKey(legacy)).toBe('legacy-secret');
    expect(secretKeyHeaders('sb_secret_default')).toEqual({ apikey: 'sb_secret_default' });
    expect(secretKeyHeaders('eyJlegacy')).toEqual({ apikey: 'eyJlegacy', Authorization: 'Bearer eyJlegacy' });
  });

  it('selects the named default secret and rejects an ambiguous modern key dictionary', () => {
    expect(getDatabaseSecretKey(environment({
      SUPABASE_SECRET_KEYS: JSON.stringify({ rotated: 'sb_secret_rotated', default: 'sb_secret_default' }),
    }))).toBe('sb_secret_default');
    expect(getDatabaseSecretKey(environment({
      SUPABASE_SECRET_KEYS: JSON.stringify({ first: 'sb_secret_first', second: 'sb_secret_second' }),
    }))).toBeUndefined();
  });
});
