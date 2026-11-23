import { MarketingProductExplorer } from './MarketingProductExplorer';
import styles from './marketing-dashboard.module.css';

export function MarketingDashboard() {
  return (
    <div className={styles.dash} data-home-page data-testid="marketing-dashboard">
      <MarketingProductExplorer />
    </div>
  );
}