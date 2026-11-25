'use client';

import { COMMON_EN, type CommonEnCopy } from '$i18n-source/common.en';
import { resolveCatalogFromLl } from './resolveEnCatalog';
import { useIdlingLocale } from '../../app/components/locale/IdlingLocaleProvider';

export function useLocalizedCommon(): CommonEnCopy {
  const { ll } = useIdlingLocale();
  return resolveCatalogFromLl(COMMON_EN, ll.common as Record<string, unknown>);
}