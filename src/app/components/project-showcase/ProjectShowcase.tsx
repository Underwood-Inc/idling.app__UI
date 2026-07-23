'use client';

import { LucideIcon } from '@molecules/lucide/LucideIcon';
import { BookOpen, ExternalLink, FolderGit2, Gamepad2, Package, Store } from 'lucide';
import { useEffect, useRef, useState } from 'react';
import styles from './ProjectShowcase.module.css';
import {
  fetchModrinthShowcaseMetrics,
  type ModrinthMetricsByProjectId,
} from './modrinthShowcaseStats';
import { ProjectShowcaseMetrics } from './ProjectShowcaseMetrics';
import {
  PROJECT_SHOWCASE_CATEGORY_OPTIONS,
  PROJECT_SHOWCASE_TOTAL_COUNT,
  type ProjectShowcaseCategoryId,
} from './projectShowcaseCatalog';
import { PROJECT_SHOWCASE_PROJECTS } from './projectShowcaseProjects';

const CONTRAST_SAFE_SURFACE_CLASS = 'contrast-safe-surface';

export function ProjectShowcase() {
  const [metrics, setMetrics] = useState<ModrinthMetricsByProjectId | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProjectShowcaseCategoryId>('All');
  const projectsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModrinthShowcaseMetrics()
      .then(setMetrics)
      .catch((err) => console.error('Failed to fetch Modrinth stats:', err));
  }, []);

  const filteredProjects = PROJECT_SHOWCASE_PROJECTS.filter(
    (project) => selectedCategory === 'All' || project.category === selectedCategory
  );

  return (
    <div className={styles.showcase}>
      <div className={styles.showcase__header}>
        <p className={styles.showcase__eyebrow}>Open-source portfolio</p>
        <h2 className={styles.showcase__title}>Featured Projects</h2>
        <p className={styles.showcase__subtitle}>
          A curated slice of the monorepo — web apps, desktop maps, Minecraft mods, serverless APIs,
          and shared packages.
        </p>
        <hr className={styles.showcase__divider} aria-hidden="true" />

        <div className={styles.showcase__meta}>
          <span className={styles.showcase__metaStat}>
            <strong>{PROJECT_SHOWCASE_PROJECTS.length}</strong> featured
          </span>
          <span className={styles.showcase__metaDivider} aria-hidden="true" />
          <span className={styles.showcase__metaStat}>
            <strong>{PROJECT_SHOWCASE_TOTAL_COUNT}+</strong> total projects
          </span>
          <span className={styles.showcase__metaDivider} aria-hidden="true" />
          <span className={styles.showcase__metaStat}>
            Showing <strong>{filteredProjects.length}</strong>
            {selectedCategory === 'All' ? '' : ` in ${selectedCategory}`}
          </span>
        </div>

        <nav className={styles.category__nav} aria-label="Filter projects by category">
          <div className={styles.category__rail}>
            {PROJECT_SHOWCASE_CATEGORY_OPTIONS.map((category) => {
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  className={`${styles.filter__button} ${isActive ? styles['filter__button--active'] : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={isActive}
                >
                  <span className={styles.filter__icon} aria-hidden="true">
                    <LucideIcon icon={category.icon} sizeRem={1} />
                  </span>
                  <span className={styles.filter__label}>{category.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <div ref={projectsContainerRef} className={styles.projects__container}>
        <div className={styles.projects__grid}>
          {filteredProjects.map((project) => (
            <article key={project.id} className={styles.project}>
              <header className={styles.project__header}>
                <div className={styles.project__iconWrap}>
                  <LucideIcon icon={project.icon} sizeRem={1.375} className={styles.project__icon} />
                </div>
                <div className={styles.project__heading}>
                  <div className={styles.project__titleRow}>
                    <h3 className={styles.project__title}>{project.title}</h3>
                    {project.status === 'WIP' ? (
                      <span className={styles.project__status__wip}>WIP</span>
                    ) : null}
                  </div>
                  <div className={styles.project__badges}>
                    <span className={styles.project__type}>{project.type}</span>
                    <ProjectShowcaseMetrics
                      metrics={metrics?.[project.id]}
                      modrinthMetricsNote={project.modrinthMetricsNote}
                    />
                  </div>
                </div>
              </header>

              <p className={styles.project__description}>{project.description}</p>

              <ul className={styles.project__features}>
                {project.features.map((feature) => (
                  <li key={feature} className={styles.feature__tag}>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className={styles.project__links}>
                {project.links.builtByBit ? (
                  <a
                    href={project.links.builtByBit}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${CONTRAST_SAFE_SURFACE_CLASS} contrast-safe-surface--cta-primary ${styles.project__link}`}
                  >
                    <LucideIcon icon={Store} sizeRem={1} />
                    BuiltByBit
                  </a>
                ) : null}
                {project.links.modsHub ? (
                  <a
                    href={project.links.modsHub}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${CONTRAST_SAFE_SURFACE_CLASS} contrast-safe-surface--cta-outline ${styles.project__link}`}
                  >
                    <LucideIcon icon={Gamepad2} sizeRem={1} />
                    Mods Hub
                  </a>
                ) : null}
                {project.links.modrinth ? (
                  <a
                    href={project.links.modrinth}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${CONTRAST_SAFE_SURFACE_CLASS} contrast-safe-surface--cta-outline ${styles.project__link}`}
                  >
                    <LucideIcon icon={Package} sizeRem={1} />
                    Modrinth
                  </a>
                ) : null}
                {project.links.live ? (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${CONTRAST_SAFE_SURFACE_CLASS} contrast-safe-surface--cta-primary ${styles.project__link}`}
                  >
                    <LucideIcon icon={ExternalLink} sizeRem={1} />
                    Live App
                  </a>
                ) : null}
                {project.links.github ? (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${CONTRAST_SAFE_SURFACE_CLASS} contrast-safe-surface--cta-outline ${styles.project__link}`}
                  >
                    <LucideIcon icon={FolderGit2} sizeRem={1} />
                    GitHub
                  </a>
                ) : null}
                {project.links.demo ? (
                  <a
                    href={project.links.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${CONTRAST_SAFE_SURFACE_CLASS} contrast-safe-surface--cta-outline ${styles.project__link}`}
                  >
                    <LucideIcon icon={BookOpen} sizeRem={1} />
                    Learn More
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
