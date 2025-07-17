import { auth } from '@lib/auth';
import { Card } from '../components/card/Card';
import Coin from '../components/coin/Coin';

export default async function Coins() {
  const session = await auth();

  return (
    <article>
      <Card width="min">
        <Coin seed={session?.user?.name || ''} />
      </Card>
    </article>
  );
}
