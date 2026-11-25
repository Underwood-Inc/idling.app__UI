'use client';

import { ADMIN_EN, type AdminEnCopy } from '$i18n-source/admin.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useIdlingLocale } from '../components/locale/IdlingLocaleProvider';

const AdminCopyContext = createContext<AdminEnCopy>(ADMIN_EN);

export function AdminCopyProvider({ children }: { children: ReactNode }) {
  const { ll } = useIdlingLocale();
  const copy = useMemo(
  () => resolveCatalogFromLl(ADMIN_EN, ll.admin as Record<string, unknown>),
    [ll]
  );
  return <AdminCopyContext.Provider value={copy}>{children}</AdminCopyContext.Provider>;
}

export function useAdminCopy(): AdminEnCopy {
  return useContext(AdminCopyContext);
}