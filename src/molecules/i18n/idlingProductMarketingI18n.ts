import type { TranslationFunctions } from '$i18n/i18n-types';
import type { ProductMarketingHighlight } from '../../app/components/marketing-dashboard/productMarketing.types';
import type { ProjectShowcaseProject } from '../../app/components/project-showcase/projectShowcaseProjects';
import { isExternalLink } from '@lib/routes';
import { idlingProductI18nKey } from './idlingProductI18nKey';

export interface IdlingHomeHubCopy {
  headline: string;
  pitch: string;
  learnMoreLabel: string;
  visualAlt: string;
  highlights: ProductMarketingHighlight[];
}

type HomeHubRecord = TranslationFunctions['home']['hub'][keyof TranslationFunctions['home']['hub']];

function readProductString(
  bucket: Record<string, () => string>,
  projectId: string
): string | undefined {
  const key = idlingProductI18nKey(projectId);
  const fn = bucket[key];
  if (typeof fn === 'function') {
    return String(fn());
  }
  return undefined;
}

export function resolveProductMarketingHook(
  project: ProjectShowcaseProject,
  ll: TranslationFunctions
): string {
  return (
    readProductString(ll.home.hooks as Record<string, () => string>, project.id) ??
    project.features[0]?.split(' ').slice(0, 4).join(' ') ??
    project.title
  );
}

export function resolveProductMarketingAudienceLine(
  project: ProjectShowcaseProject,
  ll: TranslationFunctions
): string {
  const audience = readProductString(ll.home.audience as Record<string, () => string>, project.id);
  if (audience) {
    return audience;
  }

  const firstSentence = project.description.match(/[^.!?]+[.!?]+/)?.[0]?.trim();
  return firstSentence ?? project.description;
}

export function resolveProductMarketingStatusLabel(
  status: ProjectShowcaseProject['status'],
  ll: TranslationFunctions
): string | null {
  if (!status) {
    return null;
  }
  if (status === 'WIP') {
    return ll.home.status.wip();
  }
  return status;
}

export interface IdlingOutboundLinkLabelInput {
  fieldKey: string;
  href: string;
  external: boolean;
}

export function resolveOutboundLinkLabel(
  input: IdlingOutboundLinkLabelInput,
  ll: TranslationFunctions
): string {
  const { fieldKey, href, external } = input;
  if (fieldKey === 'demo' && !external) {
    return ll.home.outboundVariants.inDepthTour();
  }
  if (fieldKey === 'live' && external) {
    return ll.home.outboundVariants.launchLiveApp();
  }

  const outbound = ll.home.outboundLinks as Record<string, () => string>;
  const fn = outbound[fieldKey];
  if (typeof fn === 'function') {
    return String(fn());
  }
  return fieldKey;
}

export function resolveHomeLinkLabel(
  fieldKey: keyof TranslationFunctions['home']['homeLinks'],
  ll: TranslationFunctions
): string {
  return String(ll.home.homeLinks[fieldKey]());
}

export function resolveHomeHubCopy(
  projectId: string,
  highlightKeys: readonly string[],
  ll: TranslationFunctions
): IdlingHomeHubCopy | undefined {
  const i18nKey = idlingProductI18nKey(projectId);
  const hubRoot = ll.home.hub as Record<string, HomeHubRecord>;
  const chapter = hubRoot[i18nKey];
  if (!chapter) {
    return undefined;
  }

  type HighlightFnBlock = { title: () => string; body: () => string };
  const highlightFns = chapter.highlights as Record<string, HighlightFnBlock>;

  const highlights: ProductMarketingHighlight[] = highlightKeys.flatMap((hKey) => {
    const block = highlightFns[hKey];
    if (!block) {
      return [];
    }
    return [{ title: String(block.title()), body: String(block.body()) }];
  });

  return {
    headline: chapter.headline(),
    pitch: chapter.pitch(),
    learnMoreLabel: chapter.learnMoreLabel(),
    visualAlt: chapter.visualAlt(),
    highlights,
  };
}

export function resolveMinecraftMoreLinkLabel(
  kind: keyof TranslationFunctions['home']['minecraftMore'],
  ll: TranslationFunctions
): string {
  return ll.home.minecraftMore[kind]();
}

export function resolveProductMarketingLinkLabel(
  fieldKey: string,
  href: string,
  ll: TranslationFunctions
): string {
  return resolveOutboundLinkLabel(
    { fieldKey, href, external: isExternalLink(href) },
    ll
  );
}

export function listHighlightKeysForHub(projectId: string): string[] {
  const fromStructure = HOME_HUB_HIGHLIGHT_KEYS[projectId];
  return fromStructure ? [...fromStructure] : [];
}

/** Ordered highlight ids — must match keys under `home.hub.*.highlights` in en.json. */
export const HOME_HUB_HIGHLIGHT_KEYS: Record<string, readonly string[]> = {
  overlane: [
    'overlane__0__telemetry_console',
    'overlane__1__drive_archive',
    'overlane__2__dashboard_charts',
    'overlane__3__hot_cold_storage',
    'overlane__4__stream_overlays',
  ],
  mappy: [
    'mappy__0__offline_map_workspace',
    'mappy__1__marker_maker_tile_studio',
    'mappy__2__unified_search',
    'mappy__3__measure_progress',
  ],
  'mods-hub': [
    'mods-hub__0__authoring_workflow',
    'mods-hub__1__semantic_versions',
    'mods-hub__2__search_syntax',
    'mods-hub__3__downloads_encryption',
  ],
  offerings: [
    'offerings__0__weighted_lottery',
    'offerings__1__streaks_milestones',
    'offerings__2__in_game_admin',
    'offerings__3__luckperms_ready',
  ],
  'obs-animation-suite': [
    'obs-animation-suite__0__source_transitions',
    'obs-animation-suite__1__smart_swapping',
    'obs-animation-suite__2__layout_presets',
    'obs-animation-suite__3__text_cycler',
  ],
};