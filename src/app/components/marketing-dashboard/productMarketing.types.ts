import type { ProjectShowcaseProject } from '../project-showcase/projectShowcaseProjects';

export interface ProductMarketingLink {
  href: string;
  label: string;
  external: boolean;
}

export interface ProductMarketingPrimaryLink {
  href: string;
  label: string;
  external: boolean;
}

export interface ProductMarketingDashboardCopy {
  eyebrow: string;
  title: string;
  line: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta: string;
  secondaryHref: string;
}

export interface ProductMarketingExploreLink {
  href: string;
  title: string;
  line: string;
}

export type ProductMarketingProject = ProjectShowcaseProject;

export type HomeHubTileVisualFit = 'cover' | 'contain';

export interface HomeHubTileVisual {
  src: string;
  alt: string;
  fit?: HomeHubTileVisualFit;
}

export interface ProductMarketingHighlight {
  title: string;
  body: string;
}

export interface HomeHubChapterConfig {
  projectId: string;
  headline: string;
  visual: HomeHubTileVisual;
  proprietary?: boolean;
}

export interface HomeHubLearnMoreLink {
  href: string;
  label: string;
  external: boolean;
}

export interface HomeHubChapter {
  project: ProjectShowcaseProject;
  headline: string;
  pitch: string;
  highlights: ProductMarketingHighlight[];
  visual: HomeHubTileVisual;
  learnMore: HomeHubLearnMoreLink;
  primary: ProductMarketingPrimaryLink;
  proprietary: boolean;
}