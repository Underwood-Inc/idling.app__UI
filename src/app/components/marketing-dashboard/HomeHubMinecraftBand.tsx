'use client';

import Link from 'next/link';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { getHomeHubMinecraftMoreLink } from './homeHubCatalog';
import {
  getHomeProductPrimaryLink,
  listHomeMinecraftProjects,
  productMarketingAudienceLine,
} from './productMarketing';
import styles from './marketing-dashboard.module.css';

export function HomeHubMinecraftBand() {
  const { ll } = useIdlingLocale();
  const projects = listHomeMinecraftProjects();

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className={styles.hub__minecraft} aria-labelledby="hub-minecraft-title">
      <h2 id="hub-minecraft-title" className={styles.hub__minecraftTitle}>
        {ll.home.minecraftBand.title()}
      </h2>
      <p className={styles.hub__minecraftLine}>
        {ll.home.minecraftBand.line()}
      </p>
      <ul className={styles.hub__minecraftList}>
        {projects.map((project) => {
          const primary = getHomeProductPrimaryLink(project, ll);
          const more = getHomeHubMinecraftMoreLink(project.id, ll);

          if (!primary) {
            return null;
          }

          const line = productMarketingAudienceLine(project, ll);
          const label = `${project.title} — ${line}`;

          return (
            <li key={project.id} className={styles.hub__minecraftItem}>
              {primary.external ? (
                <a
                  href={primary.href}
                  className={styles.hub__minecraftLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.hub__minecraftName}>{project.title}</span>
                  <span className={styles.hub__minecraftDesc}>{line}</span>
                  <span className={styles.hub__minecraftCta}>{primary.label}</span>
                </a>
              ) : (
                <Link href={primary.href} className={styles.hub__minecraftLink} aria-label={label}>
                  <span className={styles.hub__minecraftName}>{project.title}</span>
                  <span className={styles.hub__minecraftDesc}>{line}</span>
                  <span className={styles.hub__minecraftCta}>{primary.label}</span>
                </Link>
              )}
              {more ? (
                more.external ? (
                  <a
                    href={more.href}
                    className={styles.hub__minecraftMore}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {more.label}
                  </a>
                ) : (
                  <Link href={more.href} className={styles.hub__minecraftMore}>
                    {more.label}
                  </Link>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}