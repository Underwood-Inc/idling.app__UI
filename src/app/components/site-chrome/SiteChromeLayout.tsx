import type { ReactNode } from 'react';
import PWAInstallPrompt from '../pwa-install/PWAInstallPrompt';
import { OverlayRendererWrapper } from '../ui/ClientWrappers';
import { NavigationLoadingBar } from '../ui/NavigationLoadingBar';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import MessageTickerWithInterval from '../message-ticker/MessageTickerWithInterval';
import { SiteChromeProviders } from './SiteChromeProviders';
import '../../globals.css';
import '../../../css/mappy-cursors/cursors.css';

/** Full idling.app browser shell — loaded only outside the installed radio PWA. */
export function SiteChromeLayout({ children }: { children: ReactNode }) {
  return (
    <SiteChromeProviders>
      <div
        data-visualizer-layout
        data-site-chrome
        role="status"
        aria-live="polite"
        aria-label="Page loading"
      >
        <NavigationLoadingBar />
      </div>
      <div
        data-visualizer-layout
        className="sticky-header-wrapper"
        data-site-chrome
        role="presentation"
      >
        <Header />
      </div>
      <section
        data-visualizer-layout
        data-site-chrome
        aria-label="Message ticker"
      >
        <MessageTickerWithInterval />
      </section>
      <main data-visualizer-layout>{children}</main>
      <div data-visualizer-layout data-site-chrome role="presentation">
        <Footer />
      </div>
      <section
        data-visualizer-layout
        data-site-chrome
        aria-label="Overlays"
      >
        <OverlayRendererWrapper />
      </section>
      <section
        data-visualizer-layout
        data-site-chrome
        aria-label="Install app"
      >
        <PWAInstallPrompt />
      </section>
    </SiteChromeProviders>
  );
}
