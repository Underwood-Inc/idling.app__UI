import { headers } from 'next/headers';
import { signIn, signOut } from '../../../../auth';

export function SignIn() {
  const headersList = headers();
  const referer = headersList.get('referer');

  return (
    <form
      action={async () => {
        'use server';
        await signIn('twitch', { redirectTo: referer || '/' });
      }}
    >
      <button type="submit">Login with Twitch</button>
    </form>
  );
}

export function SignOut() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut();
      }}
    >
      <button type="submit">Sign Out</button>
    </form>
  );
}