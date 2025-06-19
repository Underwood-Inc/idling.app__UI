'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import { UserProfile, UserProfileData } from './UserProfile';
import './UserProfileTooltip.css';

interface UserProfileTooltipProps {
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
    if (enableClick && user.username) {
      router.push(`/profile/${user.username}`);
    }
  };

  const tooltipContent = (
    <div className={`user-profile-tooltip ${className}`}>
      <UserProfile
        user={user}
        variant="tooltip"
        className="user-profile-tooltip__content"
      />
      {enableClick && user.username && (
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
