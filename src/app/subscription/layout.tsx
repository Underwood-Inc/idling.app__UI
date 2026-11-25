import { META_EN } from '$i18n-source/meta.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { getServerLL } from '$i18n/idling-server-i18n';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const ll = await getServerLL();
  const meta = resolveCatalogFromLl(META_EN, ll.meta as Record<string, unknown>);
  return {
    title: meta.pages.subscriptionTitle,
    description: meta.pages.subscriptionDescription,
  };
}

export default function SubscriptionLayout({ children }: { children: ReactNode }) {
  return children;
}