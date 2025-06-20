'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useOverlay } from '../../../lib/context/OverlayContext';
import { ensureUserSlug } from '../../../lib/utils/user-slug';
import { Avatar, AvatarPropSizes } from '../avatar/Avatar';
import { InteractiveTooltip } from '../tooltip/InteractiveTooltip';
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
      const currentUserName = session.user.name;
      const currentUserEmail = session.user.email;

      const isOwner =
        currentUserId === user.id ||
        (currentUserName && currentUserName === user.username) ||
        (currentUserName && currentUserName === user.name) ||
        (currentUserEmail && currentUserEmail === user.email);

      setIsOwnProfile(Boolean(isOwner));
    } else {
      setIsOwnProfile(false);
    }
  }, [user, session]);

  const handleBioUpdate = async (newBio: string) => {
    try {
      // Get the session token for authorization
      const sessionToken = await fetch('/api/auth/session')
        .then((res) => res.json())
        .then((session) => session?.accessToken);

      const response = await fetch(
        `/api/profile/${encodeURIComponent(user.username || user.name || user.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            // Include authorization header if we have a token
            ...(sessionToken && { Authorization: `Bearer ${sessionToken}` })
          },
          body: JSON.stringify({ bio: newBio })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bio');
      }

      const result = await response.json();

      // Update the user object locally
      user.bio = newBio;

      // Success - bio updated
      return result;
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

  // Generate profile URL with guaranteed slug
  const profileUrl = userProfile
    ? `/profile/${ensureUserSlug(userProfile)}`
    : `/profile/${encodeURIComponent(authorName)}`;

  // Fetch user profile for tooltip via API route
  useEffect(() => {
    if (enableTooltip && authorName) {
      // If bio is provided, create a minimal profile object to avoid API call
      if (bio !== undefined) {
        setUserProfile({
          id: authorId,
          username: authorName,
          name: authorName,
          bio: bio || undefined,
          location: undefined,
          email: undefined,
          image: undefined,
          created_at: undefined,
          profile_public: true,
          total_submissions: 0,
          posts_count: 0,
          replies_count: 0,
          last_activity: null,
          slug: undefined
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      fetch(`/api/profile/${encodeURIComponent(authorName)}`)
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
  }, [authorName, enableTooltip, bio, authorId]);

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
    <Link
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
    </Link>
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
    <InteractiveTooltip content={tooltipContent} delay={500}>
      {authorElement}
    </InteractiveTooltip>
  );
};
