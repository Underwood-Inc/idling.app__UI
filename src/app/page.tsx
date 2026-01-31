import { About } from './components/about/About';
import { AdUnit } from './components/ad-unit';
import { Card } from './components/card/Card';
import { EcosystemDiagram } from './components/ecosystem-diagram/EcosystemDiagram';
import { PageAside } from './components/page-aside/PageAside';
import { PageContainer } from './components/page-container/PageContainer';
import PageContent from './components/page-content/PageContent';
import { ProjectShowcase } from './components/project-showcase/ProjectShowcase';
import { RecentActivityFeed } from './components/recent-activity-feed';
import { StatsDashboard } from './components/stats-dashboard/StatsDashboard';
import './globals.css';
import styles from './page.module.css';

export default async function Home() {
  return (
    <>
      <PageContainer>
        <div className={styles.home__layout}>
          <PageContent>
            <article className={styles.home__container}>
              {/* About Section */}
              <Card width="full" className={styles.home__about}>
                <About />
              </Card>

              {/* Ecosystem Architecture Diagram */}
              <EcosystemDiagram />

              {/* Featured Projects Showcase */}
              <Card width="full" className={styles.home__projects}>
                <ProjectShowcase />
              </Card>

              {/* Recent Activity Section */}
              <Card width="full" className={styles.home__activity}>
                <RecentActivityFeed />
              </Card>
            </article>
          </PageContent>

          <PageAside className={styles.stats_aside} bottomMargin={0}>
            <StatsDashboard />

            {/* Sidebar Advertisement */}
            <AdUnit className="ad-unit--sidebar" testId="home-sidebar-ad" />
          </PageAside>
        </div>
      </PageContainer>
    </>
  );
}
