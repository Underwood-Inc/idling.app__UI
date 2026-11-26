const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIpv4(host: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) {
    return false;
  }

  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((octet) => octet > 255)) {
    return false;
  }

  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return true;
  }

  return false;
}

/** Playlist URLs the server may fetch on behalf of the browser. */
export function isFetchableRadioPlaylistUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.username || parsed.password) {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    host === '::1' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    BLOCKED_HOSTS.has(host)
  ) {
    return false;
  }

  return !isPrivateIpv4(host);
}
