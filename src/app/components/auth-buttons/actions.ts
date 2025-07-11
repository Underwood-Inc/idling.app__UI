'use server';

import { revalidatePath } from 'next/cache';
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
  await signOut({
    redirectTo: NAV_PATHS.ROOT
  });

  // Revalidate all paths to clear auth-related caches
  revalidatePath('/', 'layout');

  // NextAuth will handle the redirect, so no need for explicit redirect()
  // The redirectTo parameter ensures proper redirection to the home page
}
