/**
 * Utility functions for User Management Panel
 *
 * This module contains helper functions for data manipulation,
 * formatting, and business logic used throughout the user
 * management system.
 */

import React from 'react';
import type { ManagementUser } from './types';

// ================================
// DATA FIELD UTILITIES
// ================================

/**
 * Get field value from user object for filtering and sorting
 * @param user - The user object
 * @param field - The field name to extract
 * @returns The field value as a string
 */
export const getFieldValue = (user: ManagementUser, field: string): string => {
  switch (field) {
    case 'name':
      return user.name || '';
    case 'email':
    case 'contact': // Support both 'email' and 'contact' field names
      return user.email || '';
    case 'provider_name':
      return user.provider_name || '';
    case 'role_names':
      return user.role_names || '';
    case 'is_timed_out':
      return user.is_timed_out ? 'true' : 'false'; // Return actual boolean string for filtering
    case 'subscriptions':
      if (user.subscriptions && user.subscriptions.length > 0) {
        return user.subscriptions.map((sub) => sub.plan_name).join(', ');
      }
      return 'Free';
    case 'active_timeout_reason':
      return user.active_timeout_reason || '';
    case 'created_at':
      return user.created_at;
    case 'timeout_expires': // Add support for timeout expiration sorting
      return user.timeout_expires || '';
    default:
      return '';
  }
};

/**
 * Get display value for UI presentation
 * @param user - The user object
 * @param field - The field name to format
 * @returns The formatted display value
 */
export const getDisplayValue = (
  user: ManagementUser,
  field: string
): string => {
  switch (field) {
    case 'is_timed_out':
      return user.is_timed_out ? 'Timed Out' : 'Active';
    default:
      return getFieldValue(user, field);
  }
};

// ================================
// DATE FORMATTING UTILITIES
// ================================

/**
 * Format date string for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ================================
// BADGE GENERATION UTILITIES
// ================================

/**
 * Generate status badge JSX for a user
 * @param user - The user object
 * @returns JSX element for status badge
 */
export const getStatusBadge = (user: ManagementUser): React.JSX.Element => {
  // Only handle timeout status - no subscription logic here
  if (user.is_timed_out && user.active_timeout_reason) {
    return (
      <span
        className="status-badge status-badge--timeout"
        title={user.active_timeout_reason}
      >
        Timed Out
      </span>
    );
  }

  return <span className="status-badge status-badge--active">Active</span>;
};

/**
 * Generate plans display JSX for a user
 * @param user - The user object
 * @returns JSX element for plans display
 */
export const getPlansDisplay = (user: ManagementUser): React.JSX.Element => {
  if (user.subscriptions && user.subscriptions.length > 0) {
    return (
      <div className="plans-info">
        {user.subscriptions.map((sub) => (
          <span
            key={sub.id}
            className={`plan-badge plan-badge--${sub.status}`}
            title={`${sub.plan_name} (${sub.status})`}
          >
            {sub.plan_name}
          </span>
        ))}
      </div>
    );
  }

  return <span className="plan-badge plan-badge--free">Free</span>;
};
