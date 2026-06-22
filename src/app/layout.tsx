import { GlobalLoadingProvider } from '@lib/context/GlobalLoadingContext';
import { NavigationLoadingProvider } from '@lib/context/NavigationLoadingContext';
import { OverlayProvider } from '@lib/context/OverlayContext';
import { UserDataBatchProvider } from '@lib/context/UserDataBatchContext';
import { UserPreferencesProvider } from '@lib/context/UserPreferencesContext';
import { VisualizerModeProvider } from '@lib/context/VisualizerModeContext';
import { IDLING_RADIO_PWA_SHELL_HEADER, RADIO_PWA_INSTALL_INTENT_COOKIE, RADIO_PWA_MANIFEST_HREF } from '@lib/radio-pwa/constants';
import { readRadioInstallIntentCookie } from '@lib/radio-pwa/intent';
import { RadioPlayerProvider } from '@lib/context/RadioPlayerContext';
import { ClarityUserIdentifier, MicrosoftClarity } from '@lib/observability';
import { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import Script from 'next/script';
import { cookies, headers } from 'next/headers';
import React from 'react';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import MessageTickerWithInterval from './components/message-ticker/MessageTickerWithInterval';
import PWAInstallPrompt from './components/pwa-install/PWAInstallPrompt';
import { RADIO_PWA_INSTALL_EARLY_CAPTURE_SCRIPT } from '@lib/radio-pwa/installPrompt';
import { ServiceWorkerRegistration } from './components/service-worker/ServiceWorkerRegistration';
import { OverlayRendererWrapper, AmbientBackgroundWrapper, RadioPlayerMountWrapper } from './components/ui/ClientWrappers';
import { NavigationLoadingBar } from './components/ui/NavigationLoadingBar';
import { VisualizerModeGate } from './components/visualizer-mode/VisualizerModeGate';
import { RadioPwaStandaloneGuardScript } from './idling-radio/RadioPwaStandaloneGuardScript';
import './globals.css';
import '../css/mappy-cursors/cursors.css';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const radioInstallIntent = readRadioInstallIntentCookie(
    cookieStore.get(RADIO_PWA_INSTALL_INTENT_COOKIE)?.value
  );

  return {
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
    manifest: radioInstallIntent ? RADIO_PWA_MANIFEST_HREF : '/manifest.json',
    themeColor: '#ff6b35',
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const isRadioShell = (await headers()).get(IDLING_RADIO_PWA_SHELL_HEADER) === '1';
  const cookieStore = await cookies();
  const radioInstallIntent = readRadioInstallIntentCookie(
    cookieStore.get(RADIO_PWA_INSTALL_INTENT_COOKIE)?.value
  );

  return (
    <html lang="en">
      <body>
        {radioInstallIntent ? (
          <Script
            id="idling-radio-pwa-install-capture"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: RADIO_PWA_INSTALL_EARLY_CAPTURE_SCRIPT }}
          />
        ) : null}
        {isRadioShell ? <RadioPwaStandaloneGuardScript /> : null}
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
                        {!isRadioShell ? (
                          <>
                            <div data-visualizer-layout>
                              <NavigationLoadingBar />
                            </div>
                            <div data-visualizer-layout className="sticky-header-wrapper">
                              <Header />
                            </div>
                            <div data-visualizer-layout>
                              <MessageTickerWithInterval />
                            </div>
                          </>
                        ) : null}
                        <main data-visualizer-layout>{children}</main>
                        {!isRadioShell ? (
                          <>
                            <div data-visualizer-layout>
                              <Footer />
                            </div>
                            <div data-visualizer-layout>
                              <OverlayRendererWrapper />
                            </div>
                            <div data-visualizer-layout>
                              <PWAInstallPrompt />
                            </div>
                          </>
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
