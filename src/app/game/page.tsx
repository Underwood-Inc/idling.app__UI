import { GameWrapper } from '../components/game/GameWrapper';
import styles from '../page.module.css';

export default function Game() {
  return (
    <article className={styles.main}>
      <GameWrapper />
    </article>
  );
}
