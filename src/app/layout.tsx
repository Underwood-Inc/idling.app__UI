import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import Loader from './components/loader/Loader';
import './globals.css';
import { PaginationProvider } from './state/PaginationContext';

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
        <Header />

        <main>
          <Suspense fallback={<Loader />}>
            <PaginationProvider>{children}</PaginationProvider>
          </Suspense>
        </main>

        <Footer />
      </body>
    </html>
  );
}
