import type { Metadata } from 'next';
import { HomeLanding } from './components/home-landing/HomeLanding';
import { DASHBOARD_COPY } from './components/marketing-dashboard/productMarketing';
import { PageContainer } from './components/page-container/PageContainer';

export const metadata: Metadata = {
  description: DASHBOARD_COPY.line,
};

export default function Home() {
  return (
    <PageContainer>
      <HomeLanding />
    </PageContainer>
  );
}