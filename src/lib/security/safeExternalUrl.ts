import dns from 'node:dns/promises';
import net from 'node:net';

export interface SafeExternalUrlFailure {
  ok: false;
  reason: string;
}

export interface SafeExternalUrlSuccess {
  ok: true;
  targetUrl: string;
  baseUrl: string;
}

export type SafeExternalUrlResult = SafeExternalUrlFailure | SafeExternalUrlSuccess;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.goog'
]);

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return true;
  }

  if (parts[0] === 0 || parts[0] === 10 || parts[0] === 127) {
    return true;
  }

  if (parts[0] === 169 && parts[1] === 254) {
    return true;
  }

  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }

  if (parts[0] === 192 && parts[1] === 168) {
    return true;
  }

  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) {
    return true;
  }

  return false;
}

function isBlockedIpAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return isBlockedIpv4(ip);
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();

    if (
      normalized === '::1' ||
      normalized.startsWith('fe80:') ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd')
    ) {
      return true;
    }

    if (normalized.startsWith('::ffff:')) {
      return isBlockedIpv4(normalized.slice(7));
    }
  }

  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');

  if (BLOCKED_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (normalized.endsWith('.localhost') || normalized.endsWith('.local')) {
    return true;
  }

  if (net.isIP(normalized)) {
    return isBlockedIpAddress(normalized);
  }

  return false;
}

async function resolveHostname(hostname: string): Promise<string[]> {
  const results = await dns.lookup(hostname, { all: true, verbatim: true });
  return results.map((entry) => entry.address);
}

export async function resolveSafeExternalUrl(
  rawUrl: string,
  appOrigin: string
): Promise<SafeExternalUrlResult> {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return { ok: false, reason: 'URL is required' };
  }

  let parsed: URL;

  try {
    if (trimmed.startsWith('/')) {
      parsed = new URL(trimmed, appOrigin);
    } else {
      parsed = new URL(trimmed);
    }
  } catch {
    return { ok: false, reason: 'Invalid URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs are allowed' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'URLs with credentials are not allowed' };
  }

  const hostname = parsed.hostname;

  if (isBlockedHostname(hostname)) {
    return { ok: false, reason: 'Target host is not allowed' };
  }

  if (!net.isIP(hostname)) {
    try {
      const addresses = await resolveHostname(hostname);

      if (addresses.some((address) => isBlockedIpAddress(address))) {
        return { ok: false, reason: 'Target host resolves to a blocked address' };
      }
    } catch {
      return { ok: false, reason: 'Unable to resolve target host' };
    }
  }

  return {
    ok: true,
    targetUrl: parsed.toString(),
    baseUrl: parsed.origin
  };
}
