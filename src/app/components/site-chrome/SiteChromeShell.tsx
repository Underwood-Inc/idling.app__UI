import Footer from '../footer/Footer';
import Header from '../header/Header';
import MessageTickerWithInterval from '../message-ticker/MessageTickerWithInterval';
import PWAInstallPrompt from '../pwa-install/PWAInstallPrompt';
import { OverlayRendererWrapper } from '../ui/ClientWrappers';
import { NavigationLoadingBar } from '../ui/NavigationLoadingBar';
import type { ReactNode } from 'react';

/** Full idling.app browser chrome — not rendered for the radio PWA launch shell. */
export function SiteChromeShell({ children }: { children: ReactNode }) {
  return (
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
      <main data-visualizer-layout>{children}</main>
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
  );
}
