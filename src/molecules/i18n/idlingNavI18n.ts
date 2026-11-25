import type { TranslationFunctions } from '$i18n/i18n-types';
import enCatalog from '$i18n/locales/en.json';
import { ROUTE_KEYS } from '@lib/routes';

export type IdlingNavGroupKey = keyof TranslationFunctions['nav']['groups'];

const englishNavGroups = enCatalog.nav.groups as Record<string, string>;
const englishNavRoutes = enCatalog.nav.routes as Record<string, string>;

export function resolveNavGroupLabel(
  groupKey: string,
  ll: TranslationFunctions
): string {
  const groups = ll.nav?.groups;
  const key = groupKey as IdlingNavGroupKey;
  if (groups && key in groups && typeof groups[key] === 'function') {
    return String(groups[key]());
  }
  return englishNavGroups[groupKey] ?? groupKey;
}

export function resolveNavRouteLabel(
  routeKey: ROUTE_KEYS,
  ll: TranslationFunctions
): string {
  const routes = ll.nav?.routes;
  const key = routeKey as keyof typeof routes;
  if (routes && key in routes && typeof routes[key] === 'function') {
    return String(routes[key]());
  }
  return englishNavRoutes[routeKey] ?? routeKey;
}

export function resolveNavExternalLinkAria(ll: TranslationFunctions): string {
  if (typeof ll.nav?.externalLinkAria === 'function') {
    return ll.nav.externalLinkAria();
  }
  return enCatalog.nav.externalLinkAria;
}