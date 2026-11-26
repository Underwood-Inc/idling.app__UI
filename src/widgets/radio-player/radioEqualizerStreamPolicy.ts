/** Origin the equalizer sends when it attaches a cross-origin stream. */
export const IDLING_RADIO_EQUALIZER_ORIGIN = 'https://idling.app';

export function accessControlAllowsEqualizer(
  accessControlAllowOrigin: string | null,
  origin: string = IDLING_RADIO_EQUALIZER_ORIGIN
): boolean {
  const value = accessControlAllowOrigin?.trim() ?? '';
  return value === '*' || value.toLowerCase() === origin.toLowerCase();
}

/**
 * Why a resolved stream cannot feed the equalizer.
 * Returns null when HTTPS, a successful status, and a usable CORS header are all present.
 */
export function equalizerStreamRejection(input: {
  finalUrl: string;
  status: number;
  accessControlAllowOrigin: string | null;
}): string | null {
  if (!input.finalUrl.startsWith('https://')) {
    return 'Stream URL is not HTTPS';
  }

  if (input.status !== 200 && input.status !== 206) {
    return `HTTP ${input.status}`;
  }

  if (!accessControlAllowsEqualizer(input.accessControlAllowOrigin)) {
    return 'Missing Access-Control-Allow-Origin for https://idling.app';
  }

  return null;
}
