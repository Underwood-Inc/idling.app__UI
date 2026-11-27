'use client';

import { OceProvider } from '@lib/oce/OceProvider';
import { GlobalLoadingProvider } from '@lib/context/GlobalLoadingContext';
import { NavigationLoadingProvider } from '@lib/context/NavigationLoadingContext';
import { OverlayProvider } from '@lib/context/OverlayContext';
import { RadioPlayerProvider } from '@lib/context/RadioPlayerContext';
import { UserDataBatchProvider } from '@lib/context/UserDataBatchContext';
import { UserPreferencesProvider } from '@lib/context/UserPreferencesContext';
import { VisualizerModeProvider } from '@lib/context/VisualizerModeContext';
import { ClarityUserIdentifier, MicrosoftClarity } from '@lib/observability';
import { SessionProvider } from 'next-auth/react';
import { ToastViewport } from '@molecules/toast/ToastViewport';
import type { ReactNode } from 'react';
import { AuthClientSessionGuard } from '../auth/AuthClientSessionGuard';
import { AmbientStarfieldProvider } from '../ambient-background';
import { IdlingLocaleProvider } from '../locale/IdlingLocaleProvider';
import { RadioPlayerMountWrapper } from '../radio-player/RadioPlayerMountWrapper';
import { RadioPwaStandaloneVisualizerBootstrap } from '../radio-pwa/RadioPwaStandaloneVisualizerBootstrap';
import { ServiceWorkerRegistration } from '../service-worker/ServiceWorkerRegistration';
import { AmbientBackgroundWrapper } from '../ui/ClientWrappers';
import { VisualizerModeGate } from '../visualizer-mode/VisualizerModeGate';

export interface SiteChromeProvidersProps {
  children: ReactNode;
}

export function SiteChromeProviders({ children }: SiteChromeProvidersProps) {
  return (
    <OceProvider>
    <AmbientStarfieldProvider>
      <AmbientBackgroundWrapper />
      <MicrosoftClarity />
      <SessionProvider>
        <AuthClientSessionGuard />
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
    </AmbientStarfieldProvider>
    </OceProvider>
  );
}