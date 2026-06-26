'use client';

import styles from './AmbientBackground.module.css';
import { AmbientSkyEffectsLayer } from './AmbientSkyEffectsLayer';
import { useAmbientStarfield } from './AmbientStarfieldProvider';

export function AmbientBackground() {
  const starfield = useAmbientStarfield();

  return (
    <div className={styles.ambient} aria-hidden="true" data-testid="ambient-background">
      <AmbientSkyEffectsLayer starfield={starfield} />
    </div>
  );
}
