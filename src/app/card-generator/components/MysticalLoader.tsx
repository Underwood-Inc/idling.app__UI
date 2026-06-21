'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import styles from './MysticalLoader.module.css';

interface MysticalLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export function MysticalLoader({
  message = 'Channeling mystical energies...',
  fullScreen = false
}: MysticalLoaderProps) {
  const containerClass = fullScreen
    ? styles.loading__fullscreen
    : styles.loading__container;

  return (
    <div className={containerClass}>
      <div className={styles.loading__content}>
        <div className={styles.mystical__crystal}>
          <div className={styles.crystal__core}>
            <SiteIcon id="wand" sizeRem={2} />
          </div>
          <div className={styles.crystal__aura}></div>
        </div>

        <div className={styles.mystical__symbols}>
          <span className={`${styles.symbol} ${styles.symbol__1}`}>
            <SiteIcon id="sparkles" sizeRem={1.25} />
          </span>
          <span className={`${styles.symbol} ${styles.symbol__2}`}>
            <SiteIcon id="zap" sizeRem={1.25} />
          </span>
          <span className={`${styles.symbol} ${styles.symbol__3}`}>
            <SiteIcon id="star" sizeRem={1.25} />
          </span>
          <span className={`${styles.symbol} ${styles.symbol__4}`}>
            <SiteIcon id="orbit" sizeRem={1.25} />
          </span>
        </div>

        <div className={styles.loading__message}>
          <h3 className={styles.message__title}>
            <SiteIcon id="wand" className={styles.message__titleIcon} sizeRem={1.25} />
            Mystical Card Generator
          </h3>
          <p className={styles.message__text}>{message}</p>
          <div className={styles.loading__dots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
