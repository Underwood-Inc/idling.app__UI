'use client';

import styles from './AmbientBackground.module.css';
import { ambientStarToStyle, type AmbientStar, type AmbientStarfield } from './ambientBackground.utils';
import type { AmbientStarTier, AmbientStarTone } from './ambientBackground.utils';

const STAR_TIER_CLASS: Record<AmbientStarTier, string> = {
  twinkle: styles['star--twinkle'] ?? '',
  cross: styles['star--cross'] ?? '',
  spark: styles['star--spark'] ?? '',
};

const STAR_TONE_CLASS: Record<AmbientStarTone, string> = {
  warm: styles['star--tone-warm'] ?? '',
  cool: styles['star--tone-cool'] ?? '',
  pink: styles['star--tone-pink'] ?? '',
};

function starClassName(star: AmbientStar): string {
  return [styles.star, STAR_TIER_CLASS[star.tier], STAR_TONE_CLASS[star.tone]]
    .filter(Boolean)
    .join(' ');
}

export interface AmbientStarfieldLayerProps {
  starfield: AmbientStarfield;
}

/** Site starfield — dust, medium, and animated twinkle / cross / spark tiers. */
export function AmbientStarfieldLayer({ starfield }: AmbientStarfieldLayerProps) {
  return (
    <div className={styles.stars}>
      {starfield.dustBoxShadow ? (
        <span className={styles.stars__dust} style={{ boxShadow: starfield.dustBoxShadow }} />
      ) : null}
      {starfield.mediumBoxShadow ? (
        <span className={styles.stars__medium} style={{ boxShadow: starfield.mediumBoxShadow }} />
      ) : null}
      {starfield.animatedStars.map((star) => (
        <span key={star.id} className={starClassName(star)} style={ambientStarToStyle(star)}>
          {star.tier === 'cross' ? <span className={styles.star__flare} /> : null}
          {star.tier === 'spark' ? <span className={styles.star__spark} /> : null}
        </span>
      ))}
    </div>
  );
}
