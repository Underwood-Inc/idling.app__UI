import type { TranslationFunctions } from '$i18n/i18n-types';
import { withShowcaseCopy } from '@molecules/i18n/idlingShowcaseI18n';
import {
  resolveHomeHubCopy,
  resolveMinecraftMoreLinkLabel,
} from '@molecules/i18n/idlingProductMarketingI18n';
import type { HomeHubChapter } from './productMarketing.types';
import { HOME_HUB_STRUCTURE, getHomeHubContentEntry } from './homeHubContent';
import { getHomeProductPrimaryLink, getProductMarketingProject } from './productMarketing';

export function listHomeHubChapters(ll?: TranslationFunctions): HomeHubChapter[] {
  return HOME_HUB_STRUCTURE.flatMap((entry) => {
    const baseProject = getProductMarketingProject(entry.projectId);
    const project = baseProject && ll ? withShowcaseCopy(baseProject, ll) : baseProject;
    const primary = project ? getHomeProductPrimaryLink(project, ll) : null;

    if (!project || !primary) {
      return [];
    }

    const localized = ll
      ? resolveHomeHubCopy(entry.projectId, entry.highlightKeys, ll)
      : undefined;
    const english = getHomeHubContentEntry(entry.projectId);

    const headline = localized?.headline ?? english?.headline ?? project.title;
    const pitch = localized?.pitch ?? english?.pitch ?? project.description;
    const highlights = localized?.highlights ?? english?.highlights ?? [];
    const learnMoreLabel =
      localized?.learnMoreLabel ?? english?.learnMoreLabel ?? 'Learn more';
    const visualAlt =
      localized?.visualAlt ?? english?.visual.alt ?? project.title;

    return [
      {
        project,
        headline,
        pitch,
        highlights,
        visual: { ...entry.visual, alt: visualAlt },
        learnMore: {
          href: entry.learnMoreHref,
          label: learnMoreLabel,
          external: entry.learnMoreExternal,
        },
        primary,
        proprietary: entry.proprietary === true,
      },
    ];
  });
}

/** Secondary link for minecraft shelf rows — prefer tours and marketplaces over generic product stubs. */
export function getHomeHubMinecraftMoreLink(
  projectId: string,
  ll?: TranslationFunctions
): HomeHubChapter['learnMore'] | null {
  const project = getProductMarketingProject(projectId);
  if (!project) {
    return null;
  }

  const content = getHomeHubContentEntry(projectId);
  if (content) {
    return {
      href: content.learnMoreHref,
      label: content.learnMoreLabel,
      external: content.learnMoreExternal,
    };
  }

  if (project.links.demo) {
    const external = project.links.demo.startsWith('http');
    return {
      href: project.links.demo,
      label: external
        ? ll
          ? resolveMinecraftMoreLinkLabel('productTour', ll)
          : 'Product tour'
        : ll
          ? resolveMinecraftMoreLinkLabel('seeTour', ll)
          : 'See tour',
      external,
    };
  }

  if (project.links.modrinth) {
    return {
      href: project.links.modrinth,
      label: ll ? resolveMinecraftMoreLinkLabel('modrinthPage', ll) : 'Modrinth page',
      external: true,
    };
  }

  if (project.links.builtByBit) {
    return {
      href: project.links.builtByBit,
      label: ll
        ? resolveMinecraftMoreLinkLabel('builtByBitListing', ll)
        : 'BuiltByBit listing',
      external: true,
    };
  }

  return {
    href: `/products/${project.id}`,
    label: ll ? resolveMinecraftMoreLinkLabel('onIdlingApp', ll) : 'On idling.app',
    external: false,
  };
}