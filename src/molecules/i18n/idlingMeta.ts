import 'server-only';

import { COMMON_EN, type CommonEnCopy } from '$i18n-source/common.en';
import { META_EN, type MetaEnCopy } from '$i18n-source/meta.en';
import { PROFILE_EN, type ProfileEnCopy } from '$i18n-source/profile.en';
import type { Metadata } from 'next';
import { getServerLL } from '$i18n/idling-server-i18n';
import { resolveCatalogFromLl } from './resolveEnCatalog';

export async function resolveMetaCopy(): Promise<MetaEnCopy> {
  const ll = await getServerLL();
  return resolveCatalogFromLl(META_EN, ll.meta as Record<string, unknown>);
}

export async function resolveCommonCopy(): Promise<CommonEnCopy> {
  const ll = await getServerLL();
  return resolveCatalogFromLl(COMMON_EN, ll.common as Record<string, unknown>);
}

export async function resolveProfileCopy(): Promise<ProfileEnCopy> {
  const ll = await getServerLL();
  return resolveCatalogFromLl(PROFILE_EN, ll.profile as Record<string, unknown>);
}

export function formatProfileNamedCopy(template: string, name: string): string {
  return template.replace(/\{name\}/g, name);
}

export async function buildRootSiteMetadata(): Promise<Metadata> {
  const meta = await resolveMetaCopy();
  const site = meta.site;

  return {
    title: {
      default: site.defaultTitle,
      template: site.titleTemplate,
    },
    description: site.description,
    keywords: site.keywords,
    authors: [{ name: site.authorName }],
    creator: site.creator,
    publisher: site.publisher,
    metadataBase: new URL('https://idling.app'),
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://idling.app',
      title: site.openGraphTitle,
      description: site.openGraphDescription,
      siteName: site.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: site.twitterTitle,
      description: site.twitterDescription,
      creator: site.twitterCreator,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'google-adsense-account': 'ca-pub-1546133996920392',
    },
  };
}

export async function buildHomePageMetadata(): Promise<Metadata> {
  const ll = await getServerLL();
  return {
    description: ll.home.masthead.line(),
  };
}

export async function buildPortfolioPageMetadata(): Promise<Metadata> {
  const meta = await resolveMetaCopy();
  return {
    title: meta.pages.portfolioTitle,
    description: meta.pages.portfolioDescription,
  };
}

export async function buildAdminPageMetadata(): Promise<Metadata> {
  const meta = await resolveMetaCopy();
  return {
    title: meta.pages.adminTitle,
    description: meta.pages.adminDescription,
  };
}