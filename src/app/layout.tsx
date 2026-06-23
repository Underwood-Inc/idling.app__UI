import { RADIO_PWA_MANIFEST_HREF, RADIO_PWA_THEME_COLOR } from '@lib/radio-pwa/constants';
import { RadioPwaContextBootstrap } from './components/radio-pwa/RadioPwaContextBootstrap';
import { SiteChromeProviders } from './components/site-chrome/SiteChromeProviders';
import { SiteChromeShell } from './components/site-chrome/SiteChromeShell';
import { Metadata, Viewport } from 'next';
import React from 'react';
import './globals.css';
import '../css/mappy-cursors/cursors.css';

export const metadata: Metadata = {
  title: {
    default: 'Idling.app',
    template: '%s | Idling.app',
  },
  description: 'Your digital playground for creativity and expression',
  keywords: ['creativity', 'expression', 'digital', 'playground'],
  authors: [{ name: 'Idling.app Team' }],
  creator: 'Idling.app',
  publisher: 'Idling.app',
  metadataBase: new URL('https://idling.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://idling.app',
    title: 'Idling.app',
    description: 'Your digital playground for creativity and expression',
    siteName: 'Idling.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Idling.app',
    description: 'Your digital playground for creativity and expression',
    creator: '@idlingapp',
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
  manifest: RADIO_PWA_MANIFEST_HREF,
};

export const viewport: Viewport = {
  themeColor: RADIO_PWA_THEME_COLOR,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
