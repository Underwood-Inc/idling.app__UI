import {
  Blocks,
  BookOpen,
  Gamepad2,
  Github,
  Image,
  Link,
  Lock,
  Map,
  MessageCircle,
  Package,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trees,
  Video,
  WandSparkles,
  Zap,
} from 'lucide';
import type { LucideIconComponent } from '@molecules/lucide/lucideIcon.types';
import type { ProjectShowcaseCategoryId } from './projectShowcaseCatalog';

export type ProjectShowcaseProjectCategory = Exclude<ProjectShowcaseCategoryId, 'All'>;

export interface ProjectShowcaseProjectLinks {
  modrinth?: string;
  modsHub?: string;
  github?: string;
  demo?: string;
  live?: string;
}

export interface ProjectShowcaseProject {
  id: string;
  title: string;
  description: string;
  category: ProjectShowcaseProjectCategory;
  type: string;
  features: string[];
  links: ProjectShowcaseProjectLinks;
  icon: LucideIconComponent;
  modrinthId?: string;
  status?: 'WIP' | 'Beta' | 'Stable';
}

export const PROJECT_SHOWCASE_PROJECTS: ProjectShowcaseProject[] = [
  {
    id: 'mappy',
    title: 'Mappy',
    description:
      'Offline-first interactive map platform for open-world games, homebrew campaigns, and custom realms. MapLibre canvas, marker corpus, progress tracking, unified search, measure tools, and authoring — static files only, no application backend.',
    category: 'Gaming',
    type: 'Desktop App (Tauri 2)',
    features: [
      'Offline-First Maps',
      'Marker Maker & Tile Studio',
      'Official Map Packs',
      'No Login Required',
    ],
    links: {
      live: 'https://short.army/mappy',
      demo: 'https://underwood-inc.github.io/mappy/wiki/',
      github: 'https://github.com/Underwood-Inc/mappy',
    },
    icon: Map,
  },
  {
    id: 'compressy',
    title: 'Compressy',
    description:
      'Fabric mod for infinite block compression. Compress 9 blocks into 1, up to 32 tiers! Works with ALL blocks automatically. Store incomprehensible amounts with fancy tooltips and roman numerals.',
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
    icon: Package,
    modrinthId: 'compressy',
  },
  {
    id: 'rituals',
    title: 'Rituals',
    description:
      'Mystical Minecraft datapack with ritual magic, totems, and fire sacrifice system. 8 unique rituals, 6 totem tiers, custom textures and animations.',
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
    icon: Sparkles,
    modrinthId: 'totem-rituals',
  },
  {
    id: 'trials-of-the-wild',
    title: 'Trials of the Wild',
    description:
      'Hardcore survival modpack with ~250 exploration, magic, combat, and world-overhaul mods. Includes Rituals for totem magic and Compressy for massive block storage.',
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
    icon: Trees,
    modrinthId: 'strixun-trials-of-the-wild',
  },
  {
    id: 'obs-animation-suite',
    title: 'OBS Animation Suite',
    description:
      'Frontend control panel for OBS with 60 FPS animated source transitions, text cycling, and WebSocket control. Built with Svelte 5. Powers streamkit.idling.app.',
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
    icon: Video,
  },
  {
    id: 'mods-hub',
    title: 'Mods Hub',
    description:
      'Full-stack mod hosting platform with React 19 frontend and Mods API backend. Semantic versioning, advanced search, R2 cloud storage, and client-side encryption.',
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
    icon: Gamepad2,
  },
  {
    id: 'auth-service',
    title: 'Auth Service',
    description:
      'Backend API for multi-tenant passwordless authentication. Email OTP, JWT tokens, OpenAPI 3.1.0 spec. Single sign-on across *.idling.app domains. Cloudflare Worker.',
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
    icon: Shield,
  },
  {
    id: 'card-generator',
    title: 'Mystical Card Generator',
    description:
      'Frontend app for creating stunning social media cards. AI-powered layouts, custom avatars, mystical themes. Wizard and advanced modes. Built with React 19.',
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
    icon: WandSparkles,
  },
  {
    id: 'svg-converter',
    title: 'SVG to PNG Converter',
    description:
      'Frontend app for high-quality SVG to PNG conversion. Custom sizing, batch processing, background customization. Security-validated. Built with React 19.',
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
    icon: Image,
  },
  {
    id: 'social-platform',
    title: 'Social Platform',
    description:
      'Full-stack social platform with React 19/Next.js 15 frontend and PostgreSQL backend. Posts, profiles, emoji reactions, real-time updates, admin dashboard.',
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
    icon: MessageCircle,
  },
  {
    id: 'url-shortener',
    title: 'URL Shortener',
    description:
      'Full-stack URL shortener with React frontend and Cloudflare Worker backend. Click analytics, geographic tracking, custom codes, automatic expiration.',
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
    icon: Link,
  },
  {
    id: 'access-hub',
    title: 'Access Hub',
    description:
      'Backend API for centralized RBAC. Granular permissions, complete audit trails, quota management, auto-provisioning. Service-agnostic. Cloudflare Worker.',
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
    icon: Lock,
  },
  {
    id: 'shared-components',
    title: 'Shared Component Library',
    description:
      'Universal component library with React and Svelte variants. Includes Tooltip, DataTable, CodeBlock, MultiFileViewer, StatusFlair, and more. Storybook documentation.',
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
    icon: Blocks,
  },
  {
    id: 'api-framework',
    title: 'API Framework',
    description:
      'Universal package for enterprise-grade API framework. Works in Cloudflare Workers and browsers. Type-safe clients, request deduplication, circuit breaker, E2E encryption. NPM package.',
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
    icon: Zap,
  },
  {
    id: 'streamkit-api',
    title: 'Streamkit API',
    description:
      'Backend API for OBS Animation Suite. Scene activity tracking, layout sync, config storage via KV. Powers streamkit.idling.app backend. Cloudflare Worker.',
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
    icon: Settings,
  },
  {
    id: 'search-query-parser',
    title: 'Search Query Parser',
    description:
      'Universal package for advanced search query parsing. Human-friendly syntax: quoted phrases, AND/OR logic, wildcard matching. React and Svelte components. NPM package.',
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
    icon: Search,
  },
];
