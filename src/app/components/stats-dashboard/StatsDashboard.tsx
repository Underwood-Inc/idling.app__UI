'use client';

import { PORTFOLIO_EN } from '$i18n-source/portfolio.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import {
  STATS_QUICK_LINKS,
  STATS_TECH_CATEGORIES,
  type SiteIconId,
} from '@molecules/lucide/siteIconCatalog';
import { useEffect, useState } from 'react';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
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

function MetricIcon({ iconId }: { iconId: SiteIconId }) {
  return <SiteIcon id={iconId} className={styles.metric__icon} sizeRem={1.125} />;
}

export function StatsDashboard() {
  const { ll } = useIdlingLocale();
  const portfolio = resolveCatalogFromLl(PORTFOLIO_EN, ll.portfolio as Record<string, unknown>);
  const statsCopy = portfolio.stats;

  const quickLinkLabelByHref = Object.fromEntries(
    statsCopy.quickLinks.map((link) => [link.href, link.label])
  );
  const techTitleByName = Object.fromEntries(
    statsCopy.techCategories.map((category) => [category.title, category])
  );

  const loadingMetrics: MetricDefinition[] = [
    { iconId: 'package', label: statsCopy.metrics.modrinthProjects },
    { iconId: 'download', label: statsCopy.metrics.modDownloads },
    { iconId: 'users', label: statsCopy.metrics.modrinthFollowers },
  ];

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
        <h3 className={styles.card__title}>{statsCopy.modrinthMetricsTitle}</h3>
        <div className={styles.metrics}>
          {isLoading ? (
            loadingMetrics.map((metric) => (
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
                    <span className={styles.metric__label}>{statsCopy.metrics.modrinthProjects}</span>
                  </div>
                </div>
              )}
              {stats.totalDownloads !== null && (
                <div className={styles.metric}>
                  <MetricIcon iconId="download" />
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.totalDownloads}</span>
                    <span className={styles.metric__label}>{statsCopy.metrics.modDownloads}</span>
                  </div>
                </div>
              )}
              {stats.totalFollowers !== null && (
                <div className={styles.metric}>
                  <MetricIcon iconId="users" />
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.totalFollowers}</span>
                    <span className={styles.metric__label}>{statsCopy.metrics.modrinthFollowers}</span>
                  </div>
                </div>
              )}
              {stats.githubStars !== null && (
                <div className={styles.metric}>
                  <MetricIcon iconId="star" />
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.githubStars}</span>
                    <span className={styles.metric__label}>{statsCopy.metrics.githubStars}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <p className={styles.metrics__note}>
          <SiteIcon id="shield" className={styles.metrics__noteIcon} sizeRem={0.875} aria-hidden />
          <span>{statsCopy.privacyNote}</span>
        </p>
      </Card>

      <Card width="full" className={styles.card}>
        <h3 className={styles.card__title}>{statsCopy.technologyStackTitle}</h3>
        <div className={styles.techStack}>
          {STATS_TECH_CATEGORIES.map((category) => {
            const localized = techTitleByName[category.title];
            return (
              <div key={category.title} className={styles.techCategory}>
                <h4 className={`${styles.techCategory__title} icon-inline`}>
                  <SiteIcon id={category.iconId} className={styles.techCategory__icon} sizeRem={1} />
                  {localized?.title ?? category.title}
                </h4>
                <div className={styles.techBadges}>
                  {(localized?.badges ?? category.badges).map((badge) => (
                    <span key={badge} className={styles.techBadge}>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card width="full" className={styles.card}>
        <h3 className={styles.card__title}>{statsCopy.quickLinksTitle}</h3>
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
              <span className={styles.link__label}>
                {quickLinkLabelByHref[link.href] ?? link.label}
              </span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}