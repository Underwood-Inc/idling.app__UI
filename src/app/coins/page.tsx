import { redirect } from 'next/navigation';
import { auth } from '../../../auth';
import { Card } from '../components/card/Card';
import Coin from '../components/coin/Coin';

export default async function Coins() {
  const session = await auth();
  let seed = '';

  if (session) {
    const { user } = session;
    seed = user?.name || seed;
  } else {
    return redirect('/auth/signin');
  }

  return (
    <article>
      <Card width="full">
        <Coin seed={seed} />
      </Card>
    </article>
  );
}
