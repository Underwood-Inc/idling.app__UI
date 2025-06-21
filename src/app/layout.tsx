import type { Metadata, Viewport } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { OverlayProvider } from '../lib/context/OverlayContext';
import { JotaiProvider } from '../lib/state/JotaiProvider';
import { AvatarsBackground } from './components/avatars-background/AvatarsBackground';
import { NotFoundErrorBoundary } from './components/error-boundary/NotFoundErrorBoundary';
import FadeIn from './components/fade-in/FadeIn';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import Loader from './components/loader/Loader';
import MessageTickerWithInterval from './components/message-ticker/MessageTickerWithInterval';
import PWAInstallPrompt from './components/pwa-install/PWAInstallPrompt';
import { ServiceWorkerRegistration } from './components/service-worker/ServiceWorkerRegistration';
import TimeoutBanner from './components/timeout-banner/TimeoutBanner';
import { OverlayRenderer } from './components/ui/OverlayRenderer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Idling.app',
  description: 'Revisit often to see the latest changes and play!',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Idling App'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ff6b35'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Standard favicon */}
        <link
          rel="icon"
          href="/favicon.ico"
          type="image/x-icon"
          sizes="16x16"
        />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          type="image/png"
          sizes="16x16"
        />
        <link
          rel="icon"
          href="/favicon-32x32.png"
          type="image/png"
          sizes="32x32"
        />

        {/* Apple touch icons */}
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />

        {/* Android chrome icons */}
        <link
          rel="icon"
          href="/android-chrome-192x192.png"
          type="image/png"
          sizes="192x192"
        />
        <link
          rel="icon"
          href="/android-chrome-512x512.png"
          type="image/png"
          sizes="512x512"
        />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA meta tags */}
        <meta name="theme-color" content="#ff6b35" />
        <meta name="background-color" content="#000000" />
        <meta name="display" content="standalone" />
        <meta name="orientation" content="portrait-primary" />

        {/* Apple PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Idling App" />

        {/* Microsoft PWA meta tags */}
        <meta name="msapplication-TileColor" content="#ff6b35" />
        <meta
          name="msapplication-TileImage"
          content="/android-chrome-192x192.png"
        />

        {/* Additional PWA optimizations */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Idling App" />
      </head>

      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <SessionProvider>
          <OverlayProvider>
            <TimeoutBanner />
            <main>
              <AvatarsBackground />

              <Header />

              <MessageTickerWithInterval />

              <Suspense fallback={<Loader />}>
                <JotaiProvider>
                  <NotFoundErrorBoundary>
                    <FadeIn>{children}</FadeIn>
                  </NotFoundErrorBoundary>
                </JotaiProvider>
              </Suspense>
              <Footer />
            </main>
            <OverlayRenderer />
            <PWAInstallPrompt />
          </OverlayProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
