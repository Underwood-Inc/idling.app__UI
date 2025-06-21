import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn, signOut } from 'src/lib/auth';
import { NAV_PATHS } from 'src/lib/routes';
import { SignInProviders } from './types';

export async function signInAction(
  provider: SignInProviders,
  redirectTo?: string
) {
  await signIn(provider, {
    redirectTo: redirectTo || NAV_PATHS.ROOT
  });

  // Revalidate all paths to clear auth-related caches
  revalidatePath('/', 'layout');
}

export async function signOutAction() {
  await signOut();

  // Revalidate all paths to clear auth-related caches
  revalidatePath('/', 'layout');

  // Redirect to home page
  redirect(NAV_PATHS.ROOT);
}
