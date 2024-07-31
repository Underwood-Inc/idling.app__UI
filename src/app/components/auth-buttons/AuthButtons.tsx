import { signIn, signOut } from '../../../lib/auth';
import { NAV_PATHS } from '../../../lib/routes';
import './AuthButtons.css';

export type SignInProviders = 'twitch' | 'google';
export function SignIn({ provider }: { provider: SignInProviders }) {
  return (
    <form
      action={async () => {
        'use server';
        await signIn(provider);
      }}
    >
      <button type="submit" className="auth-button">
        Login with <span className="capitalize">{provider}</span>
      </button>
    </form>
  );
}

export function SignOut() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: NAV_PATHS.ROOT });
      }}
    >
      <button type="submit">Sign Out</button>
    </form>
  );
}
