import { AdUnit } from '../components/ad-unit';
import styles from './idling-radio.module.css';

/** Radio PWA shell — reachable only in standalone display mode (see layout guard). */
export default function IdlingRadioPage() {
  return (
    <div className={styles.shell}>
      <AdUnit className={`ad-unit--footer ${styles.ad}`} testId="radio-pwa-ad" />
    </div>
  );
}
