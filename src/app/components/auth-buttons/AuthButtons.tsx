import { AUTH_BUTTON_SELECTORS } from 'src/lib/test-selectors/components/auth-buttons.selectors';
import { signInAction, signOutAction } from './actions';
import './AuthButtons.css';

export type SignInProviders = 'twitch' | 'google';
export function SignIn({
  provider,
  redirectTo
}: Readonly<{
  provider: SignInProviders;
  redirectTo?: string;
}>) {
  return (
    <form
      action={async () => {
        'use server';
        await signInAction(provider, redirectTo);
      }}
    >
      <button
        type="submit"
        className="auth-button"
        data-testid={AUTH_BUTTON_SELECTORS.SIGN_IN}
      >
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
        await signOutAction();
      }}
    >
      <button type="submit" data-testid={AUTH_BUTTON_SELECTORS.SIGN_OUT}>
        Sign Out
      </button>
    </form>
  );
}
