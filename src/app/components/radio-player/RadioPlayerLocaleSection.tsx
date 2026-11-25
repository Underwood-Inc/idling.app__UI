'use client';

import { LocalePicker } from '../locale/LocalePicker';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import styles from './RadioPlayerBar.module.css';

/** Same picker as the footer: `setLocaleId` + cookie/localStorage — no locale URLs. */
export function RadioPlayerLocaleSection() {
  const { ll } = useIdlingLocale();

  return (
    <div className={styles.panelSection} data-testid="radio-settings-language">
      <h2 className={styles.panelSection__title}>{ll.locale.pickerLabel()}</h2>
      <LocalePicker className="locale-picker--radio-panel" showVisibleLabel={false} />
    </div>
  );
}