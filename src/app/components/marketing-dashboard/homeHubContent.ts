import { NAV_PATHS } from '@lib/routes';
import type { ProjectShowcaseProject } from '../project-showcase/projectShowcaseProjects';
import type { HomeHubChapterConfig, ProductMarketingHighlight } from './productMarketing.types';
import { HOME_HUB_HIGHLIGHT_KEYS } from '@molecules/i18n/idlingProductMarketingI18n';
import enCatalog from '$i18n/locales/en.json';
import { idlingProductI18nKey } from '@molecules/i18n/idlingProductI18nKey';

export interface HomeHubStructureEntry {
  projectId: string;
  highlightKeys: readonly string[];
  visual: HomeHubChapterConfig['visual'];
  learnMoreHref: string;
  learnMoreExternal: boolean;
  proprietary?: boolean;
  /** Shown only on `/products/[id]` — not in hub pitch copy */
  builtWithLabels?: string[];
}

/** Non-translatable hub structure; copy lives in `src/i18n/locales/en.json`. */
export const HOME_HUB_STRUCTURE: HomeHubStructureEntry[] = [
  {
    projectId: 'overlane',
    highlightKeys: HOME_HUB_HIGHLIGHT_KEYS.overlane,
    visual: {
      src: '/marketing/overlane-app-icon.png',
      alt: '',
      fit: 'contain',
    },
    learnMoreHref: '/products/overlane',
    learnMoreExternal: false,
    proprietary: true,
  },
  {
    projectId: 'mappy',
    highlightKeys: HOME_HUB_HIGHLIGHT_KEYS.mappy,
    visual: {
      src: '/marketing/mappy-living-canvas.png',
      alt: '',
      fit: 'cover',
    },
    learnMoreHref: 'https://underwood-inc.github.io/mappy/wiki/',
    learnMoreExternal: true,
    builtWithLabels: ['Tauri', 'MapLibre GL JS', 'TypeScript'],
  },
  {
    projectId: 'mods-hub',
    highlightKeys: HOME_HUB_HIGHLIGHT_KEYS['mods-hub'],
    visual: {
      src: '/red_panda/img11.png',
      alt: '',
      fit: 'cover',
    },
    learnMoreHref: NAV_PATHS.MODS_HUB_DETAIL,
    learnMoreExternal: false,
  },
  {
    projectId: 'offerings',
    highlightKeys: HOME_HUB_HIGHLIGHT_KEYS.offerings,
    visual: {
      src: '/marketing/offerings-icon-1x1.png',
      alt: '',
      fit: 'cover',
    },
    learnMoreHref: '/products/offerings',
    learnMoreExternal: false,
  },
  {
    projectId: 'obs-animation-suite',
    highlightKeys: HOME_HUB_HIGHLIGHT_KEYS['obs-animation-suite'],
    visual: {
      src: '/red_panda/img4.png',
      alt: '',
      fit: 'cover',
    },
    learnMoreHref: NAV_PATHS.STREAM_SUITE_DETAIL,
    learnMoreExternal: false,
  },
];

type EnHubEntry = {
  headline: string;
  pitch: string;
  learnMoreLabel: string;
  visualAlt: string;
  highlights: Record<string, { title: string; body: string }>;
};

function englishHubEntry(projectId: string): EnHubEntry | undefined {
  const hub = enCatalog.home.hub as Record<string, EnHubEntry>;
  return hub[idlingProductI18nKey(projectId)];
}

/** English defaults for SSR, tests, and metadata. */
export function getHomeHubContentEntry(projectId: string):
  | (HomeHubStructureEntry & {
      headline: string;
      pitch: string;
      highlights: ProductMarketingHighlight[];
      learnMoreLabel: string;
    })
  | undefined {
  const structure = HOME_HUB_STRUCTURE.find((entry) => entry.projectId === projectId);
  const copy = englishHubEntry(projectId);
  if (!structure || !copy) {
    return undefined;
  }

  const highlights: ProductMarketingHighlight[] = structure.highlightKeys.flatMap((key) => {
    const block = copy.highlights[key];
    if (!block) {
      return [];
    }
    return [{ title: block.title, body: block.body }];
  });

  return {
    ...structure,
    headline: copy.headline,
    pitch: copy.pitch,
    learnMoreLabel: copy.learnMoreLabel,
    highlights,
    visual: { ...structure.visual, alt: copy.visualAlt },
  };
}

export function listProductMarketingHighlights(projectId: string): ProductMarketingHighlight[] {
  const entry = getHomeHubContentEntry(projectId);
  return entry?.highlights ?? [];
}

export function listProductMarketingBuiltWithLabels(projectId: string): string[] {
  const entry = HOME_HUB_STRUCTURE.find((row) => row.projectId === projectId);
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