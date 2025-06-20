import { signIn, signOut } from 'src/lib/auth';
import { NAV_PATHS } from 'src/lib/routes';
import { SignInProviders } from './AuthButtons';

export async function signInAction(
  provider: SignInProviders,
  redirectTo?: string
) {
  await signIn(provider, {
    redirectTo: redirectTo || NAV_PATHS.ROOT
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: NAV_PATHS.ROOT });
}
