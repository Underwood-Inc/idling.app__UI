'use client';

import { useRouter } from 'next/navigation';
import { UserProfileData } from '../../../lib/types/profile';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import { UserProfile } from './UserProfile';
import './UserProfileTooltip.css';

export interface UserProfileTooltipProps {
  user: UserProfileData;
  children: React.ReactNode;
  delay?: number;
  enableClick?: boolean;
  className?: string;
}

export function UserProfileTooltip({
  user,
  children,
  delay = 500,
  enableClick = true,
  className = ''
}: UserProfileTooltipProps) {
  const router = useRouter();

  const handleProfileClick = () => {
    if (enableClick) {
      // Use slug if available (new format), otherwise fall back to username (legacy)
      const profilePath = user.slug
        ? `/profile/${user.slug}`
        : `/profile/${encodeURIComponent(user.username || user.name || '')}`;

      router.push(profilePath);
    }
  };

  const tooltipContent = (
    <div className={`user-profile-tooltip ${className}`}>
      <UserProfile
        user={user}
        variant="tooltip"
        className="user-profile-tooltip__content"
      />
      {enableClick && (user.slug || user.username) && (
        <div className="user-profile-tooltip__actions">
          <button
            className="user-profile-tooltip__view-profile"
            onClick={handleProfileClick}
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  );

  return (
    <InteractiveTooltip content={tooltipContent} delay={delay}>
      <div className="user-profile-tooltip__trigger">{children}</div>
    </InteractiveTooltip>
  );
}
