/** Installed radio PWA entry URL (manifest start_url). */
export const IDLING_RADIO_PWA_START_PATH = '/';

export const IDLING_RADIO_PWA_SHELL_HEADER = 'x-idling-radio-shell';

/** Set in standalone display mode so the server can render the radio-only shell. */
export const RADIO_PWA_CONTEXT_COOKIE_NAME = 'idling-radio-pwa';

export const RADIO_PWA_CONTEXT_COOKIE_VALUE = 'standalone';

/** Prevents infinite reload while the PWA context cookie is being established. */
export const RADIO_PWA_BOOT_GUARD_KEY = 'idling-radio-pwa-boot';

/** Prevents infinite reload while restoring a regular browser session after PWA cookie cleanup. */
export const RADIO_PWA_BROWSER_RESTORE_KEY = 'idling-radio-browser-restore';

export const RADIO_PWA_MANIFEST_HREF = '/idling-radio.webmanifest';

/** Matches manifest theme_color — dark chrome blends with the radio shell. */
export const RADIO_PWA_THEME_COLOR = '#0a0a0e';

export const RADIO_PWA_BACKGROUND_COLOR = '#0a0a0e';
