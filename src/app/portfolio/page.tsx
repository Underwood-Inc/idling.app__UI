import type { Metadata } from 'next';
import { About } from '../components/about/About';
import { AdUnit } from '../components/ad-unit';
import { Card } from '../components/card/Card';
import { EcosystemDiagram } from '../components/ecosystem-diagram/EcosystemDiagram';
import { PageAside } from '../components/page-aside/PageAside';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import { ProjectShowcase } from '../components/project-showcase/ProjectShowcase';
import { StatsDashboard } from '../components/stats-dashboard/StatsDashboard';
import styles from '../page.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const { buildPortfolioPageMetadata } = await import('@molecules/i18n/idlingMeta');
  return buildPortfolioPageMetadata();
}

export default function PortfolioPage() {
  return (
    <PageContainer>
      <div className={styles.home__layout}>
        <PageContent>
          <article className={styles.home__container}>
            <div id="about" className={styles.home__anchor}>
              <Card width="full" className={styles.home__about}>
                <About />
              </Card>
            </div>

            <AdUnit className="ad-unit--between-sections" testId="home-ad-1" />

            <div id="ecosystem" className={styles.home__anchor}>
              <EcosystemDiagram />
            </div>

            <AdUnit className="ad-unit--between-sections" testId="home-ad-2" />

            <div id="projects" className={styles.home__anchor}>
              <Card width="full" className={styles.home__projects}>
                <ProjectShowcase />
              </Card>
            </div>

          </article>
        </PageContent>

        <PageAside className={styles.stats_aside} bottomMargin={0}>
          <div id="stats" className={styles.home__anchor}>
            <StatsDashboard />
          </div>
          <AdUnit className="ad-unit--sidebar" testId="home-sidebar-ad" />
        </PageAside>
      </div>
    </PageContainer>
  );
}
