import { getServerSession } from "next-auth";
import Link from "next/link";
import { About } from "./components/about/About";
import { SignOut } from "./components/auth-buttons/AuthButtons";
import { Card } from "./components/card/Card";
import styles from "./page.module.css";

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    return <Link href="/auth/signin">Sign In</Link>;
  }

  return (
    <main className={styles.main}>
      <SignOut />
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
