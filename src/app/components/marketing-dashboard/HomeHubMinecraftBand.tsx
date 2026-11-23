'use client';

import Link from 'next/link';
import { getHomeHubMinecraftMoreLink } from './homeHubCatalog';
import {
  getHomeProductPrimaryLink,
  listHomeMinecraftProjects,
  productMarketingAudienceLine,
} from './productMarketing';
import styles from './marketing-dashboard.module.css';

export function HomeHubMinecraftBand() {
  const projects = listHomeMinecraftProjects();

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className={styles.hub__minecraft} aria-labelledby="hub-minecraft-title">
      <h2 id="hub-minecraft-title" className={styles.hub__minecraftTitle}>
        More Minecraft projects
      </h2>
      <p className={styles.hub__minecraftLine}>
        Plugins, datapacks, and our whitelist server — same lineup as Modrinth and BuiltByBit.
      </p>
      <ul className={styles.hub__minecraftList}>
        {projects.map((project) => {
          const primary = getHomeProductPrimaryLink(project);
          const more = getHomeHubMinecraftMoreLink(project.id);

          if (!primary) {
            return null;
          }

          const line = productMarketingAudienceLine(project);
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