import { AUTH_BUTTON_SELECTORS } from 'src/lib/test-selectors/components/auth-buttons.selectors';
import { signInAction, signOutAction } from './actions';
import './AuthButtons.css';
import { SignInProviders } from './types';

export function SignIn({
  provider,
  redirectTo
}: Readonly<{
  provider: SignInProviders;
  redirectTo?: string;
}>) {
  return (
    <form action={signInAction.bind(null, provider, redirectTo)}>
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
    <form action={signOutAction}>
      <button type="submit" data-testid={AUTH_BUTTON_SELECTORS.SIGN_OUT}>
        Sign Out
      </button>
    </form>
  );
}
