'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { HomeHubLearnMoreLink } from './productMarketing.types';
import type { HomeHubChapter } from './productMarketing.types';
import { productMarketingStatusLabel } from './productMarketing';
import { listHomeHubChapters } from './homeHubCatalog';
import { HomeHubMinecraftBand } from './HomeHubMinecraftBand';
import { HomeHubTileVisual } from './HomeHubTileVisual';
import styles from './marketing-dashboard.module.css';

function hubChapterEyebrow(chapter: HomeHubChapter): string {
  const status = productMarketingStatusLabel(chapter.project.status);
  const base = chapter.proprietary
    ? 'Windows app · proprietary'
    : chapter.project.category;

  return status ? `${base} · ${status}` : base;
}

function HubLearnMoreLink({ learnMore }: { learnMore: HomeHubLearnMoreLink }) {
  const className = `${styles.hub__tileBtn} contrast-safe-surface contrast-safe-surface--cta-outline`;

  if (learnMore.external) {
    return (
      <a
        href={learnMore.href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {learnMore.label}
      </a>
    );
  }

  return (
    <Link href={learnMore.href} className={className}>
      {learnMore.label}
    </Link>
  );
}

export function HomeProductHub() {
  const chapters = useMemo(() => listHomeHubChapters(), []);

  return (
    <div id="products" className={styles.hub__stack} data-testid="home-product-hub">
      {chapters.map((chapter) => {
        const titleId = `hub-${chapter.project.id}`;

        return (
          <article key={chapter.project.id} className={styles.hub__tile} aria-labelledby={titleId}>
            <header className={styles.hub__tileHeader}>
              <HomeHubTileVisual visual={chapter.visual} />
              <div className={styles.hub__tileIntro}>
                <p className={styles.hub__tileEyebrow}>{hubChapterEyebrow(chapter)}</p>
                <h2 id={titleId} className={styles.hub__tileHeadline}>
                  {chapter.headline}
                </h2>
                <p className={styles.hub__tileMeta}>
                  <span className={styles.hub__tileProductName}>{chapter.project.title}</span>
                  <span className={styles.hub__tileType}>{chapter.project.type}</span>
                </p>
              </div>
            </header>
            <div className={styles.hub__tileBody}>
              <p className={styles.hub__tileLine}>{chapter.pitch}</p>
              <ul className={styles.hub__tileHighlights}>
                {chapter.highlights.map((item) => (
                  <li key={item.title}>
                    <span className={styles.hub__tileHighlightTitle}>{item.title}</span>
                    <span className={styles.hub__tileHighlightBody}> — {item.body}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.hub__tileActions}>
                <HubLearnMoreLink learnMore={chapter.learnMore} />
                {chapter.primary.external ? (
                  <a
                    href={chapter.primary.href}
                    className={`${styles.hub__tileBtn} contrast-safe-surface contrast-safe-surface--cta-primary`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {chapter.primary.label}
                  </a>
                ) : (
                  <Link
                    href={chapter.primary.href}
                    className={`${styles.hub__tileBtn} contrast-safe-surface contrast-safe-surface--cta-primary`}
                  >
                    {chapter.primary.label}
                  </Link>
                )}
              </div>
            </div>
          </article>
        );
      })}
      <HomeHubMinecraftBand />
    </div>
  );
}