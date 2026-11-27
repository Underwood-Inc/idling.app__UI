import {
  IDLING_RADIO_PWA_START_PATH,
  RADIO_PWA_CONTEXT_COOKIE_NAME,
  RADIO_PWA_CONTEXT_COOKIE_VALUE,
} from './constants';

/**
 * Inline in `<head>` before paint — tags DOM, sets/clears PWA cookie, and replaces
 * off-start navigations without waiting for React hydration.
 */
export const RADIO_PWA_STANDALONE_BOOT_SCRIPT = `(function(){try{var s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true||(document.referrer&&document.referrer.indexOf('android-app://')!==-1);var n=${JSON.stringify(RADIO_PWA_CONTEXT_COOKIE_NAME)};var v=${JSON.stringify(RADIO_PWA_CONTEXT_COOKIE_VALUE)};var start=${JSON.stringify(IDLING_RADIO_PWA_START_PATH)};if(s){document.documentElement.dataset.radioPwa='standalone';document.cookie=n+'='+v+';path=/;max-age=31536000;SameSite=Lax';var p=window.location.pathname;if(p!==start){window.location.replace(start+window.location.search+window.location.hash);return;}}else{delete document.documentElement.dataset.radioPwa;document.cookie=n+'=;path=/;max-age=0;SameSite=Lax';}}catch(e){}})();`;