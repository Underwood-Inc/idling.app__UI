'use client';

import { SETTINGS_EN, type SettingsEnCopy } from '$i18n-source/settings.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useIdlingLocale } from '../components/locale/IdlingLocaleProvider';

const SettingsCopyContext = createContext<SettingsEnCopy>(SETTINGS_EN);

export function SettingsCopyProvider({ children }: { children: ReactNode }) {
  const { ll } = useIdlingLocale();
  const copy = useMemo(
    () => resolveCatalogFromLl(SETTINGS_EN, ll.settings as Record<string, unknown>),
    [ll]
  );
  return (
    <SettingsCopyContext.Provider value={copy}>{children}</SettingsCopyContext.Provider>
  );
}

export function useSettingsCopy(): SettingsEnCopy {
  return useContext(SettingsCopyContext);
}