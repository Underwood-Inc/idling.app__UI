import type { Metadata, Viewport } from 'next';
import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { NavigationLoadingProvider } from '../lib/context/NavigationLoadingContext';
import { OverlayProvider } from '../lib/context/OverlayContext';
import { JotaiProvider } from '../lib/state/JotaiProvider';
import { SessionRefreshHandler } from './components/auth-buttons/SessionRefreshHandler';
import { AvatarsBackground } from './components/avatars-background/AvatarsBackground';
import { NotFoundErrorBoundary } from './components/error-boundary/NotFoundErrorBoundary';
import FadeIn from './components/fade-in/FadeIn';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import Loader from './components/loader/Loader';
import MessageTickerWithInterval from './components/message-ticker/MessageTickerWithInterval';
import PWAInstallPrompt from './components/pwa-install/PWAInstallPrompt';
import { HardResetManager } from './components/service-worker/HardResetManager';
import { ServiceWorkerRegistration } from './components/service-worker/ServiceWorkerRegistration';
import TimeoutBanner from './components/timeout-banner/TimeoutBanner';
import { NavigationLoadingBar } from './components/ui/NavigationLoadingBar';
import { OverlayRenderer } from './components/ui/OverlayRenderer';
import './fonts.css';
import './globals.css';
// Import service worker cleanup utilities to make them globally available
import '../lib/utils/service-worker-cleanup';

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

// Global console silencer for production
const ConsoleProductionSilencer = () => {
  if (process.env.NODE_ENV === 'production') {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window !== 'undefined' && window.console) {
                // Store original console methods for potential debugging
                window.__originalConsole = {
                  log: console.log,
                  info: console.info,
                  warn: console.warn,
                  error: console.error,
                  debug: console.debug,
                  trace: console.trace,
                  group: console.group,
                  groupCollapsed: console.groupCollapsed,
                  groupEnd: console.groupEnd
                };
                
                // Replace console methods with no-ops
                console.log = function() {};
                console.info = function() {};
                console.warn = function() {};
                console.error = function() {};
                console.debug = function() {};
                console.trace = function() {};
                console.group = function() {};
                console.groupCollapsed = function() {};
                console.groupEnd = function() {};
                
                // Handle postMessage safely without breaking normal operations
                const originalPostMessage = window.postMessage;
                window.postMessage = function(message, targetOrigin, transfer) {
                  // Only filter out console-related messages, let everything else pass through normally
                  if (typeof message === 'object' && message && message.type === 'console') {
                    return; // Silently ignore console messages
                  }
                  
                  // For all other messages, call original postMessage with proper error handling
                  try {
                    return originalPostMessage.call(this, message, targetOrigin, transfer);
                  } catch (error) {
                    // If targetOrigin is undefined/null, use window.location.origin as fallback
                    if (error.message && error.message.includes('Invalid target origin')) {
                      const safeTargetOrigin = targetOrigin || window.location.origin;
                      return originalPostMessage.call(this, message, safeTargetOrigin, transfer);
                    }
                    // Re-throw other errors
                    throw error;
                  }
                };
                
                // Override iframe console access
                const originalCreateElement = document.createElement;
                document.createElement = function(tagName) {
                  const element = originalCreateElement.call(this, tagName);
                  if (tagName.toLowerCase() === 'iframe') {
                    element.addEventListener('load', function() {
                      try {
                        if (this.contentWindow && this.contentWindow.console) {
                          this.contentWindow.console.log = function() {};
                          this.contentWindow.console.info = function() {};
                          this.contentWindow.console.warn = function() {};
                          this.contentWindow.console.error = function() {};
                          this.contentWindow.console.debug = function() {};
                          this.contentWindow.console.trace = function() {};
                          this.contentWindow.console.group = function() {};
                          this.contentWindow.console.groupCollapsed = function() {};
                          this.contentWindow.console.groupEnd = function() {};
                        }
                      } catch (e) {
                        // Cross-origin iframe, can't access console
                      }
                    });
                  }
                  return element;
                };
              }
            })();
          `
        }}
      />
    );
  }
  return null;
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ConsoleProductionSilencer />
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
        <meta name="app-version" content="0.134.0" />
      </head>

      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <HardResetManager />
        <SessionProvider>
          <NavigationLoadingProvider>
            <NavigationLoadingBar />
            <SessionRefreshHandler />
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
          </NavigationLoadingProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
