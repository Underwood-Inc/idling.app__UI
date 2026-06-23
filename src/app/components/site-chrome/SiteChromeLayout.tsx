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
      <div data-visualizer-layout data-site-chrome>
        <NavigationLoadingBar />
      </div>
      <div data-visualizer-layout className="sticky-header-wrapper" data-site-chrome>
        <Header />
      </div>
      <div data-visualizer-layout data-site-chrome>
        <MessageTickerWithInterval />
      </div>
      <main data-visualizer-layout>{children}</main>
      <div data-visualizer-layout data-site-chrome>
        <Footer />
      </div>
      <div data-visualizer-layout data-site-chrome>
        <OverlayRendererWrapper />
      </div>
      <div data-visualizer-layout data-site-chrome>
        <PWAInstallPrompt />
      </div>
    </SiteChromeProviders>
  );
}
