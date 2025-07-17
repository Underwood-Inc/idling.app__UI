import { auth } from '@lib/auth';
import { Avatar, AvatarPropSizes } from '../avatar/Avatar';

interface AuthAvatarServerProps {
  size?: AvatarPropSizes;
  enableTooltip?: boolean;
  tooltipScale?: 2 | 3 | 4;
  className?: string;
}

/**
 * Server-side Avatar component specifically for the currently authenticated user.
 * Uses the user's ID as a consistent seed to ensure the avatar
 * appearance remains the same across all parts of the application.
 */
export async function AuthAvatarServer({
  size = 'md',
  enableTooltip = false,
  tooltipScale = 2,
  className = ''
}: AuthAvatarServerProps) {
  const session = await auth();

  // Generate a random seed for unauthenticated users
  const randomSeed = `guest-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;

  // Use user ID as the primary seed for consistency
  // For unauthenticated users, use a random seed
  const seed = session?.user?.id
    ? session.user.id ||
      session.user.name ||
      session.user.email ||
      'authenticated-fallback'
    : randomSeed;

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
