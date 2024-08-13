import { About } from './components/about/About';
import { Card } from './components/card/Card';
import './globals.css';
import styles from './page.module.css';

export default async function Home() {
  return (
    <>
      <article className={styles.home__container}>
        <Card width="min">
          <h3>About</h3>
          <About />
        </Card>
      </article>
    </>
  );
}
