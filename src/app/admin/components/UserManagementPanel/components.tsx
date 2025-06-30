/**
 * UI Components for User Management Panel
 *
 * This module contains smaller, reusable UI components used
 * throughout the user management system, promoting component
 * composition and reusability.
 */

import React from 'react';
import { Avatar } from '../../../components/avatar/Avatar';
import { LoadingButton } from '../../../components/ui/LoadingButton';
import type {
  ManagementUser,
  SearchResult,
  UserActionsMenuProps
} from './types';

// ================================
// USER ACTIONS MENU COMPONENT
// ================================

/**
 * Actions menu for individual user management
 * Provides contextual actions like view, assign role, timeout, etc.
 */
export const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  onViewUser,
  onAssignRole,
  onManageSubscription,
  onManageQuota,
  onExportData,
  onTimeoutUser,
  onRevokeTimeout,
  closeTooltip
}) => (
  <div className="user-actions-menu">
    <LoadingButton
      className="action-menu-item"
      onClick={() => {
        onViewUser(user.id);
        closeTooltip?.();
      }}
      globalLoadingMessage="Loading user details..."
      loadingText="Loading..."
      variant="ghost"
      size="sm"
    >
      <span className="action-icon">👁️</span>
      <span className="action-label">View Details</span>
    </LoadingButton>

    <button
      className="action-menu-item"
      onClick={() => {
        onAssignRole(user);
        closeTooltip?.();
      }}
    >
      <span className="action-icon">🎭</span>
      <span className="action-label">Assign Role</span>
    </button>

    <button
      className="action-menu-item"
      onClick={() => {
        onManageSubscription(user);
        closeTooltip?.();
      }}
    >
      <span className="action-icon">💎</span>
      <span className="action-label">Manage Subscription</span>
    </button>

    <button
      className="action-menu-item"
      onClick={() => {
        onManageQuota(user);
        closeTooltip?.();
      }}
    >
      <span className="action-icon">⚡</span>
      <span className="action-label">Manage Quota</span>
    </button>

    <button
      className="action-menu-item"
      onClick={() => {
        onExportData(user);
        closeTooltip?.();
      }}
    >
      <span className="action-icon">📊</span>
      <span className="action-label">Export Data</span>
    </button>

    <div className="action-menu-divider"></div>

    {user.is_timed_out ? (
      <LoadingButton
        className="action-menu-item action-menu-item--danger"
        onClick={() => {
          onRevokeTimeout(user);
          closeTooltip?.();
        }}
        globalLoadingMessage="Revoking timeout..."
        loadingText="Revoking..."
        variant="danger"
        size="sm"
      >
        <span className="action-icon">🔓</span>
        <span className="action-label">Revoke Timeout</span>
      </LoadingButton>
    ) : (
      <LoadingButton
        className="action-menu-item action-menu-item--warning"
        onClick={() => {
          onTimeoutUser(user);
          closeTooltip?.();
        }}
        globalLoadingMessage="Applying timeout..."
        loadingText="Timing out..."
        variant="secondary"
        size="sm"
      >
        <span className="action-icon">⏰</span>
        <span className="action-label">Timeout User</span>
      </LoadingButton>
    )}
  </div>
);

// ================================
// SEARCH OVERLAY COMPONENTS
// ================================

interface SearchOverlayProps {
  isSearching: boolean;
  searchResults: SearchResult[];
  searchQuery: string;
  onResultSelect: (user: SearchResult) => void;
}

/**
 * Search overlay content for the smart search functionality
 */
export const SearchOverlayContent: React.FC<SearchOverlayProps> = ({
  isSearching,
  searchResults,
  searchQuery,
  onResultSelect
}) => {
  if (isSearching) {
    return (
      <div className="search-overlay-loading">
        <span>🔍</span> Searching users...
      </div>
    );
  }

  if (searchResults.length === 0 && searchQuery.trim().length >= 2) {
    return (
      <div className="search-overlay-no-results">
        <span>👤</span> No users found for &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  return (
    <>
      {searchResults.map((user) => (
        <button
          key={user.id}
          className="search-overlay-item"
          onClick={() => onResultSelect(user)}
        >
          <div className="search-result-avatars">
            {/* Provider account image */}
            {user.image && (
              <img
                src={user.image}
                alt="Provider avatar"
                className="search-result-provider-avatar"
              />
            )}
            {/* Seeded avatar */}
            <Avatar seed={user.id} size="xxs" />
          </div>
          <div className="search-result-info">
            <span className="search-result-name">
              {user.name || 'Unnamed User'}
            </span>
            <span className="search-result-email">{user.email}</span>
            {(user.role_names || (user.roles && user.roles.length > 0)) && (
              <div className="search-result-roles">
                {user.role_names
                  ? user.role_names.split(', ').map((roleName, index) => (
                      <span
                        key={index}
                        className="role-badge role-badge--small"
                      >
                        {roleName}
                      </span>
                    ))
                  : user.roles?.map((role) => (
                      <span
                        key={role.id}
                        className="role-badge role-badge--small"
                      >
                        {role.name}
                      </span>
                    ))}
              </div>
            )}
          </div>
        </button>
      ))}
    </>
  );
};

// ================================
// USER TABLE CELL COMPONENTS
// ================================

interface UserInfoCellProps {
  user: ManagementUser;
}

/**
 * User info cell with dual avatars and user details
 */
export const UserInfoCell: React.FC<UserInfoCellProps> = ({ user }) => (
  <td className="user-info-cell">
    <div className="user-avatars">
      {/* Provider account image */}
      {user.image && (
        <img
          src={user.image}
          alt="Provider avatar"
          className="provider-avatar"
          title="Provider account image"
        />
      )}
      {/* Seeded avatar */}
      <Avatar seed={user.id} size="sm" enableTooltip={true} tooltipScale={2} />
    </div>
    <div className="user-details">
      <div className="user-name-row">
        <span className="user-name">{user.name || 'Unnamed User'}</span>
      </div>
      <div className="user-id-row">
        <span className="user-id">ID: {user.id}</span>
      </div>
    </div>
  </td>
);

interface RolesCellProps {
  user: ManagementUser;
}

/**
 * Roles cell with role badges
 */
export const RolesCell: React.FC<RolesCellProps> = ({ user }) => (
  <td className="roles-cell">
    <div className="roles-container">
      <div className="roles-list">
        {user.role_names ? (
          user.role_names.split(', ').map((roleName, index) => (
            <span key={index} className="role-badge">
              {roleName}
            </span>
          ))
        ) : (
          <span className="no-roles">No roles</span>
        )}
      </div>
    </div>
  </td>
);

interface TimeoutDetailsCellProps {
  user: ManagementUser;
  formatDate: (dateString: string) => string;
}

/**
 * Timeout details cell with timeout information
 */
export const TimeoutDetailsCell: React.FC<TimeoutDetailsCellProps> = ({
  user,
  formatDate
}) => (
  <td className="timeout-details-cell">
    {user.is_timed_out ? (
      <div className="timeout-info">
        {user.active_timeout_reason && (
          <div className="timeout-reason-row">
            <span className="timeout-reason">
              ⏰ {user.active_timeout_reason}
            </span>
          </div>
        )}
        {user.timeout_expires && (
          <div className="timeout-expires-row">
            <span className="timeout-expires">
              Expires: {formatDate(user.timeout_expires)}
            </span>
          </div>
        )}
      </div>
    ) : (
      <span className="no-timeout">No active timeout</span>
    )}
  </td>
);

// ================================
// LOADING AND STATE COMPONENTS
// ================================

/**
 * Loading state component
 */
export const LoadingState: React.FC = () => (
  <div className="user-management-panel">
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Loading users...</p>
    </div>
  </div>
);

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

/**
 * Error state component
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="user-management-panel">
    <div className="error-state">
      <p>Error: {error}</p>
      <button onClick={onRetry} className="btn btn--primary">
        Retry
      </button>
    </div>
  </div>
);

/**
 * Infinite scroll loading indicator
 */
export const InfiniteScrollLoading: React.FC = () => (
  <div className="infinite-scroll-loading">
    <div className="loading-spinner"></div>
    <span>Loading more users...</span>
  </div>
);

/**
 * End of list indicator for infinite scroll
 */
export const InfiniteScrollEnd: React.FC = () => (
  <div className="infinite-scroll-end">
    <span>You&apos;ve reached the end of the list! ��</span>
  </div>
);
