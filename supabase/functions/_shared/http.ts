export const corsHeaders = {
  'Access-Control-Allow-Headers': 'apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

export class FunctionHttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'FunctionHttpError';
  }
}

export function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export async function readBoundedText(stream: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<string> {
  if (!stream) throw new FunctionHttpError('Response or request body is missing', 400);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new FunctionHttpError('Request is too large', 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new FunctionHttpError('Invalid UTF-8 body', 400);
  }
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (contentType !== 'application/json') throw new FunctionHttpError('Content-Type must be application/json', 415);

  const declaredLength = request.headers.get('content-length');
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) throw new FunctionHttpError('Invalid Content-Length', 400);
    if (Number(declaredLength) > maxBytes) throw new FunctionHttpError('Request is too large', 413);
  }

  const text = await readBoundedText(request.body, maxBytes);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new FunctionHttpError('Invalid JSON request', 400);
  }
}

export function inputError(error: unknown): Response {
  if (error instanceof FunctionHttpError) return json({ error: error.message }, error.status);
  return json({ error: error instanceof Error ? error.message : 'Invalid request' }, 400);
}
