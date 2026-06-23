import { IDLING_RADIO_PWA_START_PATH } from './constants';

/** Inline in <head> before paint — tags standalone and enters the radio shell URL immediately. */
export const RADIO_PWA_STANDALONE_DETECTION_SCRIPT = `(function(){try{var s=window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||window.navigator.standalone===true||document.referrer.indexOf('android-app://')!==-1;if(!s){return}document.documentElement.dataset.radioPwa='standalone';var radioPath='${IDLING_RADIO_PWA_START_PATH}';if(location.pathname.indexOf(radioPath)!==0){location.replace(radioPath+'/')}}catch(e){}})();`;
