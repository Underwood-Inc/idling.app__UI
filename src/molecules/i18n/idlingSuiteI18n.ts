import type { TranslationFunctions } from '$i18n/i18n-types';
import enCatalog from '$i18n/locales/en.json';
import type {
  StrixunSuiteProductCopy,
  StrixunSuiteProductStructure,
} from '../../app/strixun-stream-suite/strixunSuiteProducts';
import { idlingProductI18nKey } from './idlingProductI18nKey';
import { resolveCatalogFromLl } from './resolveEnCatalog';

export interface ResolvedStrixunProduct extends StrixunSuiteProductStructure, StrixunSuiteProductCopy {}

function suiteProductJsonKey(productId: string): string {
  return productId.replace(/-/g, '_');
}

function readEnglishSuiteProduct(productId: string): StrixunSuiteProductCopy | undefined {
  const catalog = enCatalog.suite?.products as Record<string, StrixunSuiteProductCopy> | undefined;
  return catalog?.[suiteProductJsonKey(productId)];
}

export function resolveStrixunSuiteProduct(
  structure: StrixunSuiteProductStructure,
  english: StrixunSuiteProductCopy,
  ll?: TranslationFunctions
): ResolvedStrixunProduct {
  const jsonKey = suiteProductJsonKey(structure.id);
  const fallback = readEnglishSuiteProduct(structure.id) ?? english;

  if (!ll?.suite?.products) {
    return { ...structure, ...fallback };
  }

  const products = ll.suite.products as Record<string, unknown>;
  const resolved = resolveCatalogFromLl(fallback, products[jsonKey]);

  return { ...structure, ...resolved };
}

import type { SuiteLandingEnCopy } from '$i18n-source/suiteLanding.en';
import { SUITE_LANDING_EN } from '$i18n-source/suiteLanding.en';

export function resolveSuiteLandingCopy(ll: TranslationFunctions): SuiteLandingEnCopy {
  if (!ll.suite?.landing) {
    return resolveCatalogFromLl(SUITE_LANDING_EN, undefined);
  }
  return resolveCatalogFromLl(SUITE_LANDING_EN, ll.suite.landing as Record<string, unknown>);
}