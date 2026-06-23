import { RADIO_PWA_MANIFEST_HREF } from '@lib/radio-pwa/constants';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { RadioPwaLaunchGuard } from '../components/radio-pwa/RadioPwaLaunchGuard';

export const metadata: Metadata = {
  title: 'Idling Radio',
  description: 'Ambient radio player with dock controls and fullscreen visualizer',
  manifest: RADIO_PWA_MANIFEST_HREF,
  themeColor: '#e5c185',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function IdlingRadioLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <RadioPwaLaunchGuard />
      {children}
    </>
  );
}
