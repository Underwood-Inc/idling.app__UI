'use client';

import { isStandalonePwa } from '@lib/radio-pwa/isStandalonePwa';
import type { NavigatorWithWindowControlsOverlay } from '@lib/radio-pwa/windowControlsOverlay.types';
import { useEffect, useState } from 'react';
import styles from './RadioPwaWindowControlsOverlay.module.css';

/**
 * Invisible drag handle for Edge/Chrome window-controls-overlay PWAs
 * after the user hides the default title bar.
 */
export function RadioPwaWindowControlsOverlay() {
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    if (!isStandalonePwa()) {
      return undefined;
    }

    const overlay = (navigator as NavigatorWithWindowControlsOverlay).windowControlsOverlay;
    if (!overlay) {
      return undefined;
    }

    const syncVisibility = () => {
      setOverlayVisible(overlay.visible);
    };

    syncVisibility();
    overlay.addEventListener('geometrychange', syncVisibility);

    return () => {
      overlay.removeEventListener('geometrychange', syncVisibility);
    };
  }, []);

  if (!overlayVisible) {
    return null;
  }

  return (
    <div
      className={styles.dragRegion}
      aria-hidden="true"
      data-testid="radio-pwa-wco-drag"
    />
  );
}
