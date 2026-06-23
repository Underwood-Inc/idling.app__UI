import { RadioPwaLaunchGuard } from '../components/radio-pwa/RadioPwaLaunchGuard';
import styles from './idling-radio.module.css';

/** Radio PWA shell — reachable only in standalone display mode (see launch guard). */
export default function IdlingRadioPage() {
  return (
    <RadioPwaLaunchGuard>
      <div className={styles.shell} aria-hidden="true" />
    </RadioPwaLaunchGuard>
  );
}
