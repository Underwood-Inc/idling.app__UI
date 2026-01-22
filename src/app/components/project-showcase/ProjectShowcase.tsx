'use client';

import { useEffect, useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { SiModrinth } from 'react-icons/si';
import styles from './ProjectShowcase.module.css';

interface Project {
  id: string;
  title: string;
  description: string;
  category: 'Minecraft' | 'Streaming' | 'Infrastructure' | 'Gaming' | 'Web Tools' | 'Social';
  type: string;
  features: string[];
  downloads?: string;
  links: {
    modrinth?: string;
    modsHub?: string;
    github?: string;
    demo?: string;
    live?: string;
  };
  icon: string;
  modrinthId?: string;
  status?: 'WIP' | 'Beta' | 'Stable';
}

const PROJECTS: Project[] = [
  {
    id: 'compressy',
    title: 'Compressy',
    description: 'Fabric mod for infinite block compression. Compress 9 blocks into 1, up to 32 tiers! Works with ALL blocks automatically. Store incomprehensible amounts with fancy tooltips and roman numerals.',
    category: 'Minecraft',
    type: 'Fabric Mod',
    features: [
      'Infinite Compression',
      'Works with ALL Blocks',
      'Up to 32 Tiers',
      'Automation Friendly',
    ],
    links: {
      modrinth: 'https://modrinth.com/mod/compressy',
      modsHub: 'https://mods.idling.app/compressy',
      github: 'https://github.com/Underwood-Inc/compressy',
    },
    icon: '📦',
    modrinthId: 'compressy',
  },
  {
    id: 'rituals',
    title: 'Rituals',
    description: 'Mystical Minecraft datapack with ritual magic, totems, and fire sacrifice system. 8 unique rituals, 6 totem tiers, custom textures and animations.',
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
      modsHub: 'https://mods.idling.app/rituals',
    },
    icon: '🔮',
    modrinthId: 'totem-rituals',
  },
  {
    id: 'trials-of-the-wild',
    title: 'Trials of the Wild',
    description: 'Hardcore survival modpack with ~250 exploration, magic, combat, and world-overhaul mods. Includes Rituals for totem magic and Compressy for massive block storage.',
    category: 'Minecraft',
    type: 'Modpack',
    features: [
      'Performance Optimized',
      'Quality of Life',
      'New Content & Mechanics',
      'Regular Updates',
    ],
    links: {
      modrinth: 'https://modrinth.com/modpack/strixun-trials-of-the-wild',
      modsHub: 'https://mods.idling.app/modpack-trials-of-the-wild',
    },
    icon: '🌲',
    modrinthId: 'strixun-trials-of-the-wild',
  },
  {
    id: 'obs-animation-suite',
    title: 'OBS Animation Suite',
    description: 'Frontend control panel for OBS with 60 FPS animated source transitions, text cycling, and WebSocket control. Built with Svelte 5. Powers streamkit.idling.app.',
    category: 'Streaming',
    type: 'Frontend App (Svelte)',
    features: [
      '60 FPS Animations',
      'WebSocket Control',
      'Zero Dependencies',
      'Progressive Web App',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master',
      live: 'https://streamkit.idling.app',
    },
    icon: '📹',
  },
  {
    id: 'mods-hub',
    title: 'Mods Hub',
    description: 'Full-stack mod hosting platform with React 19 frontend and Mods API backend. Semantic versioning, advanced search, R2 cloud storage, and client-side encryption.',
    category: 'Gaming',
    type: 'Full-Stack App (React + API)',
    features: [
      'Semantic Versioning',
      'Advanced Search',
      'Cloud Storage',
      'Direct Downloads',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/mods-hub',
      live: 'https://mods.idling.app',
      demo: '/strixun-stream-suite/mods-hub',
    },
    icon: '🎮',
  },
  {
    id: 'auth-service',
    title: 'Auth Service',
    description: 'Backend API for multi-tenant passwordless authentication. Email OTP, JWT tokens, OpenAPI 3.1.0 spec. Single sign-on across *.idling.app domains. Cloudflare Worker.',
    category: 'Infrastructure',
    type: 'Backend API (Cloudflare)',
    features: [
      'Passwordless OTP',
      'Multi-tenant',
      'OpenAPI Spec',
      'Zero-trust Security',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/serverless/otp-auth-service',
      live: 'https://auth.idling.app',
      demo: '/strixun-stream-suite/auth-service',
    },
    icon: '🔐',
  },
  {
    id: 'card-generator',
    title: 'Mystical Card Generator',
    description: 'Frontend app for creating stunning social media cards. AI-powered layouts, custom avatars, mystical themes. Wizard and advanced modes. Built with React 19.',
    category: 'Web Tools',
    type: 'Frontend App (React)',
    features: [
      'AI-Powered Layouts',
      'Custom Avatars',
      'Wizard & Advanced Modes',
      'Quota Management',
    ],
    links: {
      live: '/card-generator',
      github: 'https://github.com/Underwood-Inc/idling.app__UI',
    },
    icon: '🧙‍♂️',
  },
  {
    id: 'svg-converter',
    title: 'SVG to PNG Converter',
    description: 'Frontend app for high-quality SVG to PNG conversion. Custom sizing, batch processing, background customization. Security-validated. Built with React 19.',
    category: 'Web Tools',
    type: 'Frontend App (React)',
    features: [
      'High-Quality Output',
      'Batch Processing',
      'Custom Sizing',
      'Security Validated',
    ],
    links: {
      live: '/svg-converter',
      github: 'https://github.com/Underwood-Inc/idling.app__UI',
    },
    icon: '🎨',
  },
  {
    id: 'social-platform',
    title: 'Social Platform',
    description: 'Full-stack social platform with React 19/Next.js 15 frontend and PostgreSQL backend. Posts, profiles, emoji reactions, real-time updates, admin dashboard.',
    category: 'Social',
    type: 'Full-Stack App (React + PostgreSQL)',
    features: [
      'Posts & Profiles',
      'Emoji Reactions',
      'Real-time Updates',
      'Admin Dashboard',
    ],
    links: {
      live: '/posts',
      github: 'https://github.com/Underwood-Inc/idling.app__UI',
    },
    icon: '💬',
  },
  {
    id: 'url-shortener',
    title: 'URL Shortener',
    description: 'Full-stack URL shortener with React frontend and Cloudflare Worker backend. Click analytics, geographic tracking, custom codes, automatic expiration.',
    category: 'Web Tools',
    type: 'Full-Stack App (React + Cloudflare)',
    features: [
      'Custom URL Codes',
      'Click Analytics',
      'Geographic Tracking',
      'Auto Expiration',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/serverless/url-shortener',
      live: 'https://s.idling.app',
      demo: '/strixun-stream-suite/url-shortener',
    },
    icon: '🔗',
  },
  {
    id: 'chat-hub',
    title: 'Chat Hub',
    description: 'Frontend P2P chat app with WebRTC. Messages never touch servers - direct peer-to-peer encryption with signaling backend. Zero storage, automatic cleanup.',
    category: 'Social',
    type: 'Frontend App (P2P WebRTC)',
    features: [
      'True P2P WebRTC',
      'Zero Server Storage',
      'End-to-End Security',
      'Automatic Cleanup',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/chat-hub',
      live: 'https://chat.idling.app',
      demo: '/strixun-stream-suite/chat-hub',
    },
    icon: '💬',
    status: 'WIP',
  },
  {
    id: 'access-hub',
    title: 'Access Hub',
    description: 'Backend API for centralized RBAC. Granular permissions, complete audit trails, quota management, auto-provisioning. Service-agnostic. Cloudflare Worker.',
    category: 'Infrastructure',
    type: 'Backend API (Cloudflare)',
    features: [
      'RBAC System',
      'Audit Trails',
      'Quota Management',
      'Auto-Provisioning',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/access-hub',
      live: 'https://access.idling.app',
      demo: '/strixun-stream-suite/access-hub',
    },
    icon: '🔒',
  },
  {
    id: 'shared-components',
    title: 'Shared Component Library',
    description: 'Universal component library with React and Svelte variants. Includes Tooltip, DataTable, CodeBlock, MultiFileViewer, StatusFlair, and more. Storybook documentation.',
    category: 'Infrastructure',
    type: 'Universal Package (NPM)',
    features: [
      'React & Svelte',
      'Storybook Docs',
      '15+ Components',
      'TypeScript Support',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/shared-components',
    },
    icon: '🧩',
  },
  {
    id: 'api-framework',
    title: 'API Framework',
    description: 'Universal package for enterprise-grade API framework. Works in Cloudflare Workers and browsers. Type-safe clients, request deduplication, circuit breaker, E2E encryption. NPM package.',
    category: 'Infrastructure',
    type: 'Universal Package (NPM)',
    features: [
      'Type-Safe Clients',
      'Request Deduplication',
      'Circuit Breaker',
      'E2E Encryption',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/packages/api-framework',
    },
    icon: '⚡',
  },
  {
    id: 'streamkit-api',
    title: 'Streamkit API',
    description: 'Backend API for OBS Animation Suite. Scene activity tracking, layout sync, config storage via KV. Powers streamkit.idling.app backend. Cloudflare Worker.',
    category: 'Streaming',
    type: 'Backend API (Cloudflare)',
    features: [
      'Scene Activity Tracking',
      'Config Sync',
      'KV Storage',
      'Real-time Updates',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/serverless/streamkit-api',
    },
    icon: '⚙️',
  },
  {
    id: 'p2p-storage',
    title: 'P2P Storage',
    description: 'Frontend library for decentralized storage. Blockchain integrity verification, IndexedDB adapter, sync capabilities. Zero-server P2P data persistence. NPM package.',
    category: 'Infrastructure',
    type: 'Frontend Package (NPM)',
    features: [
      'Blockchain Integrity',
      'IndexedDB Adapter',
      'P2P Sync',
      'Zero Server',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/packages/p2p-storage',
    },
    icon: '💾',
  },
  {
    id: 'search-query-parser',
    title: 'Search Query Parser',
    description: 'Universal package for advanced search query parsing. Human-friendly syntax: quoted phrases, AND/OR logic, wildcard matching. React and Svelte components. NPM package.',
    category: 'Web Tools',
    type: 'Universal Package (NPM)',
    features: [
      'Human-Friendly Syntax',
      'AND/OR Logic',
      'Wildcard Support',
      'React & Svelte',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/packages/search-query-parser',
    },
    icon: '🔍',
  },
  {
    id: 'asciimoji',
    title: 'ASCIIMoji',
    description: 'Universal package for ASCII emoji library. Pattern matching, CDN deployment. Perfect for terminal apps, logs, text-based interfaces. NPM package.',
    category: 'Web Tools',
    type: 'Universal Package (NPM)',
    features: [
      'Pattern Matching',
      'CDN Deployed',
      'Terminal Support',
      'Zero Dependencies',
    ],
    links: {
      github: 'https://github.com/Underwood-Inc/strixun-stream-suite/tree/master/packages/asciimoji',
    },
    icon: '😎',
    status: 'WIP',
  },
];

interface ModrinthStats {
  compressy?: { downloads: number; formattedDownloads: string };
  rituals: { downloads: number; formattedDownloads: string };
  trialsOfTheWild: { downloads: number; formattedDownloads: string };
}

function formatDownloads(downloads: number): string {
  if (downloads >= 1000000) return `${(downloads / 1000000).toFixed(1)}M`;
  if (downloads >= 1000) return `${(downloads / 1000).toFixed(1)}k`;
  return downloads.toString();
}

export function ProjectShowcase() {
  const [stats, setStats] = useState<ModrinthStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Minecraft' | 'Streaming' | 'Infrastructure' | 'Gaming' | 'Web Tools' | 'Social'>('All');

  useEffect(() => {
    // Fetch Modrinth stats directly from their PUBLIC API
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
        const [compressy, rituals, trialsOfTheWild] = projects;
        
        setStats({
          compressy: compressy ? {
            downloads: compressy.downloads || 0,
            formattedDownloads: formatDownloads(compressy.downloads || 0),
          } : undefined,
          rituals: {
            downloads: rituals?.downloads || 0,
            formattedDownloads: formatDownloads(rituals?.downloads || 0),
          },
          trialsOfTheWild: {
            downloads: trialsOfTheWild?.downloads || 0,
            formattedDownloads: formatDownloads(trialsOfTheWild?.downloads || 0),
          },
        });
      })
      .catch((err) => console.error('Failed to fetch Modrinth stats:', err));
  }, []);

  const filteredProjects = PROJECTS.filter(
    (project) => selectedCategory === 'All' || project.category === selectedCategory
  );

  const getDownloads = (id: string): string | undefined => {
    if (!stats) return undefined;
    if (id === 'compressy' && stats.compressy) return stats.compressy.formattedDownloads;
    if (id === 'rituals') return stats.rituals.formattedDownloads;
    if (id === 'trials-of-the-wild') return stats.trialsOfTheWild.formattedDownloads;
    return undefined;
  };

  return (
    <div className={styles.showcase}>
      <div className={styles.showcase__header}>
        <h2 className={styles.showcase__title}>Featured Projects</h2>
        <p className={styles.showcase__subtitle}>
          Showcasing 18 of 40+ open source projects: web applications, Minecraft mods, serverless APIs, developer tools, and infrastructure packages
        </p>

        {/* Category Filter */}
        <div className={styles.category__filter}>
          {(['All', 'Minecraft', 'Web Tools', 'Social', 'Streaming', 'Gaming', 'Infrastructure'] as const).map((category) => (
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
                  <h3 className={styles.project__title}>
                    {project.title}
                    {project.status === 'WIP' && (
                      <span className={styles.project__status__wip}>WIP</span>
                    )}
                  </h3>
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
                {/* Priority 1: Mods Hub (our platform) */}
                {project.links.modsHub && (
                  <a
                    href={project.links.modsHub}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.project__link} ${styles['project__link--modshub']}`}
                  >
                    🎮 Mods Hub
                  </a>
                )}
                {/* Priority 2: Modrinth (secondary) */}
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
                {/* Priority 3: Live services */}
                {project.links.live && (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.project__link} ${styles['project__link--live']}`}
                  >
                    🚀 Live App
                  </a>
                )}
                {/* Priority 4: GitHub source */}
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
                {/* Priority 5: Documentation */}
                {project.links.demo && (
                  <a
                    href={project.links.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.project__link} ${styles['project__link--demo']}`}
                  >
                    📖 Learn More
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

