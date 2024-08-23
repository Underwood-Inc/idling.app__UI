import { Suspense } from 'react';
import { MessageTicker } from './MessageTicker';
import { fetchBuddha } from './actions';

export async function MessageTickerWithSuspense() {
  const message = await fetchBuddha();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {message ? <MessageTicker messages={[message?.text]} /> : null}
    </Suspense>
  );
}
