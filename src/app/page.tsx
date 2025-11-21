import { About } from './components/about/About';
import { Card } from './components/card/Card';
import { DiscordEmbed } from './components/discord-embed/DiscordEmbed';
import FadeIn from './components/fade-in/FadeIn';
import { LiveStreamEmbed } from './components/live-stream-embed/LiveStreamEmbed';
import { MinecraftProjects } from './components/minecraft-projects/MinecraftProjects';
import { PageAside } from './components/page-aside/PageAside';
import { PageContainer } from './components/page-container/PageContainer';
import PageContent from './components/page-content/PageContent';
import PageHeader from './components/page-header/PageHeader';
import { RecentActivityFeed } from './components/recent-activity-feed';
import './globals.css';
import styles from './page.module.css';

export default async function Home() {
  return (
    <>
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Welcome</h2>
          </FadeIn>
        </PageHeader>
        <div className={styles.home__layout}>
        <PageContent>
          <article className={styles.home__container}>
            <FadeIn className={styles.home__container_fade}>
                {/* About Section */}
                <Card width="full" className={styles.home__about}>
                <About />
              </Card>

                {/* Live Streams Section - Only render card if stream is live */}
                <LiveStreamEmbed />

                {/* Minecraft Projects Section */}
                <Card width="full" className={styles.home__projects}>
                  <MinecraftProjects />
                </Card>

                {/* Recent Activity Section */}
                <Card width="full" className={styles.home__activity}>
                <RecentActivityFeed />
              </Card>
            </FadeIn>
          </article>
        </PageContent>

      <PageAside className={styles.discord_aside} bottomMargin={0}>
        <FadeIn>
          <DiscordEmbed />
        </FadeIn>
      </PageAside>
    </div>
      </PageContainer>
    </>
  );
}
