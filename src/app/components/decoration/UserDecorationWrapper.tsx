'use client';

import { useFlairPreference } from '@lib/context/UserPreferencesContext';
import { useUserDecoration } from '@lib/hooks/useUserDecoration';
import React, { memo } from 'react';
import { DecorationRenderer } from './DecorationRenderer';

export interface UserDecorationWrapperProps {
  userId?: string;
  children: React.ReactNode;
  className?: string;
  forceDecoration?: string;
  enabled?: boolean;
  showError?: boolean;
  'data-testid'?: string;
}

/**
 * Modern, professional wrapper for user decorations
 *
 * Combines the useUserDecoration hook with DecorationRenderer
 * for a complete, reusable decoration solution.
 */
const UserDecorationWrapper = memo<UserDecorationWrapperProps>(
  ({
    userId,
    children,
    className = '',
    forceDecoration,
    enabled = true,
    showError = false,
    'data-testid': testId
  }) => {
    // Listen to flair preference changes for reactivity
    const { preference: flairPreference } = useFlairPreference();

    // Use the modern decoration hook
    const { decoration, isLoading, error } = useUserDecoration({
      userId,
      forceDecoration,
      refreshTrigger: flairPreference,
      enabled
    });

    return (
      <DecorationRenderer
        decoration={decoration}
        isLoading={isLoading}
        error={error}
        showError={showError}
        className={className}
        data-testid={testId}
      >
        {children}
      </DecorationRenderer>
    );
  }
);

UserDecorationWrapper.displayName = 'UserDecorationWrapper';

export { UserDecorationWrapper };
