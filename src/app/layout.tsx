import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import { PaginationProvider } from '../lib/state/PaginationContext';
import { ShouldUpdateProvider } from '../lib/state/ShouldUpdateContext';
import { AvatarsBackground } from './components/avatars-background/AvatarsBackground';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import Loader from './components/loader/Loader';
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
        <main>
          <Suspense fallback={<Loader />}>
            <AvatarsBackground />
          </Suspense>

          <Header />
          <Suspense fallback={<Loader />}>
            <PaginationProvider>
              <ShouldUpdateProvider>{children}</ShouldUpdateProvider>
            </PaginationProvider>
          </Suspense>
          <Footer />
        </main>

        <script src="https://cdn.jsdelivr.net/npm/@widgetbot/crate@3" async defer>
          new Crate({
              server: '1234783462335189080', // idling.app
              channel: '1239616865559379969' // #activity
          })
        </script>
      </body>
    </html>
  );
}
