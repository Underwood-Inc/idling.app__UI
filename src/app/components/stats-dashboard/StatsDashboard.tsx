'use client';

import { useEffect, useState } from 'react';
import { FaGithub, FaDiscord } from 'react-icons/fa';
import { Card } from '../card/Card';
import styles from './StatsDashboard.module.css';

interface PortfolioStats {
  totalProjects: number | null;
  totalDownloads: string | null;
  githubStars: number | null;
}

export function StatsDashboard() {
  const [stats, setStats] = useState<PortfolioStats>({
    totalProjects: null,
    totalDownloads: null,
    githubStars: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch Modrinth stats directly from their PUBLIC API (like in ModrinthProductCarousel.svelte)
    const modrinthSlugs = ['compressy', 'totem-rituals', 'strixun-trials-of-the-wild'];
    
    Promise.all(
      modrinthSlugs.map((slug) =>
        fetch(`https://api.modrinth.com/v2/project/${slug}`, {
          headers: {
            'User-Agent': 'idling.app/1.0 (https://github.com/Underwood-Inc)',
          },
          cache: 'no-store',
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    )
      .then((projects) => {
        const validProjects = projects.filter((p) => p !== null);
        const totalDownloads = validProjects.reduce(
          (sum, project) => sum + (project.downloads || 0),
          0
        );
        
        setStats((prev) => ({
          ...prev,
          totalProjects: validProjects.length,
          totalDownloads: formatDownloads(totalDownloads),
        }));
      })
      .catch((err) => console.error('Failed to fetch Modrinth stats:', err))
      .finally(() => setIsLoading(false));

    // TODO: Fetch GitHub stars from GitHub API
    // For now, leave as null until proper API integration is added
  }, []);

  const formatDownloads = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return `${num}`;
  };

  return (
    <div className={styles.dashboard}>
      {/* Portfolio Metrics */}
      <Card width="full" className={styles.card}>
        <h3 className={styles.card__title}>Portfolio Metrics</h3>
        <div className={styles.metrics}>
          {isLoading ? (
            <>
              {/* Loading skeletons */}
              <div className={styles.metric}>
                <span className={styles.metric__icon}>📦</span>
                <div className={styles.metric__content}>
                  <span className={`${styles.metric__value} ${styles.skeleton}`}>&nbsp;</span>
                  <span className={styles.metric__label}>Modrinth Projects</span>
                </div>
              </div>
              <div className={styles.metric}>
                <span className={styles.metric__icon}>📥</span>
                <div className={styles.metric__content}>
                  <span className={`${styles.metric__value} ${styles.skeleton}`}>&nbsp;</span>
                  <span className={styles.metric__label}>Total Downloads</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {stats.totalProjects !== null && (
                <div className={styles.metric}>
                  <span className={styles.metric__icon}>📦</span>
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.totalProjects}</span>
                    <span className={styles.metric__label}>Modrinth Projects</span>
                  </div>
                </div>
              )}
              {stats.totalDownloads !== null && (
                <div className={styles.metric}>
                  <span className={styles.metric__icon}>📥</span>
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.totalDownloads}</span>
                    <span className={styles.metric__label}>Total Downloads</span>
                  </div>
                </div>
              )}
              {stats.githubStars !== null && (
                <div className={styles.metric}>
                  <span className={styles.metric__icon}>⭐</span>
                  <div className={styles.metric__content}>
                    <span className={styles.metric__value}>{stats.githubStars}</span>
                    <span className={styles.metric__label}>GitHub Stars</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Technology Stack */}
      <Card width="full" className={styles.card}>
        <h3 className={styles.card__title}>Technology Stack</h3>
        <div className={styles.techStack}>
          <div className={styles.techCategory}>
            <h4 className={styles.techCategory__title}>🎨 Frontend</h4>
            <div className={styles.techBadges}>
              <span className={styles.techBadge}>React 19</span>
              <span className={styles.techBadge}>Next.js 15</span>
              <span className={styles.techBadge}>Svelte 5</span>
              <span className={styles.techBadge}>TypeScript</span>
              <span className={styles.techBadge}>Three.js</span>
            </div>
          </div>
          <div className={styles.techCategory}>
            <h4 className={styles.techCategory__title}>⚙️ Backend</h4>
            <div className={styles.techBadges}>
              <span className={styles.techBadge}>Cloudflare Workers</span>
              <span className={styles.techBadge}>Node.js</span>
              <span className={styles.techBadge}>WebSocket</span>
              <span className={styles.techBadge}>Go</span>
              <span className={styles.techBadge}>Python</span>
            </div>
          </div>
          <div className={styles.techCategory}>
            <h4 className={styles.techCategory__title}>💾 Database</h4>
            <div className={styles.techBadges}>
              <span className={styles.techBadge}>PostgreSQL</span>
              <span className={styles.techBadge}>KV Storage</span>
              <span className={styles.techBadge}>R2 Cloud</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <Card width="full" className={styles.card}>
        <h3 className={styles.card__title}>Quick Links</h3>
        <div className={styles.links}>
          <a href="/card-generator" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>🧙‍♂️</span>
            <span className={styles.link__label}>Card Generator</span>
          </a>
          <a href="/svg-converter" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>🎨</span>
            <span className={styles.link__label}>SVG Converter</span>
          </a>
          <a href="/posts" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>💬</span>
            <span className={styles.link__label}>Social Feed</span>
          </a>
          <a href="https://streamkit.idling.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>📹</span>
            <span className={styles.link__label}>OBS Suite</span>
          </a>
          <a href="https://mods.idling.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>🎮</span>
            <span className={styles.link__label}>Mods Hub</span>
          </a>
          <a href="https://auth.idling.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>🔐</span>
            <span className={styles.link__label}>Auth Service</span>
          </a>
          <a href="https://docs.idling.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>📚</span>
            <span className={styles.link__label}>Documentation</span>
          </a>
          <a href="https://design.idling.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>🎨</span>
            <span className={styles.link__label}>Design System</span>
          </a>
          <a href="https://short.army" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>🔗</span>
            <span className={styles.link__label}>URL Shortener</span>
          </a>
          <a href="https://chat.idling.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>💬</span>
            <span className={styles.link__label}>Chat Hub</span>
          </a>
          <a href="https://access.idling.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>🔒</span>
            <span className={styles.link__label}>Access Hub</span>
          </a>
          <a href="/strixun-stream-suite" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <span className={styles.link__icon}>⚡</span>
            <span className={styles.link__label}>Stream Suite</span>
          </a>
          <a href="https://github.com/Underwood-Inc/strixun-stream-suite" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <FaGithub className={styles.link__icon} />
            <span className={styles.link__label}>Monorepo (40+)</span>
          </a>
          <a href="https://github.com/Underwood-Inc/idling.app__UI" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <FaGithub className={styles.link__icon} />
            <span className={styles.link__label}>idling.app Repo</span>
          </a>
          <a href="https://discord.gg/mpThbx67J7" target="_blank" rel="noopener noreferrer" className={styles.link}>
            <FaDiscord className={styles.link__icon} />
            <span className={styles.link__label}>Discord</span>
          </a>
        </div>
      </Card>
    </div>
  );
}
