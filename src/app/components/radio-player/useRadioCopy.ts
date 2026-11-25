'use client';

import { RADIO_EN, type RadioEnCopy } from '$i18n-source/radio.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { useMemo } from 'react';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';

export function useRadioCopy(): RadioEnCopy {
  const { ll, localeRevision } = useIdlingLocale();
  return useMemo(
    () => resolveCatalogFromLl(RADIO_EN, ll.radio as Record<string, unknown>),
    [ll, localeRevision]
  );
}