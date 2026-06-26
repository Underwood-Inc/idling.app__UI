'use client';

import styles from './AmbientBackground.module.css';
import { AmbientStarfieldLayer } from './AmbientStarfieldLayer';
import type { AmbientStarfield } from './ambientBackground.utils';

export interface AmbientSkyEffectsLayerProps {
  starfield: AmbientStarfield;
}

/** Nebula, aurora, depth, audio-reactive pulses, and stars — shared by site background and starry horizon. */
export function AmbientSkyEffectsLayer({ starfield }: AmbientSkyEffectsLayerProps) {
  return (
    <div className={styles.skyEffects} aria-hidden="true">
      <div className={styles.nebula}>
        <div className={`${styles.nebula__cloud} ${styles['nebula__cloud--violet']}`} />
        <div className={`${styles.nebula__cloud} ${styles['nebula__cloud--gold']}`} />
        <div className={`${styles.nebula__cloud} ${styles['nebula__cloud--teal']}`} />
      </div>

      <div className={styles.audioReactive} aria-hidden="true">
        <div className={`${styles.audioReactive__pulse} ${styles['audioReactive__pulse--bass']}`} />
        <div className={`${styles.audioReactive__pulse} ${styles['audioReactive__pulse--mid']}`} />
        <div className={`${styles.audioReactive__pulse} ${styles['audioReactive__pulse--treble']}`} />
      </div>

      <div className={styles.depth}>
        <div className={`${styles.depth__layer} ${styles['depth__layer--one']}`} />
        <div className={`${styles.depth__layer} ${styles['depth__layer--two']}`} />
        <div className={`${styles.depth__layer} ${styles['depth__layer--three']}`} />
      </div>

      <div className={styles.aurora}>
        <div className={`${styles.aurora__wash} ${styles['aurora__wash--primary']}`} />
        <div className={`${styles.aurora__wash} ${styles['aurora__wash--secondary']}`} />
      </div>

      <AmbientStarfieldLayer starfield={starfield} />
    </div>
  );
}
