import type { HomeHubChapter } from './productMarketing.types';
import { getHomeHubContentEntry, HOME_HUB_CONTENT } from './homeHubContent';
import { getHomeProductPrimaryLink, getProductMarketingProject } from './productMarketing';

export function listHomeHubChapters(): HomeHubChapter[] {
  return HOME_HUB_CONTENT.flatMap((entry) => {
    const project = getProductMarketingProject(entry.projectId);
    const primary = project ? getHomeProductPrimaryLink(project) : null;

    if (!project || !primary) {
      return [];
    }

    return [
      {
        project,
        headline: entry.headline,
        pitch: entry.pitch,
        highlights: entry.highlights,
        visual: entry.visual,
        learnMore: {
          href: entry.learnMoreHref,
          label: entry.learnMoreLabel,
          external: entry.learnMoreExternal,
        },
        primary,
        proprietary: entry.proprietary === true,
      },
    ];
  });
}

/** Secondary link for minecraft shelf rows — prefer tours and marketplaces over generic product stubs. */
export function getHomeHubMinecraftMoreLink(projectId: string): HomeHubChapter['learnMore'] | null {
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
      label: external ? 'Product tour' : 'See tour',
      external,
    };
  }

  if (project.links.modrinth) {
    return {
      href: project.links.modrinth,
      label: 'Modrinth page',
      external: true,
    };
  }

  if (project.links.builtByBit) {
    return {
      href: project.links.builtByBit,
      label: 'BuiltByBit listing',
      external: true,
    };
  }

  return {
    href: `/products/${project.id}`,
    label: 'On idling.app',
    external: false,
  };
}