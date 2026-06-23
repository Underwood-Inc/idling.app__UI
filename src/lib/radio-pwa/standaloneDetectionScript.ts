/** Inline in <head> before paint — hides site chrome when launched as installed radio PWA. */
export const RADIO_PWA_STANDALONE_DETECTION_SCRIPT = `(function(){try{var s=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true||document.referrer.indexOf('android-app://')!==-1;if(s){document.documentElement.dataset.radioPwa='standalone'}}catch(e){}})();`;
