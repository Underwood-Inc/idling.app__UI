'use client';

import { DASHBOARD_COPY } from './productMarketing';
import { HomeProductHub } from './HomeProductHub';
import styles from './marketing-dashboard.module.css';

export function MarketingProductExplorer() {
  return (
    <>
      <header className={styles.dash__masthead}>
        <h1 className={styles.dash__title}>{DASHBOARD_COPY.title}</h1>
        <p className={styles.dash__line}>{DASHBOARD_COPY.line}</p>
        <div className={styles.dash__actions}>
          <a href="#products" className={`${styles.dash__cta} contrast-safe-surface contrast-safe-surface--cta-primary`}>
            See the lineup
          </a>
        </div>
      </header>

      <HomeProductHub />
    </>
  );
}