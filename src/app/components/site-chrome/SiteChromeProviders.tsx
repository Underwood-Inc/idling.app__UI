'use client';

import { GlobalLoadingProvider } from '@lib/context/GlobalLoadingContext';
import { NavigationLoadingProvider } from '@lib/context/NavigationLoadingContext';
import { OverlayProvider } from '@lib/context/OverlayContext';
import { RadioPlayerProvider } from '@lib/context/RadioPlayerContext';
import { UserDataBatchProvider } from '@lib/context/UserDataBatchContext';
import { UserPreferencesProvider } from '@lib/context/UserPreferencesContext';
import { VisualizerModeProvider } from '@lib/context/VisualizerModeContext';
import { ClarityUserIdentifier, MicrosoftClarity } from '@lib/observability';
import { SessionProvider } from 'next-auth/react';
import Script from 'next/script';
import type { ReactNode } from 'react';
import { RadioPlayerMountWrapper } from '../radio-player/RadioPlayerMountWrapper';
import { ServiceWorkerRegistration } from '../service-worker/ServiceWorkerRegistration';
import { AmbientBackgroundWrapper } from '../ui/ClientWrappers';
import { VisualizerModeGate } from '../visualizer-mode/VisualizerModeGate';

export interface SiteChromeProvidersProps {
  children: ReactNode;
}

export function SiteChromeProviders({ children }: SiteChromeProvidersProps) {
  return (
    <>
      <AmbientBackgroundWrapper />
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1546133996920392"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <MicrosoftClarity />
      <SessionProvider>
        <ClarityUserIdentifier />
        <UserPreferencesProvider>
          <OverlayProvider>
            <NavigationLoadingProvider>
              <GlobalLoadingProvider>
                <UserDataBatchProvider>
                  <RadioPlayerProvider>
                    <VisualizerModeProvider>
                      {children}
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
    </>
  );
}
