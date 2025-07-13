'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { UserProfileData } from '../../../lib/types/profile';
import { getEffectiveCharacterCount } from '../../../lib/utils/string';
import { Avatar } from '../avatar/Avatar';
import { ContentWithPills } from '../ui/ContentWithPills';
import { InstantLink } from '../ui/InstantLink';
import { SmartInput } from '../ui/SmartInput';

import './UserProfile.css';

// Re-export for backward compatibility
export type { UserProfileData };

interface UserProfileProps {
  user: UserProfileData;
  variant?: 'full' | 'compact' | 'tooltip';
  className?: string;
  showStats?: boolean;
  isOwnProfile?: boolean;
  onBioUpdate?: (newBio: string) => Promise<void>;
  isPending?: boolean;
}

export function UserProfile({
  user,
  variant = 'full',
  className = '',
  showStats = false,
  isOwnProfile = false,
  onBioUpdate,
  isPending = false
}: UserProfileProps) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const { data: session } = useSession();

  // Sync bioText when user profile changes
  useEffect(() => {
    setBioText(user.bio || '');
  }, [user.bio]);

  // Check admin access for current user
  useEffect(() => {
    async function checkAdminAccess() {
      if (!session?.user?.id) {
        setHasAdminAccess(false);
        return;
      }

      try {
        const response = await fetch('/api/test/admin-check');
        if (response.ok) {
          const data = await response.json();
          setHasAdminAccess(data.hasAdminAccess);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setHasAdminAccess(false);
      }
    }

    checkAdminAccess();
  }, [session]);

  const displayName = user.username || user.name || 'Anonymous';
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    : null;

  const handleBioSave = async () => {
    if (!onBioUpdate) return;

    setIsSaving(true);
    try {
      await onBioUpdate(bioText);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to update bio:', error);
      // Reset to original bio on error
      setBioText(user.bio || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBioCancel = () => {
    setBioText(user.bio || '');
    setIsEditingBio(false);
  };

  const isDisabled = isSaving || isPending;

  if (variant === 'tooltip') {
    return (
      <div className={`user-profile user-profile--tooltip ${className}`}>
        <div className="user-profile__header">
          <div>
            <Avatar seed={user.id} size="md" />
          </div>
          <div className="user-profile__header-info">
            <div className="user-profile__header-top">
              <h4 className="user-profile__name">{displayName}</h4>
              {isOwnProfile && !isEditingBio && (
                <button
                  className="user-profile__edit-bio-btn user-profile__edit-bio-btn--header"
                  onClick={() => setIsEditingBio(true)}
                  title="Edit bio"
                >
                  Edit Bio
                </button>
              )}
            </div>
            {joinDate && (
              <span className="user-profile__join-date">Joined {joinDate}</span>
            )}
            {user.location && (
              <p className="user-profile__location">📍 {user.location}</p>
            )}
          </div>
        </div>

        <div className="user-profile__bio">
          {isEditingBio ? (
            <div className="user-profile__bio-editor">
              <SmartInput
                value={bioText}
                onChange={setBioText}
                placeholder="Tell us about yourself... Use #hashtags, @mentions, and paste URLs!"
                className="user-profile__bio-smart-input"
                as="textarea"
                rows={3}
                disabled={isDisabled}
                enableHashtags
                enableUserMentions
              />
              <div className="user-profile__bio-actions">
                <button
                  className="user-profile__bio-save"
                  onClick={handleBioSave}
                  disabled={isDisabled}
                >
                  {isDisabled ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="user-profile__bio-cancel"
                  onClick={handleBioCancel}
                  disabled={isDisabled}
                >
                  Cancel
                </button>
              </div>
              <div className="user-profile__bio-counter">
                {getEffectiveCharacterCount(bioText)}/500 characters
              </div>
            </div>
          ) : (
            <div className="user-profile__bio-content">
              {user.bio ? (
                <ContentWithPills
                  content={user.bio}
                  contextId={`user-profile-bio-${user.id}`}
                  className="user-profile__bio-pills"
                />
              ) : isOwnProfile ? (
                <p className="user-profile__bio-placeholder">
                  Click &quot;Edit Bio&quot; to add your bio and tell others
                  about yourself.
                </p>
              ) : (
                <p className="user-profile__bio-placeholder">
                  {displayName} hasn&apos;t added a bio yet.
                </p>
              )}
            </div>
          )}
        </div>

        {showStats && (
          <div className="user-profile__stats">
            <div className="user-profile__stat">
              <span className="user-profile__stat-number">
                {user.posts_count || 0}
              </span>
              <span className="user-profile__stat-label">Posts</span>
            </div>
            <div className="user-profile__stat">
              <span className="user-profile__stat-number">
                {user.replies_count || 0}
              </span>
              <span className="user-profile__stat-label">Replies</span>
            </div>
            <div className="user-profile__stat">
              <span className="user-profile__stat-number">
                {user.total_submissions || 0}
              </span>
              <span className="user-profile__stat-label">Total</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`user-profile user-profile--compact ${className}`}>
        <Avatar seed={user.id} size="sm" />
        <div className="user-profile__info">
          <span className="user-profile__name">{displayName}</span>
          {user.location && (
            <span className="user-profile__location">{user.location}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`user-profile user-profile--full ${className}`}>
      <div className="user-profile__header">
        <div className="user-profile__avatar-container">
          <Avatar seed={user.id} size="lg" />
          <div className="user-profile__avatar-badge">
            {user.profile_public !== false ? '🌟' : '🔒'}
          </div>
        </div>
        <div className="user-profile__header-info">
          <h2 className="user-profile__name">{displayName}</h2>
          <div className="user-profile__meta-row">
            {user.location && (
              <p className="user-profile__location">📍 {user.location}</p>
            )}
            {joinDate && (
              <p className="user-profile__join-date">
                👤 Member since {joinDate}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="user-profile__bio">
        <div className="user-profile__bio-header">
          <h3>About</h3>
          <div className="user-profile__bio-actions">
            {isOwnProfile && !isEditingBio && (
              <button
                className="user-profile__edit-bio-btn"
                onClick={() => setIsEditingBio(true)}
                title="Edit bio"
              >
                ✏️ Edit
              </button>
            )}
            {isOwnProfile && (
              <InstantLink
                href="/settings"
                className="user-profile__settings-link"
                title="User settings"
              >
                ⚙️ Settings
              </InstantLink>
            )}
            {hasAdminAccess && isOwnProfile && (
              <InstantLink
                href="/admin"
                className="user-profile__admin-link"
                title="Admin Dashboard"
              >
                🛡️ Admin
              </InstantLink>
            )}
          </div>
        </div>

        {isEditingBio ? (
          <div className="user-profile__bio-editor">
            <SmartInput
              value={bioText}
              onChange={setBioText}
              placeholder="Tell us about yourself... Use #hashtags, @mentions, and paste URLs!"
              className="user-profile__bio-smart-input"
              as="textarea"
              rows={4}
              disabled={isDisabled}
              enableHashtags={true}
              enableUserMentions={true}
            />
            <div className="user-profile__bio-actions">
              <button
                className="user-profile__bio-save"
                onClick={handleBioSave}
                disabled={isDisabled}
              >
                {isDisabled ? 'Saving...' : 'Save'}
              </button>
              <button
                className="user-profile__bio-cancel"
                onClick={handleBioCancel}
                disabled={isDisabled}
              >
                Cancel
              </button>
            </div>
            <div className="user-profile__bio-counter">
              {getEffectiveCharacterCount(bioText)}/500 characters
            </div>
          </div>
        ) : (
          <div className="user-profile__bio-content">
            {user.bio ? (
              <ContentWithPills
                content={user.bio}
                contextId={`user-profile-bio-${user.id}`}
                className="user-profile__bio-pills"
              />
            ) : isOwnProfile ? (
              <p className="user-profile__bio-placeholder">
                Click &quot;Edit&quot; to add your bio and tell others about
                yourself.
              </p>
            ) : (
              <p className="user-profile__bio-placeholder">
                {displayName} hasn&apos;t added a bio yet.
              </p>
            )}
          </div>
        )}
      </div>

      {showStats && (
        <div className="user-profile__stats">
          <div className="user-profile__stat">
            <span className="user-profile__stat-number">
              {user.total_submissions || 0}
            </span>
            <span className="user-profile__stat-label">
              Total Contributions
            </span>
          </div>
          <div className="user-profile__stat">
            <span className="user-profile__stat-number">
              {user.posts_count || 0}
            </span>
            <span className="user-profile__stat-label">Posts</span>
          </div>
          <div className="user-profile__stat">
            <span className="user-profile__stat-number">
              {user.replies_count || 0}
            </span>
            <span className="user-profile__stat-label">Replies</span>
          </div>
        </div>
      )}
    </div>
  );
}
