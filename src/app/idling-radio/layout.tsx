import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Idling Radio',
  description: 'Ambient radio player with dock controls and fullscreen visualizer',
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
  return children;
}
