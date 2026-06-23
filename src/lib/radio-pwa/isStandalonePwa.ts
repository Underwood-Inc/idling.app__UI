export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  if (navigatorWithStandalone.standalone === true) {
    return true;
  }

  if (document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
}
