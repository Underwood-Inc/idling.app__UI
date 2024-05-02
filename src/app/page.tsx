import { About } from "./components/about/About";
import { Card } from "./components/card/Card";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h3>About</h3>

      <Card>
        <About />
      </Card>
    </main>
  );
}
