'use client';

import { Avatar } from '../avatar/Avatar';
import './UserProfile.css';

export interface UserProfileData {
  id: string;
  username?: string;
  name?: string;
  bio?: string;
  location?: string;
  email?: string;
  image?: string;
  avatar_seed?: string;
  created_at?: string;
  profile_public?: boolean;
}

interface UserProfileProps {
  user: UserProfileData;
  variant?: 'full' | 'compact' | 'tooltip';
  className?: string;
}

export function UserProfile({
  user,
  variant = 'full',
  className = ''
}: UserProfileProps) {
  const displayName = user.username || user.name || 'Anonymous';
  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    : null;

  if (variant === 'tooltip') {
    return (
      <div className={`user-profile user-profile--tooltip ${className}`}>
        <div className="user-profile__header">
          <Avatar seed={user.avatar_seed || user.email || user.id} size="md" />
          <div className="user-profile__header-info">
            <h4 className="user-profile__name">{displayName}</h4>
            {user.location && (
              <p className="user-profile__location">📍 {user.location}</p>
            )}
          </div>
        </div>

        {user.bio && (
          <div className="user-profile__bio">
            <p>{user.bio}</p>
          </div>
        )}

        <div className="user-profile__footer">
          {joinDate && (
            <span className="user-profile__join-date">Joined {joinDate}</span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`user-profile user-profile--compact ${className}`}>
        <Avatar seed={user.avatar_seed || user.email || user.id} size="sm" />
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
        <Avatar seed={user.avatar_seed || user.email || user.id} size="lg" />
        <div className="user-profile__header-info">
          <h2 className="user-profile__name">{displayName}</h2>
          {user.location && (
            <p className="user-profile__location">📍 {user.location}</p>
          )}
          {joinDate && (
            <p className="user-profile__join-date">Member since {joinDate}</p>
          )}
        </div>
      </div>

      {user.bio && (
        <div className="user-profile__bio">
          <h3>About</h3>
          <p>{user.bio}</p>
        </div>
      )}
    </div>
  );
}
