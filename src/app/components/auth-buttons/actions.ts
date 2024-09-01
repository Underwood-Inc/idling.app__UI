import { signIn, signOut } from 'src/lib/auth';
import { NAV_PATHS } from 'src/lib/routes';
import { SignInProviders } from './AuthButtons';

export async function signInAction(provider: SignInProviders) {
  await signIn(provider);
}

export async function signOutAction() {
  await signOut({ redirectTo: NAV_PATHS.ROOT });
}
