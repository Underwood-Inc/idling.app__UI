import { redirect } from 'next/navigation';
import { GameWrapper } from '../components/game/GameWrapper';
import styles from '../page.module.css';

export default function Game() {
  const isDisabled = true;

  if (isDisabled) {
    return redirect('/');
  }

  return (
    <article className={styles.main}>
      <GameWrapper />
    </article>
  );
}
