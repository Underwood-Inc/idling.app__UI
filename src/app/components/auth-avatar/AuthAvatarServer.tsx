import { auth } from '../../../lib/auth';
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

  // Use user ID as the primary seed for consistency
  // Fallback to name/email if ID is not available (shouldn't happen with proper auth)
  const seed =
    session?.user?.id ||
    session?.user?.name ||
    session?.user?.email ||
    'anonymous';

  // Debug logging to track avatar seed differences
  console.log('DEBUG: AuthAvatarServer seed:', {
    seed,
    sessionUserId: session?.user?.id,
    sessionUserName: session?.user?.name,
    sessionUserEmail: session?.user?.email,
    providerAccountId: session?.user?.providerAccountId
  });

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
