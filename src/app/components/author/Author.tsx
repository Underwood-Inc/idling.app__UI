'use client';

import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import { useOverlay } from '../../../lib/context/OverlayContext';
import { Avatar, AvatarPropSizes } from '../avatar/Avatar';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
import { InstantLink } from '../ui/InstantLink';
import { UserProfile, UserProfileData } from '../user-profile/UserProfile';
import './Author.css';

export interface AuthorProps {
  authorId: string;
  authorName: string;
  size?: AvatarPropSizes;
  showFullName?: boolean;
  onClick?: (authorId: string) => void;
  className?: string;
  enableTooltip?: boolean;
  bio?: string | null; // Optional bio data to avoid API call
}

// Enhanced User Profile Modal Component
const UserProfileModal: React.FC<{
  user: UserProfileData;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const { data: session } = useSession();
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    // Check if this matches the current user
    if (session?.user) {
      const currentUserId = session.user.id;

      // Convert both IDs to strings for proper comparison
      const isOwner = currentUserId?.toString() === user.id?.toString();

      setIsOwnProfile(Boolean(isOwner));
    } else {
      setIsOwnProfile(false);
    }
  }, [user, session]);

  const handleBioUpdate = async (newBio: string): Promise<void> => {
    try {
      // Use the same server action as the profile page for consistency
      const { updateBioAction } = await import(
        '../../../lib/actions/profile.actions'
      );

      // ✅ CRITICAL: Use database ID only for bio updates (after migration 0011)
      // This ensures bio updates work reliably regardless of username changes
      const identifier = user.id;

      const result = await updateBioAction(newBio, identifier);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update bio');
      }

      // Update the user object locally for immediate UI feedback
      user.bio = newBio;

      // Success - bio updated (no return value needed)
      // Note: Profile page cache is invalidated by the server action
    } catch (error) {
      console.error('Error updating bio:', error);
      throw error;
    }
  };

  return (
    <div className="user-profile-modal">
      <div className="user-profile-modal__header">
        <h2 className="user-profile-modal__title">
          {user.username || user.name || 'User Profile'}
        </h2>
        <button
          className="user-profile-modal__close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
      <div className="user-profile-modal__content">
        <UserProfile
          user={user}
          variant="tooltip"
          showStats={true}
          isOwnProfile={isOwnProfile}
          onBioUpdate={isOwnProfile ? handleBioUpdate : undefined}
          className="user-profile-modal__profile"
        />
      </div>
    </div>
  );
};

// Enhanced User Profile Tooltip Component
const UserProfileTooltipContent: React.FC<{
  user: UserProfileData;
  onViewProfile: () => void;
  onViewInModal: () => void;
}> = ({ user, onViewProfile, onViewInModal }) => {
  const displayName = user.username || user.name || 'Anonymous';
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    : null;

  return (
    <div className="author-tooltip">
      <div className="author-tooltip__content">
        <div className="author-tooltip__header">
          <div>
            <Avatar seed={user.id} size="sm" />
          </div>
          <div className="author-tooltip__header-info">
            <h4 className="author-tooltip__name">{displayName}</h4>
            {user.location && (
              <p className="author-tooltip__location">📍 {user.location}</p>
            )}
            {joinDate && (
              <div className="author-tooltip__footer">
                <span className="author-tooltip__join-date">
                  Joined {joinDate}
                </span>
              </div>
            )}
          </div>
        </div>
        {user.bio && (
          <div className="author-tooltip__bio">
            <p>{user.bio}</p>
          </div>
        )}

        {(user.total_submissions !== undefined ||
          user.posts_count !== undefined ||
          user.replies_count !== undefined) && (
          <div className="author-tooltip__stats">
            <div className="author-tooltip__stat">
              <span className="author-tooltip__stat-number">
                {user.posts_count || 0}
              </span>
              <span className="author-tooltip__stat-label">Posts</span>
            </div>
            <div className="author-tooltip__stat">
              <span className="author-tooltip__stat-number">
                {user.replies_count || 0}
              </span>
              <span className="author-tooltip__stat-label">Replies</span>
            </div>
            <div className="author-tooltip__stat">
              <span className="author-tooltip__stat-number">
                {user.total_submissions || 0}
              </span>
              <span className="author-tooltip__stat-label">Total</span>
            </div>
          </div>
        )}
      </div>

      <div className="author-tooltip__actions">
        <button
          className="author-tooltip__action-button primary"
          onClick={onViewProfile}
        >
          View Profile
        </button>
        <button
          className="author-tooltip__action-button secondary"
          onClick={onViewInModal}
        >
          Open in Modal
        </button>
        <div className="author-tooltip__hint">
          Hold Ctrl and click author to open modal directly
        </div>
      </div>
    </div>
  );
};

export const Author: React.FC<AuthorProps> = ({
  authorId,
  authorName,
  size = 'xs',
  showFullName = true,
  onClick,
  className = '',
  enableTooltip = true,
  bio
}) => {
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { openOverlay, closeOverlay } = useOverlay();

  const displayName = showFullName ? authorName : `@${authorName}`;

  // ✅ CRITICAL: Always use database ID for profile URLs
  // This ensures profile URLs remain stable even when OAuth provider usernames change
  const profileUrl = `/profile/${authorId}`;

  // Fetch user profile for tooltip via API route using database ID for more reliable lookup
  useEffect(() => {
    if (enableTooltip && authorId && authorName) {
      setIsLoading(true);

      // ✅ Only database ID lookup supported after migration 0010
      const fetchUrl = `/api/profile/id/${encodeURIComponent(authorId)}`;

      fetch(fetchUrl)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('Failed to fetch profile');
        })
        .then((profile: UserProfileData) => {
          setUserProfile(profile);
        })
        .catch((error) => {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [authorId, authorName, enableTooltip]);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Handle Ctrl+Click for modal
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      if (userProfile) {
        openModal();
      }
      return;
    }

    // Handle custom onClick if provided
    if (onClick) {
      event.preventDefault();
      onClick(authorId);
    }

    // Otherwise, let Link handle normal navigation
  };

  const openModal = () => {
    if (!userProfile) return;

    const modalId = `user-profile-modal-${authorId}`;
    openOverlay({
      id: modalId,
      type: 'modal',
      component: UserProfileModal,
      props: {
        user: userProfile,
        onClose: () => closeOverlay(modalId)
      }
    });
  };

  const handleViewProfile = () => {
    // Let the link handle navigation naturally
    window.location.href = profileUrl;
  };

  const containerClass = `author ${size} clickable ${className}`;

  const authorElement = (
    <InstantLink
      href={profileUrl}
      className={containerClass}
      onClick={handleClick}
      title={`View ${authorName}'s profile`}
      aria-label={`View ${authorName}'s profile`}
    >
      <div className="author__name">
        <Avatar
          seed={userProfile?.id || authorId}
          size={size}
          enableTooltip={false} // Disable avatar tooltip since we have user profile tooltip
        />
        <span>{displayName}</span>
      </div>
    </InstantLink>
  );

  // If tooltip is disabled, return plain element
  if (!enableTooltip) {
    return authorElement;
  }

  // If loading or no profile found, return plain element without tooltip
  if (isLoading || !userProfile) {
    return authorElement;
  }

  // Create tooltip content with profile preview and actions
  const tooltipContent = (
    <UserProfileTooltipContent
      user={userProfile}
      onViewProfile={handleViewProfile}
      onViewInModal={openModal}
    />
  );

  // Return element wrapped in enhanced tooltip
  return (
    <InteractiveTooltip
      content={tooltipContent}
      delay={500}
      className="author-tooltip-wrapper"
    >
      {authorElement}
    </InteractiveTooltip>
  );
};
