import { About } from './components/about/About';
import { Card } from './components/card/Card';
import { DiscordEmbed } from './components/discord-embed/DiscordEmbed';
import { DiscordLink } from './components/discord-link/DiscordLink';
import FadeIn from './components/fade-in/FadeIn';
import FancyBorder from './components/fancy-border/FancyBorder';
import { PageAside } from './components/page-aside/PageAside';
import { PageContainer } from './components/page-container/PageContainer';
import PageContent from './components/page-content/PageContent';
import PageHeader from './components/page-header/PageHeader';
import './globals.css';
import styles from './page.module.css';

export default async function Home() {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>About</h2>
          </FadeIn>
        </PageHeader>
        <PageContent>
          <article className={styles.home__container}>
            <FadeIn className={styles.home__container_fade}>
              <Card className={styles.home__container_item}>
                <About />
              </Card>

              <Card className={styles.home__container_item}>
                <p>
                  Join our <DiscordLink /> to get the latest news and
                  occasionally view development via screen share events.
                </p>
                <p>
                  See a bug? Report it in <DiscordLink /> and refer to the
                  current site version located in the bottom right of the
                  website footer.
                </p>
              </Card>
            </FadeIn>
          </article>
        </PageContent>
      </PageContainer>

      <PageAside className={styles.discord_aside} bottomMargin={10}>
        <FadeIn>
          <FancyBorder>
            <DiscordEmbed />
          </FancyBorder>
        </FadeIn>
      </PageAside>
    </div>
  );
}
