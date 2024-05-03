import { About } from "./components/about/About";
import { Card } from "./components/card/Card";
import { DiscordEmbed } from "./components/discord-embed/DiscordEmbed";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <Card>
          <h3>About</h3>
          <About />
        </Card>

        <DiscordEmbed />
      </div>
    </main>
  );
}
