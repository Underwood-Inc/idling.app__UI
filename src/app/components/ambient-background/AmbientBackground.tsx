'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './AmbientBackground.module.css';
import {
  ambientStarToStyle,
  createAmbientStarfield,
  getAmbientStarfieldCounts,
  type AmbientStar,
  type AmbientStarfield,
  type AmbientStarTier,
  type AmbientStarTone,
} from './ambientBackground.utils';

const EMPTY_STARFIELD: AmbientStarfield = {
  dustBoxShadow: '',
  mediumBoxShadow: '',
  animatedStars: [],
};

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

export function AmbientBackground() {
  const [starfield, setStarfield] = useState<AmbientStarfield>(EMPTY_STARFIELD);
  const starfieldKeyRef = useRef('');

  useEffect(() => {
    const updateStarfield = () => {
      const counts = getAmbientStarfieldCounts(window.innerWidth);
      const nextKey = `${counts.dust}-${counts.medium}-${counts.twinkle}-${counts.cross}-${counts.spark}`;

      if (nextKey === starfieldKeyRef.current) {
        return;
      }

      starfieldKeyRef.current = nextKey;
      setStarfield(createAmbientStarfield(counts));
    };

    updateStarfield();
    window.addEventListener('resize', updateStarfield);

    return () => {
      window.removeEventListener('resize', updateStarfield);
    };
  }, []);

  return (
    <div className={styles.ambient} aria-hidden="true" data-testid="ambient-background">
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

      <div className={styles.stars}>
        {starfield.dustBoxShadow ? (
          <span
            className={styles.stars__dust}
            style={{ boxShadow: starfield.dustBoxShadow }}
          />
        ) : null}
        {starfield.mediumBoxShadow ? (
          <span
            className={styles.stars__medium}
            style={{ boxShadow: starfield.mediumBoxShadow }}
          />
        ) : null}
        {starfield.animatedStars.map((star) => (
          <span
            key={star.id}
            className={starClassName(star)}
            style={ambientStarToStyle(star)}
          >
            {star.tier === 'cross' ? <span className={styles.star__flare} /> : null}
            {star.tier === 'spark' ? <span className={styles.star__spark} /> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
