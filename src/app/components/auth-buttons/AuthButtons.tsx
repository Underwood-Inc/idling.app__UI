import { signIn, signOut } from '../../../lib/auth';

export function SignIn() {
  return (
    <form
      action={async () => {
        'use server';
        await signIn('twitch');
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
        await signOut({ redirectTo: '/' });
      }}
    >
      <button type="submit">Sign Out</button>
    </form>
  );
}
