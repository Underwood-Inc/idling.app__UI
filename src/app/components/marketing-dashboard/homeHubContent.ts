import { NAV_PATHS } from '@lib/routes';
import type { ProjectShowcaseProject } from '../project-showcase/projectShowcaseProjects';
import type { HomeHubChapterConfig, ProductMarketingHighlight } from './productMarketing.types';

export interface HomeHubContentEntry {
  projectId: string;
  headline: string;
  pitch: string;
  highlights: ProductMarketingHighlight[];
  visual: HomeHubChapterConfig['visual'];
  learnMoreHref: string;
  learnMoreLabel: string;
  learnMoreExternal: boolean;
  proprietary?: boolean;
  /** Shown only on `/products/[id]` — not in hub pitch copy */
  builtWithLabels?: string[];
}

/** Visitor-facing hub copy and art — sourced from showcase + Strixun tours, rewritten for `/`. */
export const HOME_HUB_CONTENT: HomeHubContentEntry[] = [
  {
    projectId: 'overlane',
    headline: 'Telemetry, overlays, and a drive archive for ETS2 & ATS.',
    pitch:
      'One Windows app beside Euro Truck Simulator 2 and American Truck Simulator: live telemetry console, searchable mile-by-mile archive, dashboard charts and rollups, and OBS-ready overlay panels. Hybrid hot/cold storage on your PC (Memory Lane) is built to keep millions of driving observations searchable and the console responsive — session journal included, no cloud account.',
    highlights: [
      {
        title: 'Telemetry console',
        body: 'Live speed, fuel, gear, odometer, and active contract in a dockable console — the same fields your overlay URLs expose to OBS.',
      },
      {
        title: 'Drive archive',
        body: 'Record optional sessions into a searchable timeline. Fold similar snapshots, open the inspector on any mile, and keep fines and deliveries visible.',
      },
      {
        title: 'Dashboard & charts',
        body: 'Save rollup layouts, chart archive spans over time, and jump from a spike on a chart back into the archive moment that caused it.',
      },
      {
        title: 'Hot/cold storage',
        body: 'Memory Lane keeps recent facts in a hot ledger while older observations tier to cold column files and a local index — built to stay responsive into millions of rows on one machine.',
      },
      {
        title: 'Stream overlays',
        body: 'Copy localhost browser-source URLs for speed, telltales, job panels, and the rest of the catalog — metrics stay in sync with the console.',
      },
    ],
    visual: {
      src: '/marketing/overlane-app-icon.png',
      alt: 'Overlane app icon — trucking telemetry and overlays',
      fit: 'contain',
    },
    learnMoreHref: '/products/overlane',
    learnMoreLabel: 'Product overview',
    learnMoreExternal: false,
    proprietary: true,
  },
  {
    projectId: 'mappy',
    headline: 'Maps that work offline.',
    pitch:
      'Offline-first map workspace for open-world games, homebrew campaigns, and custom realms. Explore official map packs, drop markers, track progress, search across layers, and measure distances — desktop app with no login and no telemetry.',
    highlights: [
      {
        title: 'Offline map workspace',
        body: 'Pan, zoom, layer, and track progress on maps you keep as static packs — not live tiles from our servers.',
      },
      {
        title: 'Marker Maker & Tile Studio',
        body: 'Author markers, media annotations, and custom tiles in-app, then export packs you can share or archive with your campaign.',
      },
      {
        title: 'Unified search',
        body: 'Search markers, regions, and notes from one bar instead of hunting through scattered files or wikis.',
      },
      {
        title: 'Measure & progress',
        body: 'Rulers and path tools for planning routes; track completion across official packs or your own realms.',
      },
    ],
    visual: {
      src: '/marketing/mappy-living-canvas.png',
      alt: 'mappy — living canvas map workspace screenshot',
      fit: 'cover',
    },
    learnMoreHref: 'https://underwood-inc.github.io/mappy/wiki/',
    learnMoreLabel: 'Player wiki tour',
    learnMoreExternal: true,
    builtWithLabels: ['Tauri', 'MapLibre GL JS', 'TypeScript'],
  },
  {
    projectId: 'mods-hub',
    headline: 'Your mods, one home.',
    pitch:
      'Open-source mod hosting with semantic versioning, advanced search syntax, and R2-backed storage. Upload with drag-and-drop, ship direct download links, and optionally encrypt packages client-side — a gold-themed UI built for players and authors, not FTP folders.',
    highlights: [
      {
        title: 'Authoring workflow',
        body: 'Create projects, upload versions with drag-and-drop, and edit metadata without touching raw storage paths.',
      },
      {
        title: 'Semantic versions',
        body: 'Ship semver releases with changelog history so players know exactly what changed between builds.',
      },
      {
        title: 'Search syntax',
        body: 'Filter with human-friendly queries like category:tools tag:optimization updated:>7d — not just a keyword box.',
      },
      {
        title: 'Downloads & encryption',
        body: 'Direct CDN links work in launchers and browsers; optional client-side encryption when you want packages private in R2.',
      },
    ],
    visual: {
      src: '/red_panda/img11.png',
      alt: 'Mods Hub — mod hosting platform artwork',
      fit: 'cover',
    },
    learnMoreHref: NAV_PATHS.MODS_HUB_DETAIL,
    learnMoreLabel: 'Platform deep dive',
    learnMoreExternal: false,
  },
  {
    projectId: 'offerings',
    headline: 'Daily kit lottery for Paper servers.',
    pitch:
      'Premium daily rewards for Paper and Spigot: weighted loot tiers, streaks, milestones, achievements, and a full in-game admin hub. Powers daily kits on Shirecraft — configure tables, permissions, and LuckPerms hooks without editing YAML by hand.',
    highlights: [
      {
        title: 'Weighted lottery',
        body: 'Roll daily kits from tiered loot tables so common rewards stay common and jackpots stay rare.',
      },
      {
        title: 'Streaks & milestones',
        body: 'Track player streaks, milestone unlocks, and achievements so regulars feel rewarded over weeks, not one-offs.',
      },
      {
        title: 'In-game admin',
        body: 'Tune tables, preview rolls, and fix misconfigurations from the server — not only from console or flat files.',
      },
      {
        title: 'LuckPerms ready',
        body: 'Permission-aware rewards so ranks, donor tiers, and staff bypass rules stay explicit and auditable.',
      },
    ],
    visual: {
      src: '/marketing/offerings-icon-1x1.png',
      alt: 'Offerings — Daily Weighted Kit Lottery (official product artwork)',
      fit: 'cover',
    },
    learnMoreHref: '/products/offerings',
    learnMoreLabel: 'Listing & details',
    learnMoreExternal: false,
  },
  {
    projectId: 'obs-animation-suite',
    headline: 'Animate your stream scenes.',
    pitch:
      'Control OBS from a Svelte 5 progressive web app: animated source transitions, smart source swapping with layout memory, one-click presets, and a text cycler with typewriter and glitch effects. Real-time WebSocket control with sub-50ms latency at 60 FPS.',
    highlights: [
      {
        title: 'Source transitions',
        body: 'Fade, slide, zoom, and pop between OBS sources at 60 FPS without hand-editing scenes for every layout change.',
      },
      {
        title: 'Smart swapping',
        body: 'Seven swap styles remember position and size so recurring segments (camera, BRB, alerts) snap back instantly.',
      },
      {
        title: 'Layout presets',
        body: 'Save full scene layouts as presets and recall them from the web panel during stream — one click instead of a manual hunt in OBS.',
      },
      {
        title: 'Text cycler',
        body: 'Rotate titles and lower-thirds with typewriter, glitch, and scramble effects driven from the same control panel.',
      },
    ],
    visual: {
      src: '/red_panda/img4.png',
      alt: 'OBS Animation Suite — stream control artwork',
      fit: 'cover',
    },
    learnMoreHref: NAV_PATHS.STREAM_SUITE_DETAIL,
    learnMoreLabel: 'Stream Suite tour',
    learnMoreExternal: false,
  },
];

export function getHomeHubContentEntry(projectId: string): HomeHubContentEntry | undefined {
  return HOME_HUB_CONTENT.find((entry) => entry.projectId === projectId);
}

export function listProductMarketingHighlights(projectId: string): ProductMarketingHighlight[] {
  const entry = getHomeHubContentEntry(projectId);
  return entry?.highlights ?? [];
}

export function listProductMarketingBuiltWithLabels(projectId: string): string[] {
  const entry = getHomeHubContentEntry(projectId);
  return entry?.builtWithLabels ?? [];
}

export function listProductMarketingHighlightsForProject(
  project: ProjectShowcaseProject
): ProductMarketingHighlight[] {
  const fromHub = listProductMarketingHighlights(project.id);

  if (fromHub.length > 0) {
    return fromHub;
  }

  return project.features.map((title) => ({
    title,
    body: project.description,
  }));
}