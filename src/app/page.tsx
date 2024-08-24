import { About } from './components/about/About';
import { Card } from './components/card/Card';
import { DiscordEmbed } from './components/discord-embed/DiscordEmbed';
import FadeIn from './components/fade-in/FadeIn';
import FancyBorder from './components/fancy-border/FancyBorder';
import { PageAside } from './components/page-aside/PageAside';
import { PageContainer } from './components/page-container/PageContainer';
import PageContent from './components/page-content/PageContent';
import './globals.css';
import styles from './page.module.css';

export default async function Home() {
  return (
    <>
      <PageContainer>
        <PageContent>
          <article className={styles.home__container}>
            <FadeIn>
              <Card width="min">
                <h2>About</h2>

                <About />
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
    </>
  );
}
