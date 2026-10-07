import { readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';

import app from '../app.json';
import packageJson from '../package.json';

describe('web deployment configuration', () => {
  it('exports one mobile-first SPA with direct-route fallbacks', () => {
    expect(app.expo.web.output).toBe('single');
    expect(packageJson.scripts['build:web']).toBe('expo export --platform web');

    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { rewrites?: unknown[] };
    expect(vercel.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
    expect(readFileSync('public/_redirects', 'utf8').trim()).toBe('/* /index.html 200');
  });

  it('documents only publishable client configuration', () => {
    const example = readFileSync('.env.example', 'utf8');
    expect(example).toContain('EXPO_PUBLIC_SUPABASE_URL=');
    expect(example).toContain('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=');
    expect(example).not.toContain('GEMINI_API_KEY');
    expect(example).not.toContain('SERVICE_ROLE');
  });
});
