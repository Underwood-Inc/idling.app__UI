'use client';

import { useAtom } from 'jotai';
import { useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { avatarCacheAtom } from '../../../lib/state/atoms';
import { Avatar, AvatarPropSizes } from '../avatar/Avatar';

interface AuthAvatarProps {
  size?: AvatarPropSizes;
  enableTooltip?: boolean;
  tooltipScale?: 2 | 3 | 4;
  className?: string;
}

/**
 * Avatar component specifically for the currently authenticated user.
 * Uses the user's ID as a consistent seed to ensure the avatar
 * appearance remains the same across all parts of the application.
 */
export function AuthAvatar({
  size = 'md',
  enableTooltip = false,
  tooltipScale = 2,
  className = ''
}: AuthAvatarProps) {
  const { data: session, status } = useSession();
  const [avatarCache, setAvatarCache] = useAtom(avatarCacheAtom);
  const previousUserIdRef = useRef<string | null>(null);

  // Clear avatar cache when user signs out
  useEffect(() => {
    const currentUserId = session?.user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // If we had a user before and now we don't (sign out), clear the cache
    if (previousUserId && !currentUserId) {
      // eslint-disable-next-line no-console
      console.log('🧹 Clearing avatar cache on sign out');
      setAvatarCache({});
    }

    // Update the ref for next comparison
    previousUserIdRef.current = currentUserId;
  }, [session?.user?.id, setAvatarCache]);

  // Additional effect to ensure cache is cleared when session becomes null
  useEffect(() => {
    if (!session) {
      // eslint-disable-next-line no-console
      console.log('🧹 Clearing avatar cache - no session detected');
      setAvatarCache({});
    }
  }, [session, setAvatarCache]);

  // Don't render until session status is determined to avoid hydration mismatch
  if (status === 'loading') {
    return (
      <div className={className} style={{ width: '2rem', height: '2rem' }} />
    );
  }

  // Use user ID as the primary seed for consistency
  // For unauthenticated users, use a static seed to avoid hydration issues
  const seed = session?.user?.id
    ? session.user.id ||
      session.user.name ||
      session.user.email ||
      'authenticated-fallback'
    : 'guest-user';

  return (
    <div className={className}>
      <Avatar
        key={session?.user?.id || 'guest'}
        seed={seed}
        size={size}
        enableTooltip={enableTooltip}
        tooltipScale={tooltipScale}
      />
    </div>
  );
}
