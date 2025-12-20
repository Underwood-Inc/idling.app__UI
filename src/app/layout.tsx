import { GlobalLoadingProvider } from '@lib/context/GlobalLoadingContext';
import { NavigationLoadingProvider } from '@lib/context/NavigationLoadingContext';
import { OverlayProvider } from '@lib/context/OverlayContext';
import { UserDataBatchProvider } from '@lib/context/UserDataBatchContext';
import { UserPreferencesProvider } from '@lib/context/UserPreferencesContext';
import { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import React from 'react';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import PWAInstallPrompt from './components/pwa-install/PWAInstallPrompt';
import { ServiceWorkerRegistration } from './components/service-worker/ServiceWorkerRegistration';
import { OverlayRendererWrapper } from './components/ui/ClientWrappers';
import { NavigationLoadingBar } from './components/ui/NavigationLoadingBar';
import './globals.css';

export const metadata: Metadata = {
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
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff6b35" />
      </head>
      <body>
        <SessionProvider>
          <UserPreferencesProvider>
            <OverlayProvider>
              <NavigationLoadingProvider>
                <GlobalLoadingProvider>
                  <UserDataBatchProvider>
                    <NavigationLoadingBar />
                    <Header />
                    <main>{children}</main>
                    <Footer />
                    <OverlayRendererWrapper />
                    <ServiceWorkerRegistration />
                    <PWAInstallPrompt />
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
