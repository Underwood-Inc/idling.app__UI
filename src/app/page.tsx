import { About } from './components/about/About';
import { Card } from './components/card/Card';
import { DiscordEmbed } from './components/discord-embed/DiscordEmbed';
import FadeIn from './components/fade-in/FadeIn';
import { PageAside } from './components/page-aside/PageAside';
import { PageContainer } from './components/page-container/PageContainer';
import PageContent from './components/page-content/PageContent';
import PageHeader from './components/page-header/PageHeader';
import { TwitchChat } from './components/twitch-chat';
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
              <Card className={styles.home__container_item_full}>
                <About />
              </Card>

              <Card className={styles.home__container_item_full}>
                <TwitchChat
                  username="strixun"
                  height="500px"
                  className={styles.home__twitch_chat}
                  minimal
                  hideHeader
                />
              </Card>
            </FadeIn>
          </article>
        </PageContent>
      </PageContainer>

      <PageAside className={styles.discord_aside} bottomMargin={0}>
        <FadeIn>
          <DiscordEmbed />
        </FadeIn>
      </PageAside>
    </div>
  );
}
