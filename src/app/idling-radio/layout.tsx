import { RADIO_PWA_MANIFEST_HREF, RADIO_PWA_THEME_COLOR } from '@lib/radio-pwa/constants';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    absolute: 'Idling Radio',
  },
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
  themeColor: RADIO_PWA_THEME_COLOR,
};

export default function IdlingRadioLayout({ children }: { children: ReactNode }) {
  return children;
}
