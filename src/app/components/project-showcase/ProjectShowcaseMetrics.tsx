'use client';

import { LucideIcon } from '@molecules/lucide/LucideIcon';
import { Download, Heart, Info, Play, Users } from 'lucide';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import type { ModrinthProjectMetrics } from './modrinthShowcaseStats';
import { formatModrinthCount } from './modrinthShowcaseStats';
import styles from './ProjectShowcase.module.css';

interface ProjectShowcaseMetricsProps {
  metrics?: ModrinthProjectMetrics;
  modrinthMetricsNote?: string;
}

interface MetricStatProps {
  icon: typeof Download;
  value: string;
  label: string;
  note?: string;
}

function MetricStat({ icon, value, label, note }: MetricStatProps) {
  return (
    <span className={styles.project__stat}>
      <LucideIcon icon={icon} sizeRem={1} className={styles.project__statIcon} />
      <span className={styles.project__statText}>
        <span className={styles.project__statValue}>{value}</span>
        {' '}
        <span className={styles.project__statLabel}>{label}</span>
      </span>
      {note ? (
        <span className={styles.project__statTooltipTrigger}>
          <InteractiveTooltip
            content={<div className="info-tooltip-content">{note}</div>}
            isInsideParagraph
            delay={200}
          >
            <button
              type="button"
              className={`no-glass ${styles.project__statInfo}`}
              aria-label="About Modrinth download metrics"
            >
              <LucideIcon icon={Info} sizeRem={1} />
            </button>
          </InteractiveTooltip>
        </span>
      ) : null}
    </span>
  );
}

export function ProjectShowcaseMetrics({
  metrics,
  modrinthMetricsNote,
}: ProjectShowcaseMetricsProps) {
  if (!metrics) {
    return null;
  }

  if (metrics.kind === 'server') {
    return (
      <span className={styles.project__stats}>
        <MetricStat
          icon={Users}
          value={`${metrics.playersOnline}/${metrics.playersMax}`}
          label="online"
        />
        {metrics.verifiedPlays2w > 0 ? (
          <MetricStat
            icon={Play}
            value={formatModrinthCount(metrics.verifiedPlays2w)}
            label="recent plays"
          />
        ) : null}
        {metrics.followers > 0 ? (
          <MetricStat
            icon={Heart}
            value={formatModrinthCount(metrics.followers)}
            label="followers"
          />
        ) : null}
        {metrics.versionName ? (
          <span className={styles.project__stat}>
            <span className={styles.project__statValue}>{metrics.versionName}</span>
          </span>
        ) : null}
        {metrics.regionLabel ? (
          <span className={styles.project__stat}>
            <span className={styles.project__statLabel}>{metrics.regionLabel}</span>
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={styles.project__stats}>
      {metrics.downloads > 0 ? (
        <MetricStat
          icon={Download}
          value={formatModrinthCount(metrics.downloads)}
          label="downloads"
          note={modrinthMetricsNote}
        />
      ) : null}
      {metrics.followers > 0 ? (
        <MetricStat
          icon={Heart}
          value={formatModrinthCount(metrics.followers)}
          label="followers"
        />
      ) : null}
    </span>
  );
}
