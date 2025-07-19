'use server';

import { revalidatePath } from 'next/cache';
import { signIn, signOut } from 'src/lib/auth';
import { NAV_PATHS } from 'src/lib/routes';
import { getSecureCacheBustingHeaders } from 'src/lib/security/secure-logout';
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

/**
 * SECURITY CRITICAL: Server-side secure logout action
 * This triggers server-side session invalidation and provides cache-busting headers
 * The client-side secure cache clearing should be handled by the calling component
 */
export async function signOutAction() {
  // Get cache busting headers for security
  const cacheBustingHeaders = getSecureCacheBustingHeaders();

  // Log security action for audit purposes
  // eslint-disable-next-line no-console -- Security audit logging
  console.log('🔒 SERVER SECURITY: Performing server-side secure logout...');

  try {
    await signOut({
      redirectTo: NAV_PATHS.ROOT
    });

    // Revalidate all paths to clear server-side auth-related caches
    revalidatePath('/', 'layout');

    // eslint-disable-next-line no-console -- Security audit logging
    console.log('✅ SERVER SECURITY: Server-side logout completed');
  } catch (error) {
    console.error('❌ SERVER SECURITY: Server-side logout failed:', error);
    throw error; // Re-throw to handle on client side
  }

  // Note: The cache-busting headers are available via getSecureCacheBustingHeaders()
  // but server actions cannot directly set response headers.
  // The client-side components should handle comprehensive cache clearing.

  // NextAuth will handle the redirect, so no need for explicit redirect()
  // The redirectTo parameter ensures proper redirection to the home page
}
