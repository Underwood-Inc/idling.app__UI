'use client';

import { InstantLink } from '../../components/ui/InstantLink';
import { QuotaState } from '../types/generation';
import styles from './QuotaDisplay.module.css';

interface QuotaDisplayProps extends QuotaState {
  showMeter?: boolean;
  mobile?: boolean;
  welcome?: boolean;
}

export function QuotaDisplay({
  remainingGenerations,
  quotaLimit,
  hasInitializedQuota,
  isQuotaExceeded,
  showMeter = false,
  mobile = false,
  welcome = false
}: QuotaDisplayProps) {
  const containerClass = welcome
    ? styles.quota__welcome
    : mobile
      ? styles.quota__mobile
      : styles.quota__section;

  return (
    <div className={containerClass}>
      <h3>⚡ Mystical Energy</h3>
      <div className={styles.quota__display}>
        {showMeter ? (
          <div className={styles.quota__meter}>
            <div className={styles.quota__bar}>
              <div
                className={styles.quota__fill}
                style={{
                  width: `${Math.min((remainingGenerations / quotaLimit) * 100, 100)}%`
                }}
              />
            </div>
            <span className={styles.quota__text}>
              {hasInitializedQuota
                ? `${remainingGenerations}/${quotaLimit} ${mobile || welcome ? 'enchantment today' : 'enchantment today'}`
                : 'Channeling energy...'}
            </span>
          </div>
        ) : (
          <span className={styles.quota__text}>
            {remainingGenerations} spell remaining (until tomorrow)
          </span>
        )}
        {isQuotaExceeded && (
          <InstantLink href="/subscription" className={styles.quota__upgrade}>
            {mobile ? 'Upgrade 🔮' : 'Ascend to Archmage 🔮'}
          </InstantLink>
        )}
      </div>
    </div>
  );
}
