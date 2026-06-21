'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { InstantLink } from '../../components/ui/InstantLink';
import { QuotaDisplay } from './QuotaDisplay';
import styles from './WelcomeInterface.module.css';

interface WelcomeInterfaceProps {
  remainingGenerations: number;
  quotaLimit: number;
  hasInitializedQuota: boolean;
  isQuotaExceeded: boolean;
  resetDate?: Date | null;
  loadGenerationId: string;
  setLoadGenerationId: (id: string) => void;
  onNewGeneration: () => void;
  onLoadGeneration: () => void;
}

export function WelcomeInterface({
  remainingGenerations,
  quotaLimit,
  hasInitializedQuota,
  isQuotaExceeded,
  resetDate,
  loadGenerationId,
  setLoadGenerationId,
  onNewGeneration,
  onLoadGeneration
}: WelcomeInterfaceProps) {
  return (
    <article className={styles.welcome__container}>
      <div className={styles.welcome__container_fade}>
        <div className={styles.welcome__intro}>
          <h2 className={styles.welcome__title}>
            <SiteIcon id="wand" className={styles.welcome__titleIcon} sizeRem={1.25} />
            Enter the Realm of Mystical Creation
            <SiteIcon id="wand" className={styles.welcome__titleIcon} sizeRem={1.25} />
          </h2>
          <p>
            Ancient energies await your command. Choose your sacred path to
            weave enchanted social media cards blessed with mystical geometry
            and profound wisdom.
          </p>
        </div>

        {/* Mobile Quota Display - compact version for welcome interface */}
        <div className={styles.welcome__mobile__quota}>
          <QuotaDisplay
            remainingGenerations={remainingGenerations}
            quotaLimit={quotaLimit}
            hasInitializedQuota={hasInitializedQuota}
            isQuotaExceeded={isQuotaExceeded}
            resetDate={resetDate}
            showMeter
            welcome
          />
        </div>

        <div className={styles.path__buttons}>
          <button
            onClick={onNewGeneration}
            className={`${styles.path__button__large} ${styles.path__button__new}`}
            disabled={!hasInitializedQuota || isQuotaExceeded}
          >
            <div className={styles.button__icon}>
              <SiteIcon id="plusCircle" sizeRem={1.5} />
            </div>
            <div className={styles.button__content}>
              <h3>{hasInitializedQuota ? 'Create New' : 'Loading...'}</h3>
              <p>
                {hasInitializedQuota
                  ? 'Generate a fresh mystical card'
                  : 'Initializing mystical energies...'}
              </p>
            </div>
          </button>

          <button
            onClick={() => setLoadGenerationId(' ')}
            className={`${styles.path__button__large} ${styles.path__button__load}`}
            disabled={!hasInitializedQuota}
          >
            <div className={styles.button__icon}>
              <SiteIcon id="search" sizeRem={1.5} />
            </div>
            <div className={styles.button__content}>
              <h3>{hasInitializedQuota ? 'Load Previous' : 'Loading...'}</h3>
              <p>
                {hasInitializedQuota
                  ? 'Retrieve an existing generation'
                  : 'Initializing mystical energies...'}
              </p>
            </div>
          </button>
        </div>

        {loadGenerationId && (
          <div className={styles.load__input__group}>
            <label className={styles.load__label}>
              <SiteIcon id="wand" className={styles.load__labelIcon} sizeRem={1} />
              Generation ID:
            </label>
            <div className={styles.load__input__container}>
              <input
                type="text"
                value={loadGenerationId}
                onChange={(e) => setLoadGenerationId(e.target.value)}
                placeholder="Paste your generation ID here..."
                className={styles.load__input}
              />
              <button
                onClick={onLoadGeneration}
                className={styles.load__button}
                disabled={!loadGenerationId.trim()}
              >
                Load
                <SiteIcon id="wand" className={styles.load__buttonIcon} sizeRem={0.875} />
              </button>
            </div>
            <p className={styles.load__help}>
              <SiteIcon id="lightbulb" className={styles.load__helpIcon} sizeRem={0.875} />
              Generation IDs look like:{' '}
              <code>01234567-89ab-cdef-0123-456789abcdef</code>
            </p>
          </div>
        )}

        {isQuotaExceeded && (
          <div className={styles.quota__notice}>
            <p>
              <SiteIcon id="zap" className={styles.quota__noticeIcon} sizeRem={1} />
              Daily quota reached!
            </p>
            <InstantLink href="/subscription" className={styles.upgrade__link}>
              Upgrade to Pro for unlimited generations
              <SiteIcon id="rocket" className={styles.upgrade__linkIcon} sizeRem={0.875} />
            </InstantLink>
          </div>
        )}
      </div>
    </article>
  );
}
