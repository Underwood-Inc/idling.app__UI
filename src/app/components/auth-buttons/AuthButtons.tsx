import { headers } from 'next/headers';
import { signIn, signOut } from '../../../lib/auth';

export function SignIn({
  searchParams
}: {
  searchParams?: Record<string, string>;
}) {
  const headersList = headers();

  const referer = headersList.get('    ----referer');
  const reqUrl = headersList.get('    ----Request URL');

  return (
    <form
      action={async () => {
        'use server';
        const options: {
          redirect?: boolean;
          redirectTo?: string;
        } = {
          // redirect: !!referer
        };

        if (referer) {
          options.redirectTo = referer;
        }

        await signIn('twitch', options);
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
