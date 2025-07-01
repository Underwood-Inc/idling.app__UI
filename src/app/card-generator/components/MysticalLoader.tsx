'use client';

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
        {/* Mystical spinning crystal */}
        <div className={styles.mystical__crystal}>
          <div className={styles.crystal__core}>🔮</div>
          <div className={styles.crystal__aura}></div>
        </div>

        {/* Floating mystical symbols */}
        <div className={styles.mystical__symbols}>
          <span className={`${styles.symbol} ${styles.symbol__1}`}>✨</span>
          <span className={`${styles.symbol} ${styles.symbol__2}`}>⚡</span>
          <span className={`${styles.symbol} ${styles.symbol__3}`}>🌟</span>
          <span className={`${styles.symbol} ${styles.symbol__4}`}>💫</span>
        </div>

        {/* Loading message */}
        <div className={styles.loading__message}>
          <h3 className={styles.message__title}>🧙‍♂️ Mystical Card Generator</h3>
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
