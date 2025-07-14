'use client';

/**
 * User Management Panel - Main Component
 *
 * This is the main orchestrator component that coordinates between
 * smaller, focused components and manages the overall state flow.
 * Now dramatically reduced in size by delegating to specialized components.
 */

import { usePaginationMode } from '@lib/context/UserPreferencesContext';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AssignRoleModal } from '../modals/AssignRoleModal';
import { AssignSubscriptionModal } from '../modals/AssignSubscriptionModal';
import { ExportModal } from '../modals/ExportModal';
import { TimeoutModal, type TimeoutOptions } from '../modals/TimeoutModal';
import { UserDetailsModal } from '../modals/UserDetailsModal';

// Import our extracted modules
import '../UserManagementPanel.css';
import { ErrorState, LoadingState, SearchOverlayContent } from './components';
import { SORTABLE_COLUMNS } from './constants';
import { FilterPanel } from './FilterPanel';
import { HeaderSection } from './HeaderSection';
import {
  useColumnFiltering,
  useColumnSorting,
  useInfiniteScroll,
  usePaginatedUsers,
  useSmartSearch,
  useUsersData
} from './hooks';
import { PaginationSection } from './PaginationSection';
import { QuotaManagement } from './QuotaManagement';
import type { AdminUserManagementPanelProps, ManagementUser } from './types';
import { UserTable } from './UserTable';

export const UserManagementPanel: React.FC<AdminUserManagementPanelProps> = ({
  onUserUpdate
}) => {
  // All the hooks for data management
  const {
    users,
    loading,
    error,
    currentPage,
    totalPages,
    loadUsers,
    goToPage,
    setError
  } = useUsersData();
  const {
    searchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    setSearchQuery,
    setShowSearchResults,
    handleSearchChange,
    handleSearchResultSelect
  } = useSmartSearch();
  const {
    columnFilters,
    showFilterPanel,
    activeFiltersCount,
    setShowFilterPanel,
    applyColumnFilters,
    addColumnFilter,
    updateColumnFilter,
    removeColumnFilter,
    clearAllFilters
  } = useColumnFiltering(users);
  const { currentSort, handleSort, getSortIndicator } = useColumnSorting();
  const { mode: paginationMode } = usePaginationMode();

  // Process users through filters and sorting
  const filteredUsers = useMemo(() => {
    const filtered = applyColumnFilters(users);
    if (!currentSort.direction || !currentSort.column) return filtered;

    const sortColumn = SORTABLE_COLUMNS.find(
      (col) => col.key === currentSort.column
    );
    if (!sortColumn?.sortable) return filtered;

    return [...filtered].sort((a, b) => {
      if (sortColumn.customSortFn) {
        return sortColumn.customSortFn(a, b, currentSort.direction!);
      }
      return 0;
    });
  }, [users, applyColumnFilters, currentSort]);

  const { displayedUsers, hasMoreUsers, isLoadingMore, loadMoreUsers } =
    useInfiniteScroll(filteredUsers);
  const paginatedUsers = usePaginatedUsers(
    filteredUsers,
    currentPage,
    paginationMode,
    displayedUsers
  );

  // Modal states
  const [selectedUser, setSelectedUser] = React.useState<ManagementUser | null>(
    null
  );
  const [showRoleModal, setShowRoleModal] = React.useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] =
    React.useState(false);
  const [showQuotaModal, setShowQuotaModal] = React.useState(false);
  const [roleAssignmentUser, setRoleAssignmentUser] =
    React.useState<ManagementUser | null>(null);
  const [subscriptionAssignmentUser, setSubscriptionAssignmentUser] =
    React.useState<ManagementUser | null>(null);
  const [quotaManagementUser, setQuotaManagementUser] =
    React.useState<ManagementUser | null>(null);
  const [showTimeoutModal, setShowTimeoutModal] = React.useState(false);
  const [timeoutUser, setTimeoutUser] = React.useState<ManagementUser | null>(
    null
  );
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = React.useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) handleSearchChange(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearchChange]);

  useEffect(() => {
    if (paginationMode !== 'infinite') return;
    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 100) loadMoreUsers();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMoreUsers, paginationMode]);

  // Action handlers (simplified)
  const handleViewUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
        setShowUserDetailsModal(true);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  }, []);

  const handleAssignRole = useCallback(
    async (roleId: string, expiresAt?: string, reason?: string) => {
      if (!roleAssignmentUser) return;
      try {
        const response = await fetch(
          `/api/admin/users/${roleAssignmentUser.id}/roles`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleId, expiresAt, reason })
          }
        );
        if (response.ok) {
          await loadUsers(currentPage);
          onUserUpdate?.();
        }
      } catch (error) {
        console.error('Error assigning role:', error);
      }
    },
    [roleAssignmentUser, currentPage, loadUsers, onUserUpdate]
  );

  const handleManageSubscription = useCallback(
    async (
      planId: string,
      billingCycle: string,
      expiresAt?: string,
      reason?: string,
      priceOverrideCents?: number,
      priceOverrideReason?: string
    ) => {
      if (!subscriptionAssignmentUser) return;
      try {
        const response = await fetch(
          `/api/admin/users/${subscriptionAssignmentUser.id}/assign-subscription`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId: parseInt(planId),
              billingCycle,
              expiresAt,
              reason,
              priceOverrideCents,
              priceOverrideReason
            })
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to assign subscription');
        }
        await loadUsers(currentPage);
        onUserUpdate?.();
      } catch (error) {
        console.error('Error managing subscription:', error);
        throw error; // Re-throw to show error in modal
      }
    },
    [subscriptionAssignmentUser, currentPage, loadUsers, onUserUpdate]
  );

  const handleManageQuota = useCallback((user: ManagementUser) => {
    setQuotaManagementUser(user);
    setShowQuotaModal(true);
  }, []);

  const handleQuotaUpdate = useCallback(() => {
    // Refresh user data after quota update
    loadUsers(currentPage);
    onUserUpdate?.();
  }, [loadUsers, currentPage, onUserUpdate]);

  const handleTimeoutUser = useCallback((user: ManagementUser) => {
    setTimeoutUser(user);
    setShowTimeoutModal(true);
  }, []);

  const handleRevokeTimeout = useCallback(
    async (user: ManagementUser) => {
      if (!user.active_timeout_id) return;
      const confirmed = window.confirm(
        `Revoke timeout for ${user.name || user.email}?`
      );
      if (!confirmed) return;

      try {
        const response = await fetch(`/api/admin/users/timeout/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timeoutId: user.active_timeout_id,
            reason: 'Revoked via admin panel'
          })
        });
        if (response.ok) {
          await loadUsers(currentPage);
          onUserUpdate?.();
        }
      } catch (error) {
        console.error('Error revoking timeout:', error);
      }
    },
    [currentPage, loadUsers, onUserUpdate]
  );

  const handleTimeoutSubmit = useCallback(
    async (userId: string, options: TimeoutOptions) => {
      try {
        const response = await fetch(`/api/admin/users/timeout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: parseInt(userId),
            timeoutType: options.timeoutType,
            reason: options.reason,
            durationHours: options.durationHours
          })
        });
        if (response.ok) {
          await loadUsers(currentPage);
          onUserUpdate?.();
        }
      } catch (error) {
        console.error('Error timing out user:', error);
      }
    },
    [currentPage, loadUsers, onUserUpdate]
  );

  // Search overlay content
  const searchOverlayContent = useMemo(() => {
    if (!showSearchResults) return null;
    return (
      <div className="user-search-overlay-content">
        <SearchOverlayContent
          isSearching={isSearching}
          searchResults={searchResults}
          searchQuery={searchQuery}
          onResultSelect={handleSearchResultSelect}
        />
      </div>
    );
  }, [
    showSearchResults,
    isSearching,
    searchResults,
    searchQuery,
    handleSearchResultSelect
  ]);

  // Early returns
  if (loading && users.length === 0) return <LoadingState />;
  if (error)
    return <ErrorState error={error} onRetry={() => loadUsers(currentPage)} />;

  return (
    <div className="user-management-panel">
      <HeaderSection
        showFilterPanel={showFilterPanel}
        activeFiltersCount={activeFiltersCount}
        searchQuery={searchQuery}
        showSearchResults={showSearchResults}
        isSearching={isSearching}
        searchOverlayContent={searchOverlayContent}
        onToggleFilterPanel={() => setShowFilterPanel(!showFilterPanel)}
        onExportAll={() => setShowExportModal(true)}
        onSearchQueryChange={setSearchQuery}
        onSearchFocus={() => setShowSearchResults(true)}
        onSearchBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
        onSearchClear={() => {
          setSearchQuery('');
          setShowSearchResults(false);
        }}
      />

      <FilterPanel
        showFilterPanel={showFilterPanel}
        activeFiltersCount={activeFiltersCount}
        columnFilters={columnFilters}
        onTogglePanel={() => setShowFilterPanel(!showFilterPanel)}
        onClearAllFilters={clearAllFilters}
        onAddFilter={addColumnFilter}
        onUpdateFilter={updateColumnFilter}
        onRemoveFilter={removeColumnFilter}
      />

      <UserTable
        users={paginatedUsers}
        paginationMode={paginationMode}
        isLoadingMore={isLoadingMore}
        hasMoreUsers={hasMoreUsers}
        currentSort={currentSort}
        onSort={handleSort}
        getSortIndicator={getSortIndicator}
        onViewUser={handleViewUser}
        onAssignRole={(user) => {
          setRoleAssignmentUser(user);
          setShowRoleModal(true);
        }}
        onManageSubscription={(user) => {
          // eslint-disable-next-line no-console
          console.log(
            'UserManagementPanel: onManageSubscription triggered for user:',
            user
          );
          setSubscriptionAssignmentUser(user);
          setShowSubscriptionModal(true);
          // eslint-disable-next-line no-console
          console.log(
            'UserManagementPanel: Modal state set - showSubscriptionModal:',
            true
          );
        }}
        onManageQuota={handleManageQuota}
        onExportData={(user) => {
          setSelectedUser(user);
          setShowExportModal(true);
        }}
        onTimeoutUser={handleTimeoutUser}
        onRevokeTimeout={handleRevokeTimeout}
        tableContainerRef={tableContainerRef}
      />

      <PaginationSection
        paginationMode={paginationMode}
        currentPage={currentPage}
        totalPages={totalPages}
        paginatedUsers={paginatedUsers}
        filteredUsers={filteredUsers}
        users={users}
        activeFiltersCount={activeFiltersCount}
        hasMoreUsers={hasMoreUsers}
        onGoToPage={goToPage}
      />

      {/* Modals */}
      {showRoleModal && roleAssignmentUser && (
        <AssignRoleModal
          userName={
            roleAssignmentUser.name ||
            roleAssignmentUser.email ||
            'Unknown User'
          }
          userId={roleAssignmentUser.id}
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setRoleAssignmentUser(null);
          }}
          onAssign={handleAssignRole}
        />
      )}

      {(() => {
        // eslint-disable-next-line no-console
        console.log('UserManagementPanel modal render check:', {
          showSubscriptionModal,
          subscriptionAssignmentUser: subscriptionAssignmentUser?.id,
          shouldRenderModal: showSubscriptionModal && subscriptionAssignmentUser
        });
        return null;
      })()}

      {showSubscriptionModal && subscriptionAssignmentUser && (
        <AssignSubscriptionModal
          userName={
            subscriptionAssignmentUser.name ||
            subscriptionAssignmentUser.email ||
            'Unknown User'
          }
          userId={subscriptionAssignmentUser.id}
          isOpen={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSubscriptionAssignmentUser(null);
          }}
          onAssign={handleManageSubscription}
        />
      )}

      {showQuotaModal && quotaManagementUser && (
        <QuotaManagement
          user={quotaManagementUser}
          isOpen={showQuotaModal}
          onClose={() => {
            setShowQuotaModal(false);
            setQuotaManagementUser(null);
          }}
          onUpdate={handleQuotaUpdate}
        />
      )}

      {showTimeoutModal && timeoutUser && (
        <TimeoutModal
          user={timeoutUser}
          isOpen={showTimeoutModal}
          onClose={() => {
            setShowTimeoutModal(false);
            setTimeoutUser(null);
          }}
          onTimeout={async (userId: string, options: TimeoutOptions) => {
            try {
              const response = await fetch(
                `/api/admin/users/${userId}/timeout`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(options)
                }
              );
              if (response.ok) {
                await loadUsers(currentPage);
                onUserUpdate?.();
              }
            } catch (error) {
              console.error('Error applying timeout:', error);
            }
          }}
        />
      )}

      {showExportModal && (
        <ExportModal
          users={paginatedUsers}
          selectedUser={selectedUser}
          isOpen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showUserDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={showUserDetailsModal}
          onClose={() => {
            setShowUserDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};
