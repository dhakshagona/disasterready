import { describe, expect, it } from '@jest/globals';

import { FunctionHttpError, readBoundedJson } from '../supabase/functions/_shared/http';

describe('Edge Function HTTP contract', () => {
  it('accepts a JSON request without relying on Content-Length', async () => {
    const request = new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ value: true }),
    });

    await expect(readBoundedJson(request, 100)).resolves.toEqual({ value: true });
  });

  it('rejects oversized chunked bodies after reading the actual bytes', async () => {
    const request = new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'x'.repeat(200) }),
    });

    await expect(readBoundedJson(request, 100)).rejects.toEqual(expect.objectContaining({ status: 413 } as Partial<FunctionHttpError>));
  });

  it('rejects malformed lengths and unsupported content types', async () => {
    const invalidLength = new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': 'invalid' },
      body: '{}',
    });
    const wrongType = new Request('https://example.test', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: '{}',
    });

    await expect(readBoundedJson(invalidLength, 100)).rejects.toEqual(expect.objectContaining({ status: 400 } as Partial<FunctionHttpError>));
    await expect(readBoundedJson(wrongType, 100)).rejects.toEqual(expect.objectContaining({ status: 415 } as Partial<FunctionHttpError>));
  });
});
