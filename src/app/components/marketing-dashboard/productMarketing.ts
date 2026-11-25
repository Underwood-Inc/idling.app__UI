import type { TranslationFunctions } from '$i18n/i18n-types';
import enCatalog from '$i18n/locales/en.json';
import {
  resolveOutboundLinkLabel,
  resolveProductMarketingAudienceLine,
  resolveProductMarketingHook,
  resolveProductMarketingStatusLabel,
} from '@molecules/i18n/idlingProductMarketingI18n';
import { idlingProductI18nKey } from '@molecules/i18n/idlingProductI18nKey';
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

const HOME_LINK_FIELD_KEYS: Array<keyof ProjectShowcaseProjectLinks> = [
  'live',
  'builtByBit',
  'modsHub',
  'modrinth',
  'demo',
];

function primaryHomeLinkLabel(
  fieldKey: keyof ProjectShowcaseProjectLinks,
  href: string,
  ll?: TranslationFunctions
): string {
  const external = isExternalLink(href);
  if (ll) {
    if (fieldKey === 'demo' && !external) {
      return ll.home.homeLinks.tour();
    }
    if (fieldKey === 'live' && external) {
      return ll.home.homeLinks.open();
    }
    const homeLinks = ll.home.homeLinks as Record<string, () => string>;
    const fn = homeLinks[fieldKey];
    if (typeof fn === 'function') {
      return String(fn());
    }
  }

  const enLinks = enCatalog.home.homeLinks as Record<string, string>;
  if (fieldKey === 'demo' && !external) {
    return enLinks.tour;
  }
  if (fieldKey === 'live' && external) {
    return enLinks.open;
  }
  return enLinks[fieldKey] ?? fieldKey;
}

export function getHomeProductPrimaryLink(
  project: ProjectShowcaseProject,
  ll?: TranslationFunctions
): ProductMarketingPrimaryLink | null {
  for (const fieldKey of HOME_LINK_FIELD_KEYS) {
    const href = project.links[fieldKey];

    if (!href) {
      continue;
    }

    const external = isExternalLink(href);
    const label = primaryHomeLinkLabel(fieldKey, href, ll);

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
  title: enCatalog.home.masthead.title,
  line: enCatalog.home.masthead.line,
  primaryCta: 'Products',
  primaryHref: '#products',
  secondaryCta: '',
  secondaryHref: '#products',
};

const OUTBOUND_FIELD_KEYS: Array<keyof ProjectShowcaseProjectLinks> = [
  'live',
  'builtByBit',
  'modsHub',
  'modrinth',
  'demo',
  'github',
];

function readEnglishCatalogString(
  bucket: Record<string, string>,
  projectId: string
): string | undefined {
  return bucket[idlingProductI18nKey(projectId)];
}

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

export function productMarketingHook(
  project: ProjectShowcaseProject,
  ll?: TranslationFunctions
): string {
  if (ll) {
    return resolveProductMarketingHook(project, ll);
  }
  return (
    readEnglishCatalogString(enCatalog.home.hooks as Record<string, string>, project.id) ??
    project.features[0]?.split(' ').slice(0, 4).join(' ') ??
    project.title
  );
}

/** One visitor-facing sentence for hub tiles and cards. */
export function productMarketingAudienceLine(
  project: ProjectShowcaseProject,
  ll?: TranslationFunctions
): string {
  if (ll) {
    return resolveProductMarketingAudienceLine(project, ll);
  }

  const audience = readEnglishCatalogString(
    enCatalog.home.audience as Record<string, string>,
    project.id
  );
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

export function productMarketingTagline(
  project: ProjectShowcaseProject,
  ll?: TranslationFunctions
): string {
  return productMarketingHook(project, ll);
}

export function productMarketingStatusLabel(
  status: ProjectShowcaseProject['status'],
  ll?: TranslationFunctions
): string | null {
  if (ll) {
    return resolveProductMarketingStatusLabel(status, ll);
  }

  if (!status) {
    return null;
  }

  if (status === 'WIP') {
    return enCatalog.home.status.wip;
  }

  return status;
}

export function getProductMarketingPrimaryLink(
  project: ProjectShowcaseProject,
  ll?: TranslationFunctions
): ProductMarketingPrimaryLink | null {
  const outbound = listProductMarketingLinks(project.links, ll);

  return outbound[0] ?? null;
}

export function listProductMarketingLinks(
  links: ProjectShowcaseProjectLinks,
  ll?: TranslationFunctions
): ProductMarketingLink[] {
  return OUTBOUND_FIELD_KEYS.flatMap((fieldKey) => {
    const href = links[fieldKey];

    if (!href) {
      return [];
    }

    const external = isExternalLink(href);
    const label = ll
      ? resolveOutboundLinkLabel({ fieldKey, href, external }, ll)
      : fieldKey === 'demo' && !external
        ? enCatalog.home.outboundVariants.inDepthTour
        : fieldKey === 'live' && external
          ? enCatalog.home.outboundVariants.launchLiveApp
          : ((enCatalog.home.outboundLinks as Record<string, string>)[fieldKey] ?? fieldKey);

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