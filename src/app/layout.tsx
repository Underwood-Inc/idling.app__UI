import { GlobalLoadingProvider } from '@lib/context/GlobalLoadingContext';
import { NavigationLoadingProvider } from '@lib/context/NavigationLoadingContext';
import { OverlayProvider } from '@lib/context/OverlayContext';
import { UserDataBatchProvider } from '@lib/context/UserDataBatchContext';
import { UserPreferencesProvider } from '@lib/context/UserPreferencesContext';
import { VisualizerModeProvider } from '@lib/context/VisualizerModeContext';
import { IDLING_RADIO_PWA_SHELL_HEADER, RADIO_PWA_MANIFEST_HREF } from '@lib/radio-pwa/constants';
import { RADIO_PWA_STANDALONE_DETECTION_SCRIPT } from '@lib/radio-pwa/standaloneDetectionScript';
import { RadioPlayerProvider } from '@lib/context/RadioPlayerContext';
import { ClarityUserIdentifier, MicrosoftClarity } from '@lib/observability';
import { Metadata, Viewport } from 'next';
import { SessionProvider } from 'next-auth/react';
import Script from 'next/script';
import { headers } from 'next/headers';
import React from 'react';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import MessageTickerWithInterval from './components/message-ticker/MessageTickerWithInterval';
import PWAInstallPrompt from './components/pwa-install/PWAInstallPrompt';
import { RadioPwaStandaloneRedirect } from './components/radio-pwa/RadioPwaStandaloneRedirect';
import { RadioPwaStandaloneVisualizerBootstrap } from './components/radio-pwa/RadioPwaStandaloneVisualizerBootstrap';
import { ServiceWorkerRegistration } from './components/service-worker/ServiceWorkerRegistration';
import { OverlayRendererWrapper, AmbientBackgroundWrapper, RadioPlayerMountWrapper } from './components/ui/ClientWrappers';
import { NavigationLoadingBar } from './components/ui/NavigationLoadingBar';
import { VisualizerModeGate } from './components/visualizer-mode/VisualizerModeGate';
import './globals.css';
import '../css/mappy-cursors/cursors.css';

const baseMetadata: Metadata = {
  title: {
    default: 'Idling.app',
    template: '%s | Idling.app'
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
    siteName: 'Idling.app'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Idling.app',
    description: 'Your digital playground for creativity and expression',
    creator: '@idlingapp'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  other: {
    'google-adsense-account': 'ca-pub-1546133996920392'
  },
  manifest: RADIO_PWA_MANIFEST_HREF,
};

const baseViewport: Viewport = {
  themeColor: '#e5c185',
};

export async function generateViewport(): Promise<Viewport> {
  const isRadioShell = (await headers()).get(IDLING_RADIO_PWA_SHELL_HEADER) === '1';

  if (!isRadioShell) {
    return baseViewport;
  }

  return {
    themeColor: '#e5c185',
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const isRadioShell = (await headers()).get(IDLING_RADIO_PWA_SHELL_HEADER) === '1';

  if (!isRadioShell) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    manifest: RADIO_PWA_MANIFEST_HREF,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const isRadioShell = (await headers()).get(IDLING_RADIO_PWA_SHELL_HEADER) === '1';

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href={RADIO_PWA_MANIFEST_HREF} />
        <script dangerouslySetInnerHTML={{ __html: RADIO_PWA_STANDALONE_DETECTION_SCRIPT }} />
      </head>
      <body>
        <RadioPwaStandaloneRedirect />
        <AmbientBackgroundWrapper />
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1546133996920392"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Observability: Microsoft Clarity - Heatmaps & Session Recordings */}
        <MicrosoftClarity />
        <SessionProvider>
          {/* Observability: Identify logged-in users in Microsoft Clarity */}
          <ClarityUserIdentifier />
          <UserPreferencesProvider>
            <OverlayProvider>
              <NavigationLoadingProvider>
                <GlobalLoadingProvider>
                  <UserDataBatchProvider>
                    <RadioPlayerProvider>
                      <VisualizerModeProvider>
                        <RadioPwaStandaloneVisualizerBootstrap />
                        {!isRadioShell ? (
                          <div data-site-chrome>
                            <div data-visualizer-layout>
                              <NavigationLoadingBar />
                            </div>
                            <div data-visualizer-layout className="sticky-header-wrapper">
                              <Header />
                            </div>
                            <div data-visualizer-layout>
                              <MessageTickerWithInterval />
                            </div>
                          </div>
                        ) : null}
                        <main data-visualizer-layout>{children}</main>
                        {!isRadioShell ? (
                          <div data-site-chrome>
                            <div data-visualizer-layout>
                              <Footer />
                            </div>
                            <div data-visualizer-layout>
                              <OverlayRendererWrapper />
                            </div>
                            <div data-visualizer-layout>
                              <PWAInstallPrompt />
                            </div>
                          </div>
                        ) : null}
                        <div data-visualizer-layout>
                          <ServiceWorkerRegistration />
                        </div>
                        <RadioPlayerMountWrapper />
                        <VisualizerModeGate />
                      </VisualizerModeProvider>
                    </RadioPlayerProvider>
                  </UserDataBatchProvider>
                </GlobalLoadingProvider>
              </NavigationLoadingProvider>
            </OverlayProvider>
          </UserPreferencesProvider>
        </SessionProvider>
        <div id="overlay-portal"></div>
      </body>
    </html>
  );
}
