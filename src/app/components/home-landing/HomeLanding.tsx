import { MarketingDashboard } from '../marketing-dashboard/MarketingDashboard';
import styles from '../../page.module.css';

export function HomeLanding() {
  return (
    <div className={styles.home__marketing}>
      <MarketingDashboard />
    </div>
  );
}