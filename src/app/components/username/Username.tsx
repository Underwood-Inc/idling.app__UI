'use client';

import React from 'react';
import { UserDecorationWrapper } from '../decoration/UserDecorationWrapper';
import { InstantLink } from '../ui/InstantLink';
import './Username.css';

export interface UsernameProps {
  /** Database user ID for decoration lookup */
  userId?: string;
  /** Display name to show */
  displayName: string;
  /** Optional link to user profile */
  linkToProfile?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Font weight variant */
  weight?: 'normal' | 'medium' | 'bold';
  /** Whether to show decoration effects */
  showDecoration?: boolean;
  /** Force a specific decoration for testing */
  forceDecoration?: string;
  /** Click handler for custom behavior */
  onClick?: (userId?: string) => void;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Lightweight, reusable Username component
 *
 * Perfect for inline username displays throughout the app.
 * Automatically includes flair decorations when userId is provided.
 * Much lighter than Author component - no avatars, tooltips, or heavy logic.
 *
 * @example
 * // Simple inline username with flair
 * <Username userId="123" displayName="john_doe" />
 *
 * @example
 * // Username with profile link
 * <Username
 *   userId="123"
 *   displayName="jane_smith"
 *   linkToProfile={true}
 *   size="md"
 *   weight="bold"
 * />
 *
 * @example
 * // Custom click handler
 * <Username
 *   userId="123"
 *   displayName="admin_user"
 *   onClick={(userId) => handleUserClick(userId)}
 *   className="admin-username"
 * />
 */
export function Username({
  userId,
  displayName,
  linkToProfile = false,
  className = '',
  size = 'md',
  weight = 'normal',
  showDecoration = true,
  forceDecoration,
  onClick,
  'data-testid': testId
}: UsernameProps) {
  const componentClasses = [
    'username',
    `username--${size}`,
    `username--${weight}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(userId);
    }
  };

  // Build the username content with optional decoration
  const usernameContent =
    showDecoration && userId ? (
      <UserDecorationWrapper
        userId={userId}
        forceDecoration={forceDecoration}
        data-testid={testId ? `${testId}-decoration` : undefined}
      >
        <span className="username__text">{displayName}</span>
      </UserDecorationWrapper>
    ) : (
      <span className="username__text">{displayName}</span>
    );

  // Render with profile link if requested
  if (linkToProfile && userId) {
    return (
      <InstantLink
        href={`/profile/${userId}`}
        className={componentClasses}
        onClick={handleClick}
        data-testid={testId}
        title={`View ${displayName}'s profile`}
        aria-label={`View ${displayName}'s profile`}
      >
        {usernameContent}
      </InstantLink>
    );
  }

  // Render as button if click handler provided
  if (onClick) {
    return (
      <button
        className={`${componentClasses} username--clickable`}
        onClick={handleClick}
        data-testid={testId}
        type="button"
      >
        {usernameContent}
      </button>
    );
  }

  // Render as plain span
  return (
    <span className={componentClasses} data-testid={testId}>
      {usernameContent}
    </span>
  );
}
