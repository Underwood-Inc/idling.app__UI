import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { ShouldUpdateProvider } from '../lib/state/ShouldUpdateContext';
import { AvatarsBackground } from './components/avatars-background/AvatarsBackground';
import { NotFoundErrorBoundary } from './components/error-boundary/NotFoundErrorBoundary';
import FadeIn from './components/fade-in/FadeIn';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import Loader from './components/loader/Loader';
import MessageTickerWithInterval from './components/message-ticker/MessageTickerWithInterval';
import { ServiceWorkerRegistration } from './components/service-worker/ServiceWorkerRegistration';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Idling.app',
  description: 'Revisit often to see the latest changes and play!'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
      <link
        rel="icon-medium"
        href="/favicon-32x32.png"
        type="image/x-icon"
        sizes="32x32"
      />
      <link
        rel="apple-touch-icon"
        href="/apple-touch-icon.png"
        type="image/x-icon"
        sizes="180x180"
      />
      <link
        rel="android-chrome-icon"
        href="/android-chrome-192x192.png"
        type="image/x-icon"
        sizes="192x192"
      />
      <link
        rel="android-chrome-icon"
        href="/android-chrome-512x512.png"
        type="image/x-icon"
        sizes="512x512"
      />

      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <main>
          <AvatarsBackground />

          <Header />

          <MessageTickerWithInterval />

          <Suspense fallback={<Loader />}>
            <ShouldUpdateProvider>
              <NotFoundErrorBoundary>
                <FadeIn>{children}</FadeIn>
              </NotFoundErrorBoundary>
            </ShouldUpdateProvider>
          </Suspense>
          <Footer />
        </main>
      </body>
    </html>
  );
}
