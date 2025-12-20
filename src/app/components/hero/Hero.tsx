'use client';

import styles from './Hero.module.css';

interface HeroProps {
  title: string;
  subtitle: string;
  accentText?: string;
}

export function Hero({ title, subtitle, accentText }: HeroProps) {
  return (
    <div className={styles.hero}>
      <div className={styles.hero__content}>
        <h1 className={styles.hero__title}>
          {title}
          {accentText && <span className={styles.hero__accent}>{accentText}</span>}
        </h1>
        <p className={styles.hero__subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

