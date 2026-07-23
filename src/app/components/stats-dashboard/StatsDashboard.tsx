'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import {
  STATS_QUICK_LINKS,
  STATS_TECH_CATEGORIES,
  type SiteIconId,
} from '@molecules/lucide/siteIconCatalog';
import { useEffect, useState } from 'react';
import {
  fetchModrinthShowcaseMetrics,
  formatModrinthCount,
  type ModrinthContentMetrics,
} from '../project-showcase/modrinthShowcaseStats';
import { Card } from '../card/Card';
import styles from './StatsDashboard.module.css';

interface PortfolioStats {
  totalProjects: number | null;
  totalDownloads: string | null;
  totalFollowers: string | null;
  githubStars: number | null;
}

interface MetricDefinition {
  iconId: SiteIconId;
  label: string;
}

const LOADING_METRICS: MetricDefinition[] = [
  { iconId: 'package', label: 'Modrinth Projects' },
  { iconId: 'download', label: 'Mod Downloads' },
  { iconId: 'users', label: 'Modrinth Followers' },
];

const METRICS_PRIVACY_NOTE =
  'Figures are from Modrinth and cover listed Minecraft projects only. BuiltByBit purchase and update metrics are not public. We do not track downloads, activity, or users on our other applications — by design, for privacy — so there are no public metrics for those projects.';

function MetricIcon({ iconId }: { iconId: SiteIconId }) {
  return <SiteIcon id={iconId} className={styles.metric__icon} sizeRem={1.125} />;
}

export function StatsDashboard() {
  const [stats, setStats] = useState<PortfolioStats>({
    totalProjects: null,
    totalDownloads: null,
    totalFollowers: null,
    githubStars: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchModrinthShowcaseMetrics()
      .then((metrics) => {
        const values = Object.values(metrics);
        const totalDownloads = values
          .filter((metric): metric is ModrinthContentMetrics => metric.kind === 'content')
          .reduce((sum, metric) => sum + metric.downloads, 0);
        const totalFollowers = values.reduce((sum, metric) => sum + metric.followers, 0);

        setStats((prev) => ({
          ...prev,
          totalProjects: values.length,
          totalDownloads: formatModrinthCount(totalDownloads),
          totalFollowers: formatModrinthCount(totalFollowers),
        }));
      })
      .catch((err) => console.error('Failed to fetch Modrinth stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className={styles.dashboard}>
      <Card width="full" className={styles.card}>
        <h3 className={styles.card__title}>Modrinth Metrics</h3>
        <div className={styles.metrics}>
          {isLoading ? (
            LOADING_METRICS.map((metric) => (
              <div key={metric.label} className={styles.metric}>
                <MetricIcon iconId={metric.iconId} />
                <div className={styles.metric__content}>
                  <span className={`${styles.metric__value} ${styles.skeleton}`}>&nbsp;</span>
                  <span className={styles.metric__label}>{metric.label}</span>
                </div>
              </div>
            ))
          ) : (
            <>
              {stats.totalProjects !== null && (
                <div className={styles.metric}>
                  <MetricIcon iconId="package" />
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.totalProjects}</span>
                    <span className={styles.metric__label}>Modrinth Projects</span>
                  </div>
                </div>
              )}
              {stats.totalDownloads !== null && (
                <div className={styles.metric}>
                  <MetricIcon iconId="download" />
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.totalDownloads}</span>
                    <span className={styles.metric__label}>Mod Downloads</span>
                  </div>
                </div>
              )}
              {stats.totalFollowers !== null && (
                <div className={styles.metric}>
                  <MetricIcon iconId="users" />
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.totalFollowers}</span>
                    <span className={styles.metric__label}>Modrinth Followers</span>
                  </div>
                </div>
              )}
              {stats.githubStars !== null && (
                <div className={styles.metric}>
                  <MetricIcon iconId="star" />
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.githubStars}</span>
                    <span className={styles.metric__label}>GitHub Stars</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <p className={styles.metrics__note}>
          <SiteIcon id="shield" className={styles.metrics__noteIcon} sizeRem={0.875} aria-hidden />
          <span>{METRICS_PRIVACY_NOTE}</span>
        </p>
      </Card>

      <Card width="full" className={styles.card}>
        <h3 className={styles.card__title}>Technology Stack</h3>
        <div className={styles.techStack}>
          {STATS_TECH_CATEGORIES.map((category) => (
            <div key={category.title} className={styles.techCategory}>
              <h4 className={`${styles.techCategory__title} icon-inline`}>
                <SiteIcon id={category.iconId} className={styles.techCategory__icon} sizeRem={1} />
                {category.title}
              </h4>
              <div className={styles.techBadges}>
                {category.badges.map((badge) => (
                  <span key={badge} className={styles.techBadge}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card width="full" className={styles.card}>
        <h3 className={styles.card__title}>Quick Links</h3>
        <div className={styles.links}>
          {STATS_QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.link} contrast-safe-surface icon-inline`}
            >
              <SiteIcon id={link.iconId} className={styles.link__icon} sizeRem={1} />
              <span className={styles.link__label}>{link.label}</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
