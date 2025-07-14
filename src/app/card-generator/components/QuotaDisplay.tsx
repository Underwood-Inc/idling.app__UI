'use client';

import { InteractiveTooltip } from '../../components/tooltip/InteractiveTooltip';
import { InstantLink } from '../../components/ui/InstantLink';
import { TimestampWithTooltip } from '../../components/ui/TimestampWithTooltip';
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
  resetDate,
  showMeter = false,
  mobile = false,
  welcome = false
}: QuotaDisplayProps) {
  const containerClass = welcome
    ? styles.quota__welcome
    : mobile
      ? styles.quota__mobile
      : styles.quota__section;

  // Calculate dynamic reset time text
  const getResetTimeText = () => {
    if (!resetDate) return '...';

    const now = new Date();
    const reset = new Date(resetDate);
    const diffMs = reset.getTime() - now.getTime();

    if (diffMs <= 0) return 'resetting now';

    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (hours <= 1) return 'within an hour';
    if (hours <= 12) return `in ${hours} hours`;
    if (hours <= 24) return 'tomorrow';
    if (days <= 7) return `in ${days} days`;

    return 'soon';
  };

  // Helper function to render quota text with optional tooltip
  const renderQuotaText = (text: string) => {
    if (!resetDate) {
      return <span className={styles.quota__text}>{text}</span>;
    }

    const tooltipContent = (
      <div style={{ padding: '8px 12px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'white',
            marginBottom: '6px'
          }}
        >
          🔄 Quota Resets
        </div>
        <TimestampWithTooltip
          date={resetDate}
          abbreviated={false}
          showSeconds={true}
        />
      </div>
    );

    return (
      <InteractiveTooltip content={tooltipContent} delay={200}>
        <span
          className={styles.quota__text}
          style={{
            textDecoration: 'underline',
            textDecorationStyle: 'dotted',
            textUnderlineOffset: '2px',
            cursor: 'help'
          }}
        >
          {text}
        </span>
      </InteractiveTooltip>
    );
  };

  const quotaText = hasInitializedQuota
    ? `${remainingGenerations}/${quotaLimit} ${mobile || welcome ? `(resetting ${getResetTimeText()})` : `(resetting ${getResetTimeText()})`}`
    : 'Channeling energy...';

  const simpleQuotaText = `${remainingGenerations} spell remaining (resetting ${getResetTimeText()})`;

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
            {renderQuotaText(quotaText)}
          </div>
        ) : (
          renderQuotaText(simpleQuotaText)
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
