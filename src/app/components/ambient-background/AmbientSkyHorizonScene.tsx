'use client';

import type { CSSProperties, ReactNode } from 'react';
import styles from './AmbientBackground.module.css';
import { AmbientSkyEffectsLayer } from './AmbientSkyEffectsLayer';
import { useAmbientStarfield } from './AmbientStarfieldProvider';

export const AMBIENT_HORIZON_CLIP_BOTTOM_VAR = '--ambient-horizon-clip-bottom';

export interface AmbientSkyHorizonSceneProps {
  /** Normalized height of the water band from the bottom (0–1). Sky occupies the rest. */
  horizonRatio: number;
  reflect?: boolean;
  /** Rendered between the clipped sky and the water reflection (e.g. WebGL canvas). */
  children?: ReactNode;
}

export interface AmbientSkyHorizonLayerProps {
  horizonRatio: number;
  variant: 'sky' | 'reflection';
}

export function buildAmbientHorizonClipStyle(horizonRatio: number): CSSProperties {
  const clamped = Math.max(0.05, Math.min(0.95, horizonRatio));
  return {
    [AMBIENT_HORIZON_CLIP_BOTTOM_VAR]: `${(clamped * 100).toFixed(4)}%`,
  } as CSSProperties;
}

/** Single sky or reflection band; use two instances with WebGL between when layering order matters. */
export function AmbientSkyHorizonLayer({ horizonRatio, variant }: AmbientSkyHorizonLayerProps) {
  const starfield = useAmbientStarfield();
  const horizonStyle = buildAmbientHorizonClipStyle(horizonRatio);

  if (variant === 'sky') {
    return (
      <div
        className={styles.skyHorizon__sky}
        style={horizonStyle}
        aria-hidden="true"
        data-testid="ambient-sky-horizon-sky"
      >
        <AmbientSkyEffectsLayer starfield={starfield} />
      </div>
    );
  }

  return (
    <div
      className={styles.skyHorizon__reflection}
      style={horizonStyle}
      aria-hidden="true"
      data-testid="ambient-sky-horizon-reflection"
    >
      <div className={styles.skyHorizon__reflectionInner}>
        <AmbientSkyEffectsLayer starfield={starfield} />
      </div>
    </div>
  );
}

/**
 * Clips {@link AmbientSkyEffectsLayer} to the sky band and optionally mirrors it into the water band.
 * Pass `children` when another layer (e.g. WebGL) must sit between sky and reflection.
 */
export function AmbientSkyHorizonScene({
  horizonRatio,
  reflect = true,
  children,
}: AmbientSkyHorizonSceneProps) {
  return (
    <>
      <AmbientSkyHorizonLayer horizonRatio={horizonRatio} variant="sky" />
      {children}
      {reflect ? (
        <AmbientSkyHorizonLayer horizonRatio={horizonRatio} variant="reflection" />
      ) : null}
    </>
  );
}
