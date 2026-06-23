'use client';

import { syncRadioPwaDomContext } from '@lib/radio-pwa/radioPwaClientContext';
import { useLayoutEffect } from 'react';

/** Sets `data-radio-pwa` on `<html>` after hydration for installed-PWA styling. */
export function RadioPwaContextBootstrap() {
  useLayoutEffect(() => {
    syncRadioPwaDomContext();
  }, []);

  return null;
}
