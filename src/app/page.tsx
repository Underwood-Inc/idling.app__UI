import { About } from "./components/about/About";
import { Card } from "./components/card/Card";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <Card>
          <h3>About</h3>
          <About />
        </Card>
      </div>

      <Card>
        <h2>Random Card Name</h2>
      </Card>
    </main>
  );
}