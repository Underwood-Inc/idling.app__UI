'use client';

import { InstantLink } from '../../components/ui/InstantLink';
import styles from '../page.module.css';
import { QuotaState } from '../types/generation';

interface QuotaDisplayProps extends QuotaState {
  showMeter?: boolean;
}

export function QuotaDisplay({
  remainingGenerations,
  hasInitializedQuota,
  isQuotaExceeded,
  showMeter = false
}: QuotaDisplayProps) {
  return (
    <div className={styles.quota__section}>
      <h3>⚡ Mystical Energy</h3>
      <div className={styles.quota__display}>
        {showMeter ? (
          <div className={styles.quota__meter}>
            <div className={styles.quota__bar}>
              <div
                className={styles.quota__fill}
                style={{ width: `${(remainingGenerations / 10) * 100}%` }}
              />
            </div>
            <span className={styles.quota__text}>
              {hasInitializedQuota
                ? `${remainingGenerations}/10 enchantments today`
                : 'Channeling energy...'}
            </span>
          </div>
        ) : (
          <span className={styles.quota__text}>
            {remainingGenerations}/10 spells remaining
          </span>
        )}
        {isQuotaExceeded && (
          <InstantLink href="/subscription" className={styles.quota__upgrade}>
            Ascend to Archmage 🔮
          </InstantLink>
        )}
      </div>
    </div>
  );
}
