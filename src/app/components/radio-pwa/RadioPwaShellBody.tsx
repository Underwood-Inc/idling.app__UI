'use client';

import { RadioPlayerProvider } from '@lib/context/RadioPlayerContext';
import { VisualizerModeProvider } from '@lib/context/VisualizerModeContext';
import type { ReactNode } from 'react';
import { RadioPlayerMountWrapper } from '../radio-player/RadioPlayerMountWrapper';
import { ServiceWorkerRegistration } from '../service-worker/ServiceWorkerRegistration';
import { VisualizerModeGate } from '../visualizer-mode/VisualizerModeGate';
import { RadioPwaStandaloneRedirect } from './RadioPwaStandaloneRedirect';
import { RadioPwaStandaloneVisualizerBootstrap } from './RadioPwaStandaloneVisualizerBootstrap';
import '../../radio-pwa-globals.css';

/** Lean installed-PWA tree: radio player, visualizer, and required infra only. */
export function RadioPwaShellBody({ children }: { children: ReactNode }) {
  return (
    <>
      <RadioPwaStandaloneRedirect />
      <RadioPlayerProvider>
        <VisualizerModeProvider>
          <RadioPwaStandaloneVisualizerBootstrap />
          <main data-visualizer-layout>{children}</main>
          <ServiceWorkerRegistration />
          <RadioPlayerMountWrapper />
          <VisualizerModeGate />
        </VisualizerModeProvider>
      </RadioPlayerProvider>
    </>
  );
}
