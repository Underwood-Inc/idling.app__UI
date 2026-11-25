'use client';

import { ArrowUpRight } from 'lucide';
import { LucideIcon } from '@molecules/lucide/LucideIcon';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ProjectShowcaseProject } from '../project-showcase/projectShowcaseProjects';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { getHomeProductPrimaryLink, productMarketingHook } from './productMarketing';
import styles from './marketing-dashboard.module.css';

export type HomeProductTileSize = 'hero' | 'wide' | 'chip';

interface HomeProductTileWrapProps {
  children: ReactNode;
  size: HomeProductTileSize;
}

interface HomeProductTileProps {
  project: ProjectShowcaseProject;
  size: HomeProductTileSize;
}

function wrapClassName(size: HomeProductTileSize): string {
  if (size === 'hero') {
    return `${styles.dash__tileWrap} ${styles['dash__tileWrap--hero']}`;
  }

  if (size === 'wide') {
    return `${styles.dash__tileWrap} ${styles['dash__tileWrap--wide']}`;
  }

  return styles.dash__tileWrap;
}

function categoryModifier(category: ProjectShowcaseProject['category']): string {
  switch (category) {
    case 'Minecraft':
      return styles['dash__tile--minecraft'];
    case 'Streaming':
      return styles['dash__tile--streaming'];
    case 'Web Tools':
      return styles['dash__tile--web'];
    case 'Gaming':
    default:
      return styles['dash__tile--gaming'];
  }
}

function tileSizeClass(size: HomeProductTileSize): string {
  if (size === 'hero') {
    return styles['dash__tile--hero'];
  }

  if (size === 'wide') {
    return styles['dash__tile--wide'];
  }

  return styles['dash__tile--chip'];
}

function HomeProductTileWrap({ children, size }: HomeProductTileWrapProps) {
  return <div className={wrapClassName(size)}>{children}</div>;
}

export function HomeProductTile({ project, size }: HomeProductTileProps) {
  const { ll } = useIdlingLocale();
  const primary = getHomeProductPrimaryLink(project, ll);

  if (!primary) {
    return null;
  }

  const blurb = productMarketingHook(project, ll);
  const ariaLabel = `${project.title} — ${primary.label}`;
  const iconSize = size === 'hero' ? 2.75 : size === 'wide' ? 2 : 1.25;
  const watermarkSize = size === 'hero' ? 5 : size === 'wide' ? 4 : 3;
  const tileClass = [styles.dash__tile, tileSizeClass(size), categoryModifier(project.category)].join(
    ' '
  );

  const body = (
    <article className={tileClass}>
      <div className={styles.dash__tileWatermark} aria-hidden="true">
        <LucideIcon icon={project.icon} sizeRem={watermarkSize} />
      </div>
      <div className={styles.dash__tileInner}>
        <span className={styles.dash__tileIcon} aria-hidden="true">
          <LucideIcon icon={project.icon} sizeRem={iconSize} />
        </span>
        <div className={styles.dash__tileCopy}>
          <span className={styles.dash__tileTitle}>{project.title}</span>
          <span className={styles.dash__tileBlurb}>{blurb}</span>
        </div>
        <span className={styles.dash__tileAction} aria-hidden="true">
          <span className={styles.dash__tileDest}>{primary.label}</span>
          <LucideIcon icon={ArrowUpRight} sizeRem={1.1} />
        </span>
      </div>
    </article>
  );

  if (primary.external) {
    return (
      <HomeProductTileWrap size={size}>
        {body}
        <a
          href={primary.href}
          className={styles.dash__tileHit}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
        />
      </HomeProductTileWrap>
    );
  }

  return (
    <HomeProductTileWrap size={size}>
      {body}
      <Link href={primary.href} className={styles.dash__tileHit} aria-label={ariaLabel} />
    </HomeProductTileWrap>
  );
}