'use client';

import { useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { SiModrinth } from 'react-icons/si';
import styles from './ProjectShowcase.module.css';

interface Project {
  id: string;
  title: string;
  description: string;
  category: 'Minecraft' | 'Streaming';
  type: string;
  features: string[];
  downloads?: string;
  links: {
    modrinth?: string;
    github?: string;
    demo?: string;
  };
  icon: string;
}

const PROJECTS: Project[] = [
  {
    id: 'rituals',
    title: 'Rituals',
    description: 'A mystical datapack bringing ritual magic and totems into Minecraft. Craft totems, display items, and trigger powerful effects.',
    category: 'Minecraft',
    type: 'Datapack',
    features: [
      '8 Unique Rituals',
      '6 Totem Tiers',
      'Fire Sacrifice System',
      'Custom Textures & Animations',
    ],
    links: {
      modrinth: 'https://modrinth.com/datapack/totem-rituals',
      github: 'https://github.com/Underwood-Inc/rituals',
    },
    icon: '🔮',
  },
  {
    id: 'strixun-pack-a',
    title: 'Strixun Pack A',
    description: 'A curated modpack enhancing Minecraft with quality-of-life improvements, new content, and performance optimizations.',
    category: 'Minecraft',
    type: 'Modpack',
    features: [
      'Performance Optimized',
      'Quality of Life Mods',
      'New Content & Mechanics',
      'Regular Updates',
    ],
    links: {
      modrinth: 'https://modrinth.com/modpack/strixun-pack-a',
    },
    icon: '📦',
  },
  {
    id: 'obs-animation-suite',
    title: 'OBS Animation Suite',
    description: 'Powerful Lua scripts for OBS Studio featuring smooth animations, source swapping, text cycling, and a web control panel.',
    category: 'Streaming',
    type: 'OBS Scripts',
    features: [
      'Zero external dependencies',
      'WebSocket-powered control',
      '60 FPS smooth animations',
      'Lightweight & performant',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite',
      demo: '/obs-animation-suite',
    },
    icon: '📹',
  },
];

interface ModrinthStats {
  rituals: { downloads: number; formattedDownloads: string };
  strixunPackA: { downloads: number; formattedDownloads: string };
}

export function ProjectShowcase() {
  const [stats, setStats] = useState<ModrinthStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Minecraft' | 'Streaming'>('All');

  useEffect(() => {
    fetch('/api/modrinth/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setStats({
            rituals: data.projects.rituals,
            strixunPackA: data.projects.strixunPackA,
          });
        }
      })
      .catch((err) => console.error('Failed to fetch Modrinth stats:', err));
  }, []);

  const filteredProjects = PROJECTS.filter(
    (project) => selectedCategory === 'All' || project.category === selectedCategory
  );

  const getDownloads = (id: string): string | undefined => {
    if (!stats) return undefined;
    if (id === 'rituals') return stats.rituals.formattedDownloads;
    if (id === 'strixun-pack-a') return stats.strixunPackA.formattedDownloads;
    return undefined;
  };

  return (
    <div className={styles.showcase}>
      <div className={styles.showcase__header}>
        <h2 className={styles.showcase__title}>Featured Projects</h2>
        <p className={styles.showcase__subtitle}>
          Open source projects spanning game development and streaming tools
        </p>

        {/* Category Filter */}
        <div className={styles.category__filter}>
          {(['All', 'Minecraft', 'Streaming'] as const).map((category) => (
            <button
              key={category}
              className={`${styles.filter__button} ${
                selectedCategory === category ? styles['filter__button--active'] : ''
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.projects__grid}>
        {filteredProjects.map((project) => {
          const downloads = getDownloads(project.id);

          return (
            <div key={project.id} className={styles.project}>
              <div className={styles.project__header}>
                <span className={styles.project__icon}>{project.icon}</span>
                <div className={styles.project__meta}>
                  <h3 className={styles.project__title}>{project.title}</h3>
                  <span className={styles.project__type}>{project.type}</span>
                </div>
              </div>

              {downloads && (
                <div className={styles.project__downloads}>
                  📥 <strong>{downloads}</strong> downloads
                </div>
              )}

              <p className={styles.project__description}>{project.description}</p>

              <div className={styles.project__features}>
                {project.features.map((feature) => (
                  <span key={feature} className={styles.feature__tag}>
                    {feature}
                  </span>
                ))}
              </div>

              <div className={styles.project__links}>
                {project.links.modrinth && (
                  <a
                    href={project.links.modrinth}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.project__link} ${styles['project__link--modrinth']}`}
                  >
                    <SiModrinth /> Modrinth
                  </a>
                )}
                {project.links.github && (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.project__link} ${styles['project__link--github']}`}
                  >
                    <FaGithub /> GitHub
                  </a>
                )}
                {project.links.demo && (
                  <a
                    href={project.links.demo}
                    className={`${styles.project__link} ${styles['project__link--demo']}`}
                  >
                    🚀 Live Demo
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

