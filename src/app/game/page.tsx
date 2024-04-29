import { GameWrapper } from "../components/game/GameWrapper";
import styles from "../page.module.css";

export default function Game() {
  return (
    <main className={styles.main}>
      <GameWrapper />
    </main>
  );
}
