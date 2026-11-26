import { META_EN } from '$i18n-source/meta.en';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: META_EN.pages.subscriptionTitle,
  description: META_EN.pages.subscriptionDescription,
};

export default function SubscriptionLayout({ children }: { children: ReactNode }) {
  return children;
}