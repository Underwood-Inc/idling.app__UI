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

// Private Profile Tooltip Component - matches regular tooltip styling
const UserProfileTooltipPrivate: React.FC<{
  authorName: string;
  onViewProfile: () => void;
}> = ({ authorName, onViewProfile }) => {
  return (
    <div className="author-tooltip">
      <div className="author-tooltip__content">
        <div className="author-tooltip__header">
          <div>
            <div className="author-tooltip__private-icon">🔒</div>
          </div>
          <div className="author-tooltip__header-info">
            <h4 className="author-tooltip__name">{authorName}</h4>
            <p className="author-tooltip__private-status">Private Profile</p>
          </div>
        </div>

        <div className="author-tooltip__private-message">
          <p>
            This user has set their profile to private. Only they can view their
            profile information.
          </p>
        </div>
      </div>

      {/* No actions section for private profiles - removed View Profile Page button */}
    </div>
  );
};

// Loading state component that matches the actual tooltip structure
const UserProfileTooltipLoading: React.FC = () => {
  return (
    <div className="author-tooltip">
      <div className="author-tooltip__content">
        <div className="author-tooltip__header">
          <div>
            {/* Avatar skeleton */}
            <div
              className="skeleton skeleton--avatar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
          </div>
          <div className="author-tooltip__header-info">
            {/* Name skeleton */}
            <div
              className="skeleton skeleton--text"
              style={{
                width: '120px',
                height: '18px',
                marginBottom: '4px',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
            {/* Location skeleton */}
            <div
              className="skeleton skeleton--text"
              style={{
                width: '80px',
                height: '14px',
                marginBottom: '4px',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
            <div className="author-tooltip__footer">
              {/* Join date skeleton */}
              <div
                className="skeleton skeleton--text"
                style={{
                  width: '100px',
                  height: '12px',
                  backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Compact bio skeleton - only 2 lines instead of full bio section */}
        <div
          className="skeleton skeleton--text"
          style={{
            width: '100%',
            height: '14px',
            marginBottom: '6px',
            marginTop: '8px',
            backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
          }}
        />
        <div
          className="skeleton skeleton--text"
          style={{
            width: '75%',
            height: '14px',
            backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
          }}
        />

        {/* Compact stats skeleton - smaller and more compact */}
        <div className="author-tooltip__stats">
          <div className="author-tooltip__stat">
            <div
              className="skeleton skeleton--text"
              style={{
                width: '20px',
                height: '16px',
                marginBottom: '2px',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
            <div
              className="skeleton skeleton--text"
              style={{
                width: '30px',
                height: '10px',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
          </div>
          <div className="author-tooltip__stat">
            <div
              className="skeleton skeleton--text"
              style={{
                width: '20px',
                height: '16px',
                marginBottom: '2px',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
            <div
              className="skeleton skeleton--text"
              style={{
                width: '35px',
                height: '10px',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
          </div>
          <div className="author-tooltip__stat">
            <div
              className="skeleton skeleton--text"
              style={{
                width: '20px',
                height: '16px',
                marginBottom: '2px',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
            <div
              className="skeleton skeleton--text"
              style={{
                width: '25px',
                height: '10px',
                backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Compact action buttons skeleton - smaller and better spaced */}
      <div className="author-tooltip__actions">
        <div
          className="skeleton skeleton--button"
          style={{
            width: '90px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
          }}
        />
        <div
          className="skeleton skeleton--button"
          style={{
            width: '110px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
          }}
        />
        <div className="author-tooltip__hint">
          <div
            className="skeleton skeleton--text"
            style={{
              width: '180px',
              height: '10px',
              backgroundColor: 'var(--light-background--secondary, #e0e0e0)'
            }}
          />
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
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { openOverlay, closeOverlay } = useOverlay();

  const displayName = showFullName ? authorName : `@${authorName}`;

  // ✅ CRITICAL: Always use database ID for profile URLs
  // This ensures profile URLs remain stable even when OAuth provider usernames change
  const profileUrl = `/profile/${authorId}`;

  // Fetch user profile for tooltip - only when tooltip is triggered
  const fetchUserProfile = async () => {
    if (hasAttemptedFetch || isLoading) return;

    setIsLoading(true);
    setHasAttemptedFetch(true);
    setFetchError(null);
    setIsPrivateProfile(false);

    try {
      // ✅ Only database ID lookup supported after migration 0010
      const fetchUrl = `/api/profile/id/${encodeURIComponent(authorId)}`;

      const response = await fetch(fetchUrl);
      if (response.ok) {
        const profile: UserProfileData = await response.json();
        setUserProfile(profile);
      } else if (response.status === 403) {
        // Profile is private
        const errorData = await response.json();
        if (errorData.error === 'This profile is private') {
          setIsPrivateProfile(true);
        } else {
          setFetchError(errorData.error || 'Access denied');
        }
      } else if (response.status === 404) {
        setFetchError('User not found');
      } else {
        setFetchError('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setFetchError('Unable to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Handle Ctrl+Click for modal
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      if (userProfile) {
        openModal();
      } else {
        // Fetch profile first, then open modal
        fetchUserProfile().then(() => {
          if (userProfile) {
            openModal();
          }
        });
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

  // Create tooltip content with profile preview and actions
  const tooltipContent = userProfile ? (
    <UserProfileTooltipContent
      user={userProfile}
      onViewProfile={handleViewProfile}
      onViewInModal={openModal}
    />
  ) : isLoading ? (
    <UserProfileTooltipLoading />
  ) : isPrivateProfile ? (
    <UserProfileTooltipPrivate
      authorName={authorName}
      onViewProfile={handleViewProfile}
    />
  ) : (
    <div className="author-tooltip__error">
      <p>{fetchError || 'Unable to load profile'}</p>
    </div>
  );

  // Return element wrapped in enhanced tooltip with lazy loading
  return (
    <InteractiveTooltip
      content={tooltipContent}
      delay={500}
      className="author-tooltip-wrapper"
      onShow={fetchUserProfile} // Trigger fetch when tooltip is about to show
    >
      {authorElement}
    </InteractiveTooltip>
  );
};
