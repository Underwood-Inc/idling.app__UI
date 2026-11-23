import { isExternalLink } from '@lib/routes';
import {
  PROJECT_SHOWCASE_PROJECTS,
  type ProjectShowcaseProject,
  type ProjectShowcaseProjectLinks,
} from '../project-showcase/projectShowcaseProjects';
import type {
  ProductMarketingDashboardCopy,
  ProductMarketingLink,
  ProductMarketingPrimaryLink,
} from './productMarketing.types';

/** One Minecraft product gets a full hub chapter; the rest live under “More Minecraft projects”. */
export const HOME_HUB_FEATURED_MINECRAFT_ID = 'offerings' as const;

export const FEATURED_PRODUCT_IDS = [
  'overlane',
  'mappy',
  HOME_HUB_FEATURED_MINECRAFT_ID,
  'mods-hub',
  'obs-animation-suite',
  'card-generator',
] as const;

/** Spotlight row on `/`. */
export const HOME_PRODUCT_IDS = FEATURED_PRODUCT_IDS;

export const HOME_MINECRAFT_IDS = [
  'compressy',
  'offerings',
  'rituals',
  'shirecraft',
  'trials-of-the-wild',
  'alloys',
  'tally',
] as const;

export function listHomeMinecraftProjects(): ProjectShowcaseProject[] {
  const featured = new Set<string>(FEATURED_PRODUCT_IDS);

  return HOME_MINECRAFT_IDS.flatMap((id) => {
    if (featured.has(id)) {
      return [];
    }

    const project = getProductMarketingProject(id);

    if (!project || !getHomeProductPrimaryLink(project)) {
      return [];
    }

    return [project];
  });
}

export interface HomeMarketingTile {
  project: ProjectShowcaseProject;
  size: 'hero' | 'wide' | 'chip';
}

export function listHomeMarketingTiles(): HomeMarketingTile[] {
  const featuredTiles: HomeMarketingTile[] = FEATURED_PRODUCT_IDS.flatMap((id, index) => {
    const project = getProductMarketingProject(id);

    if (!project || !getHomeProductPrimaryLink(project)) {
      return [];
    }

    const size: HomeMarketingTile['size'] = index < 2 ? 'hero' : 'wide';
    return [{ project, size }];
  });

  const chipTiles: HomeMarketingTile[] = listHomeMinecraftProjects().map((project) => ({
    project,
    size: 'chip',
  }));

  return [...featuredTiles, ...chipTiles];
}

const HOME_LINK_FIELDS: Array<{
  key: keyof ProjectShowcaseProjectLinks;
  label: string;
}> = [
  { key: 'live', label: 'Open' },
  { key: 'builtByBit', label: 'Get it' },
  { key: 'modsHub', label: 'Mods Hub' },
  { key: 'modrinth', label: 'Modrinth' },
  { key: 'demo', label: 'Tour' },
];

export function getHomeProductPrimaryLink(
  project: ProjectShowcaseProject
): ProductMarketingPrimaryLink | null {
  for (const field of HOME_LINK_FIELDS) {
    const href = project.links[field.key];

    if (!href) {
      continue;
    }

    const external = isExternalLink(href);
    const label =
      field.key === 'demo' && !external
        ? 'Tour'
        : field.key === 'live' && external
          ? 'Open'
          : field.label;

    return { href, label, external };
  }

  return null;
}

export function isHomeAudienceProject(project: ProjectShowcaseProject): boolean {
  return (HOME_PRODUCT_IDS as readonly string[]).includes(project.id);
}

export function listHomeAudienceProjects(): ProjectShowcaseProject[] {
  return HOME_PRODUCT_IDS.flatMap((id) => {
    const project = getProductMarketingProject(id);

    if (!project || !getHomeProductPrimaryLink(project)) {
      return [];
    }

    return [project];
  });
}

/** One horizontal filmstrip on `/` — featured first, then minecraft mods (no duplicates). */
export function listHomeFilmstripProjects(): ProjectShowcaseProject[] {
  return [...listFeaturedProductProjects(), ...listHomeMinecraftProjects()];
}

export const DASHBOARD_COPY: ProductMarketingDashboardCopy = {
  eyebrow: 'idling.app',
  title: 'Maps. Mods. Tools. Radio.',
  line: 'Games, mods, stream tools, and community — each product below has a tour or a live app when you are ready.',
  primaryCta: 'Products',
  primaryHref: '#products',
  secondaryCta: '',
  secondaryHref: '#products',
};

export const PRODUCT_AUDIENCE_LINES: Record<string, string> = {
  overlane:
    'Live telemetry, searchable archive, dashboard charts, and hybrid hot/cold storage for millions of observations — ETS2 and ATS on your PC, no cloud account.',
  mappy:
    'Offline maps for open-world games and tabletop campaigns — explore, mark, and measure without signing in.',
  'mods-hub': 'Download and browse Minecraft mods from one place built for players.',
  compressy: 'Compress stacks of blocks in Minecraft so storage and builds stay manageable.',
  'obs-animation-suite': 'Control OBS from the browser with smooth scene switches and animated sources.',
  offerings: 'Daily kit lottery on your Minecraft server.',
  rituals: 'Light-the-fire magic and rituals datapack.',
  shirecraft: 'Whitelist survival on Shirecraft.',
  'trials-of-the-wild': 'Hardcore survival modpack with hundreds of mods.',
  alloys: 'Ten fantasy metals to find and forge.',
  tally: 'Thousands of advancements to chase in survival.',
};

export const PRODUCT_MARKETING_HOOKS: Record<string, string> = {
  overlane: 'ETS2 & ATS telemetry.',
  mappy: 'Offline maps.',
  compressy: 'Stack blocks×32.',
  offerings: 'Daily server lottery.',
  rituals: 'Light-the-fire magic.',
  'trials-of-the-wild': '~250-mod survival.',
  alloys: '10 fantasy metals.',
  tally: '10k+ advancements.',
  shirecraft: 'Whitelist survival.',
  'obs-animation-suite': '60 FPS stream scenes.',
  'mods-hub': 'Host & ship mods.',
  'auth-service': 'Sign in with a code.',
  'card-generator': 'Social cards fast.',
  'svg-converter': 'SVG → PNG.',
  'url-shortener': 'Short links + stats.',
  'access-hub': 'Roles & permissions.',
  'shared-components': 'React + Svelte kit.',
  'api-framework': 'Typed API client.',
  'streamkit-api': 'OBS scene sync.',
  'search-query-parser': 'Smart search syntax.',
};

const OUTBOUND_FIELDS: Array<{
  key: keyof ProjectShowcaseProjectLinks;
  label: string;
  preferPrimary?: boolean;
}> = [
  { key: 'live', label: 'Live app', preferPrimary: true },
  { key: 'builtByBit', label: 'BuiltByBit' },
  { key: 'modsHub', label: 'Mods Hub' },
  { key: 'modrinth', label: 'Modrinth' },
  { key: 'demo', label: 'Product tour' },
  { key: 'github', label: 'GitHub' },
];

export function listProductMarketingIds(): string[] {
  return PROJECT_SHOWCASE_PROJECTS.map((project) => project.id);
}

export function getProductMarketingProject(id: string): ProjectShowcaseProject | undefined {
  return PROJECT_SHOWCASE_PROJECTS.find((project) => project.id === id);
}

export function listFeaturedProductProjects(): ProjectShowcaseProject[] {
  return FEATURED_PRODUCT_IDS.flatMap((id) => {
    const project = getProductMarketingProject(id);
    if (!project || !isHomeAudienceProject(project)) {
      return [];
    }
    return [project];
  });
}

export function productMarketingHook(project: ProjectShowcaseProject): string {
  return (
    PRODUCT_MARKETING_HOOKS[project.id] ?? project.features[0]?.split(' ').slice(0, 4).join(' ') ?? project.title
  );
}

/** One visitor-facing sentence for hub tiles and cards. */
export function productMarketingAudienceLine(project: ProjectShowcaseProject): string {
  const audience = PRODUCT_AUDIENCE_LINES[project.id];

  if (audience) {
    return audience;
  }

  const firstSentence = project.description.match(/[^.!?]+[.!?]+/)?.[0]?.trim();

  return firstSentence ?? project.description;
}

/** Two short sentences from the canonical showcase description — used on `/` detail panel. */
export function productMarketingSummary(project: ProjectShowcaseProject): string {
  const description = project.description.trim();
  const sentenceMatches = description.match(/[^.!?]+[.!?]+(?:\s|$)/g);

  if (!sentenceMatches || sentenceMatches.length === 0) {
    return description.length > 240 ? `${description.slice(0, 237)}…` : description;
  }

  const summary = sentenceMatches
    .slice(0, 2)
    .join(' ')
    .trim();

  if (summary.length <= 240) {
    return summary;
  }

  return `${summary.slice(0, 237)}…`;
}

export function productMarketingTagline(project: ProjectShowcaseProject): string {
  return productMarketingHook(project);
}

export function productMarketingStatusLabel(
  status: ProjectShowcaseProject['status']
): string | null {
  if (!status) {
    return null;
  }

  if (status === 'WIP') {
    return 'In progress';
  }

  return status;
}

export function getProductMarketingPrimaryLink(
  project: ProjectShowcaseProject
): ProductMarketingPrimaryLink | null {
  const outbound = listProductMarketingLinks(project.links);

  return outbound[0] ?? null;
}

export function listProductMarketingLinks(
  links: ProjectShowcaseProjectLinks
): ProductMarketingLink[] {
  return OUTBOUND_FIELDS.flatMap((field) => {
    const href = links[field.key];

    if (!href) {
      return [];
    }

    const external = isExternalLink(href);
    const label =
      field.key === 'demo' && !external
        ? 'In-depth tour'
        : field.key === 'live' && external
          ? 'Launch live app'
          : field.label;

    return [{ href, label, external }];
  });
}

export function getProductMarketingTourHref(project: ProjectShowcaseProject): string | null {
  const demo = project.links.demo;

  if (!demo || !demo.startsWith('/')) {
    return null;
  }

  return demo;
}