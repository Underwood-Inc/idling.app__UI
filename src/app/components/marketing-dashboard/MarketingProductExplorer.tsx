'use client';

import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { HomeProductHub } from './HomeProductHub';
import styles from './marketing-dashboard.module.css';

export function MarketingProductExplorer() {
  const { ll } = useIdlingLocale();

  return (
    <>
      <header className={styles.dash__masthead}>
        <h1 className={styles.dash__title}>{ll.home.masthead.title()}</h1>
        <p className={styles.dash__line}>{ll.home.masthead.line()}</p>
        <div className={styles.dash__actions}>
          <a href="#products" className={`${styles.dash__cta} contrast-safe-surface contrast-safe-surface--cta-primary`}>
            {ll.home.masthead.ctaSeeLineup()}
          </a>
        </div>
      </header>

      <HomeProductHub />
    </>
  );
}