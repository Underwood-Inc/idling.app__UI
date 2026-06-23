/** Manifest start_url only — not linked from site navigation; browser visits are redirected. */
export const IDLING_RADIO_PWA_START_PATH = '/idling-radio';

/** Must match the `id` field in public/idling-radio.webmanifest (Web Install API manifest_id). */
export const IDLING_RADIO_PWA_MANIFEST_ID = '/idling-radio';

export const IDLING_RADIO_PWA_SHELL_HEADER = 'x-idling-radio-shell';

export const RADIO_PWA_MANIFEST_HREF = '/idling-radio.webmanifest';

export const RADIO_PWA_INSTALLED_STORAGE_KEY = 'idling-radio-pwa-installed';

export const RADIO_PWA_INSTALL_READY_EVENT = 'idling-radio-install-ready';

/** Public PWA assets that must bypass auth (manifests, service worker). */
export const PWA_PUBLIC_ASSET_PATHS = [
  '/manifest.json',
  '/idling-radio.webmanifest',
  '/sw.js',
  '/offline.html',
] as const;

export function isPwaPublicAssetPath(pathname: string): boolean {
  return (PWA_PUBLIC_ASSET_PATHS as readonly string[]).includes(pathname);
}
