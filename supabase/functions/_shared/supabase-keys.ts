type ReadEnvironment = (name: string) => string | undefined;

function parseNamedKeyMap(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => (
      typeof entry[1] === 'string' && entry[1].length > 0
    )));
  } catch {
    return {};
  }
}

export function getPublishableKeys(readEnvironment: ReadEnvironment): string[] {
  return [
    ...Object.values(parseNamedKeyMap(readEnvironment('SUPABASE_PUBLISHABLE_KEYS'))),
    readEnvironment('SUPABASE_ANON_KEY'),
  ].filter((key, index, keys): key is string => Boolean(key) && keys.indexOf(key) === index);
}

export function getDatabaseSecretKey(readEnvironment: ReadEnvironment): string | undefined {
  const namedKeys = parseNamedKeyMap(readEnvironment('SUPABASE_SECRET_KEYS'));
  const modernKey = namedKeys.default
    ?? (Object.keys(namedKeys).length === 1 ? Object.values(namedKeys)[0] : undefined);
  return modernKey ?? readEnvironment('SUPABASE_SERVICE_ROLE_KEY');
}

export function hasValidPublishableKey(request: Request, readEnvironment: ReadEnvironment): boolean {
  const provided = request.headers.get('apikey');
  return Boolean(provided && getPublishableKeys(readEnvironment).includes(provided));
}

export function secretKeyHeaders(secretKey: string): Record<string, string> {
  return {
    apikey: secretKey,
    ...(secretKey.startsWith('eyJ') ? { Authorization: `Bearer ${secretKey}` } : {}),
  };
}
