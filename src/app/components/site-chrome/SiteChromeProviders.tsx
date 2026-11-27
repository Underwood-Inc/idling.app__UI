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
import type { ReactNode } from 'react';
import { ToastViewport } from '@molecules/toast/ToastViewport';
import { RadioPlayerMountWrapper } from '../radio-player/RadioPlayerMountWrapper';
import { OceConnectivityToastBridge } from '../oce/OceConnectivityToastBridge';
import { RadioPwaStandaloneVisualizerBootstrap } from '../radio-pwa/RadioPwaStandaloneVisualizerBootstrap';
import { ServiceWorkerRegistration } from '../service-worker/ServiceWorkerRegistration';
import { AmbientBackgroundWrapper } from '../ui/ClientWrappers';
import { VisualizerModeGate } from '../visualizer-mode/VisualizerModeGate';
import { IdlingLocaleProvider } from '../locale/IdlingLocaleProvider';
import { AmbientStarfieldProvider } from '../ambient-background';

export interface SiteChromeProvidersProps {
  children: ReactNode;
}

export function SiteChromeProviders({ children }: SiteChromeProvidersProps) {
  return (
    <AmbientStarfieldProvider>
      <AmbientBackgroundWrapper />
      <MicrosoftClarity />
      <SessionProvider>
        <ClarityUserIdentifier />
        <IdlingLocaleProvider>
        <UserPreferencesProvider>
          <OverlayProvider>
            <NavigationLoadingProvider>
              <GlobalLoadingProvider>
                <UserDataBatchProvider>
                  <RadioPlayerProvider>
                    <VisualizerModeProvider>
                      <RadioPwaStandaloneVisualizerBootstrap />
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
        </IdlingLocaleProvider>
      </SessionProvider>
      <div id="overlay-portal"></div>
      <ToastViewport />
      <OceConnectivityToastBridge />
    </AmbientStarfieldProvider>
  );
}