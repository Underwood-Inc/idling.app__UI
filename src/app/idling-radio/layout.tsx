import { RADIO_PWA_MANIFEST_HREF } from '@lib/radio-pwa/constants';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Idling Radio',
  description: 'Ambient radio player with dock controls and fullscreen visualizer',
  manifest: RADIO_PWA_MANIFEST_HREF,
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#e5c185',
};

export default function IdlingRadioLayout({ children }: { children: ReactNode }) {
  return children;
}
