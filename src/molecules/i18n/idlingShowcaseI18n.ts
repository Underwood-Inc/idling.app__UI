import type { TranslationFunctions } from '$i18n/i18n-types';
import { PORTFOLIO_EN } from '$i18n-source/portfolio.en';
import enCatalog from '$i18n/locales/en.json';
import type {
  ProjectShowcaseProject,
} from '../../app/components/project-showcase/projectShowcaseProjects';
import { idlingProductI18nKey } from './idlingProductI18nKey';
import { resolveCatalogFromLl } from './resolveEnCatalog';

export interface ShowcaseProjectCopy {
  title: string;
  description: string;
  type: string;
  features: string[];
}

type ShowcaseCatalog = Record<string, ShowcaseProjectCopy>;

function readEnglishShowcase(projectId: string): ShowcaseProjectCopy | undefined {
  const catalog = enCatalog.catalog?.showcase as ShowcaseCatalog | undefined;
  return catalog?.[idlingProductI18nKey(projectId)];
}

export function withShowcaseCopy(
  project: ProjectShowcaseProject,
  ll?: TranslationFunctions
): ProjectShowcaseProject {
  const key = idlingProductI18nKey(project.id);
  const english = readEnglishShowcase(project.id) ?? {
    title: project.title,
    description: project.description,
    type: project.type,
    features: project.features,
  };

  if (!ll?.catalog?.showcase) {
    return { ...project, ...english };
  }

  const showcaseRoot = ll.catalog.showcase as Record<string, unknown>;
  const block = showcaseRoot[key];
  const resolved = resolveCatalogFromLl(english, block);

  return {
    ...project,
    title: resolved.title,
    description: resolved.description,
    type: resolved.type,
    features: resolved.features,
  };
}

/** Map stable English category ids to localized labels (ids must not be translated). */
export function buildPortfolioCategoryLabelById(
  ll: TranslationFunctions
): Record<string, string> {
  const localized = resolveCatalogFromLl(
    PORTFOLIO_EN,
    ll.portfolio as Record<string, unknown>
  );
  return Object.fromEntries(
    PORTFOLIO_EN.categories.map((enRow, index) => [
      enRow.id,
      localized.categories[index]?.label ?? enRow.label,
    ])
  );
}

export function resolvePortfolioCategoryLabel(
  categoryId: string,
  ll: TranslationFunctions
): string {
  return buildPortfolioCategoryLabelById(ll)[categoryId] ?? categoryId;
}