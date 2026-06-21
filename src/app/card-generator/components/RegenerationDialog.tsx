'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import styles from './RegenerationDialog.module.css';

interface RegenerationDialogProps {
  isOpen: boolean;
  onChoice: (choice: 'same' | 'random') => void;
  onClose: () => void;
}

export function RegenerationDialog({
  isOpen,
  onChoice,
  onClose
}: RegenerationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.dialog__overlay}>
      <div className={styles.dialog__container}>
        <div className={styles.dialog__header}>
          <h3 className={styles.dialog__title}>
            <SiteIcon id="wand" className={styles.dialog__titleIcon} sizeRem={1.125} />
            Regeneration Options
          </h3>
          <button
            onClick={onClose}
            className={styles.dialog__close}
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className={styles.dialog__content}>
          <p className={styles.dialog__message}>
            You haven&apos;t changed any form values since the last generation.
            How would you like to proceed?
          </p>

          <div className={styles.dialog__options}>
            <button
              onClick={() => onChoice('same')}
              className={`${styles.dialog__button} ${styles.dialog__button__primary}`}
            >
              <div className={styles.dialog__button__icon}>
                <SiteIcon id="refresh" sizeRem={1.25} />
              </div>
              <div className={styles.dialog__button__content}>
                <h4>Same Configuration</h4>
                <p>Regenerate with current settings</p>
              </div>
            </button>

            <button
              onClick={() => onChoice('random')}
              className={`${styles.dialog__button} ${styles.dialog__button__secondary}`}
            >
              <div className={styles.dialog__button__icon}>
                <SiteIcon id="dices" sizeRem={1.25} />
              </div>
              <div className={styles.dialog__button__content}>
                <h4>Use Random</h4>
                <p>Clear form and generate with random values</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
