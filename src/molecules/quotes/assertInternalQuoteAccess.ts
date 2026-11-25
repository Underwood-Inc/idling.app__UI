import type { NextRequest } from 'next/server';

export interface InternalQuoteAccessResult {
  allowed: boolean;
  reason?: string;
}

const DEFAULT_HOSTS = new Set([
  'idling.app',
  'www.idling.app',
  'localhost',
  'localhost:3000',
  '127.0.0.1',
  '127.0.0.1:3000',
]);

function hostAllowed(host: string | null): boolean {
  if (!host) {
    return false;
  }
  const normalized = host.toLowerCase();
  if (DEFAULT_HOSTS.has(normalized)) {
    return true;
  }
  const envHosts =
    process.env.IDLING_QUOTE_ALLOWED_HOSTS?.split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean) ?? [];
  return envHosts.includes(normalized);
}

function serverSecretMatches(request: NextRequest): boolean {
  const expected = process.env.IDLING_INTERNAL_QUOTE_SECRET;
  if (!expected) {
    return false;
  }
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${expected}`) {
    return true;
  }
  return request.headers.get('x-idling-internal-quote') === expected;
}

export function assertInternalQuoteAccess(
  request: NextRequest
): InternalQuoteAccessResult {
  if (serverSecretMatches(request)) {
    return { allowed: true };
  }

  const host = request.headers.get('host');
  if (!hostAllowed(host)) {
    return { allowed: false, reason: 'host_not_allowed' };
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') {
    return { allowed: false, reason: 'cross_site' };
  }

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      if (!hostAllowed(originHost)) {
        return { allowed: false, reason: 'origin_not_allowed' };
      }
    } catch {
      return { allowed: false, reason: 'invalid_origin' };
    }
  }

  if (fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none') {
    return { allowed: true };
  }

  if (!fetchSite && hostAllowed(host)) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'forbidden' };
}