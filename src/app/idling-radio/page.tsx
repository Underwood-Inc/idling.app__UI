import { AdUnit } from '../components/ad-unit';
import { RadioPwaLaunchGuard } from '../components/radio-pwa/RadioPwaLaunchGuard';
import styles from './idling-radio.module.css';

/** Radio PWA shell — reachable only in standalone display mode (see launch guard). */
export default function IdlingRadioPage() {
  return (
    <RadioPwaLaunchGuard>
      <div className={styles.shell}>
        <AdUnit className={`ad-unit--footer ${styles.ad}`} testId="radio-pwa-ad" />
      </div>
    </RadioPwaLaunchGuard>
  );
}
