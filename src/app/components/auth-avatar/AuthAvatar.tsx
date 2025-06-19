'use client';

import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();

  // Use user ID as the primary seed for consistency
  // Fallback to name/email if ID is not available (shouldn't happen with proper auth)
  const seed =
    session?.user?.id ||
    session?.user?.name ||
    session?.user?.email ||
    'anonymous';

  return (
    <div className={className}>
      <Avatar
        seed={seed}
        size={size}
        enableTooltip={enableTooltip}
        tooltipScale={tooltipScale}
      />
    </div>
  );
}
