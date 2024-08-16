import { About } from './components/about/About';
import { Card } from './components/card/Card';
import { PageContainer } from './components/page-container/PageContainer';
import './globals.css';
import styles from './page.module.css';

export default async function Home() {
  return (
    <PageContainer>
      <article className={styles.home__container}>
        <Card width="min">
          <h2>About</h2>
          <About />
        </Card>
      </article>
    </PageContainer>
  );
}
