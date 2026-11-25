import { buildRootSiteMetadata } from '@molecules/i18n/idlingMeta';
import { RADIO_PWA_MANIFEST_HREF, RADIO_PWA_THEME_COLOR } from '@lib/radio-pwa/constants';
import { RadioPwaContextBootstrap } from './components/radio-pwa/RadioPwaContextBootstrap';
import { SiteChromeProviders } from './components/site-chrome/SiteChromeProviders';
import { SiteChromeShell } from './components/site-chrome/SiteChromeShell';
import { Metadata, Viewport } from 'next';
import React from 'react';
import './globals.css';
import '../css/mappy-cursors/cursors.css';

export async function generateMetadata(): Promise<Metadata> {
  const base = await buildRootSiteMetadata();
  return {
    ...base,
    manifest: RADIO_PWA_MANIFEST_HREF,
  };
}

export const viewport: Viewport = {
  themeColor: RADIO_PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href={RADIO_PWA_MANIFEST_HREF} />
        <meta name="application-name" content="Idling Radio" />
        <meta name="apple-mobile-web-app-title" content="Idling Radio" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content={RADIO_PWA_THEME_COLOR} />
      </head>
      <body>
        <RadioPwaContextBootstrap />
        <SiteChromeProviders>
          <SiteChromeShell>{children}</SiteChromeShell>
        </SiteChromeProviders>
      </body>
    </html>
  );
}
