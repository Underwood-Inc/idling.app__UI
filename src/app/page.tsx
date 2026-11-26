import { buildHomePageMetadata } from '@molecules/i18n/idlingMeta';
import type { Metadata } from 'next';
import { HomeLanding } from './components/home-landing/HomeLanding';
import { PageContainer } from './components/page-container/PageContainer';

export const metadata: Metadata = buildHomePageMetadata();

export default function Home() {
  return (
    <PageContainer>
      <HomeLanding />
    </PageContainer>
  );
}