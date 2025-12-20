import { About } from './components/about/About';
import { Card } from './components/card/Card';
import { DiscordEmbed } from './components/discord-embed/DiscordEmbed';
import { LiveStreamEmbed } from './components/live-stream-embed/LiveStreamEmbed';
import { PageAside } from './components/page-aside/PageAside';
import { PageContainer } from './components/page-container/PageContainer';
import PageContent from './components/page-content/PageContent';
import { ProjectShowcase } from './components/project-showcase/ProjectShowcase';
import { RecentActivityFeed } from './components/recent-activity-feed';
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

              {/* Live Streams Section - Only render card if stream is live */}
              <LiveStreamEmbed />

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

          <PageAside className={styles.discord_aside} bottomMargin={0}>
            <DiscordEmbed />
          </PageAside>
        </div>
      </PageContainer>
    </>
  );
}
