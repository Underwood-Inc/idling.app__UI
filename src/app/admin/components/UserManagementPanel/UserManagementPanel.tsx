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
import { ExportModal } from '../modals/ExportModal';
import { TimeoutModal, type TimeoutOptions } from '../modals/TimeoutModal';
import { UserDetailsModal } from '../modals/UserDetailsModal';
import { UserSubscriptionManagementModal } from '../modals/UserSubscriptionManagementModal';

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
  const [showUserDetailsModal, setShowUserDetailsModal] = React.useState(false);
  const [showQuotaModal, setShowQuotaModal] = React.useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);

  // User assignment states
  const [roleAssignmentUser, setRoleAssignmentUser] =
    React.useState<ManagementUser | null>(null);
  const [subscriptionAssignmentUser, setSubscriptionAssignmentUser] =
    React.useState<ManagementUser | null>(null);
  const [quotaManagementUser, setQuotaManagementUser] =
    React.useState<ManagementUser | null>(null);
  const [timeoutUser, setTimeoutUser] = React.useState<ManagementUser | null>(
    null
  );

  // Refs for infinite scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Load users on mount
  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  // Scroll to top when page changes
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Handle user actions
  const handleViewUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        setSelectedUser(user);
        setShowUserDetailsModal(true);
      }
    },
    [users]
  );

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

  const handleManageQuota = useCallback((user: ManagementUser) => {
    setQuotaManagementUser(user);
    setShowQuotaModal(true);
  }, []);

  const handleQuotaUpdate = useCallback(async () => {
    await loadUsers(currentPage);
    onUserUpdate?.();
  }, [currentPage, loadUsers, onUserUpdate]);

  const handleTimeoutUser = useCallback((user: ManagementUser) => {
    setTimeoutUser(user);
    setShowTimeoutModal(true);
  }, []);

  const handleRevokeTimeout = useCallback(
    async (user: ManagementUser) => {
      try {
        const response = await fetch(`/api/admin/users/${user.id}/timeout`, {
          method: 'DELETE'
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

  // Clear search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSearchResults) {
        const searchContainer = document.querySelector('.search-container');
        if (
          searchContainer &&
          !searchContainer.contains(event.target as Node)
        ) {
          setShowSearchResults(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchResults, setShowSearchResults]);

  // Main render
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => loadUsers(1)} />;
  }

  return (
    <div className="user-management-panel">
      <HeaderSection
        searchQuery={searchQuery}
        showSearchResults={showSearchResults}
        isSearching={isSearching}
        showFilterPanel={showFilterPanel}
        activeFiltersCount={activeFiltersCount}
        searchOverlayContent={null}
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

      {/* Search overlay */}
      {showSearchResults && (
        <SearchOverlayContent
          isSearching={isSearching}
          searchResults={searchResults}
          searchQuery={searchQuery}
          onResultSelect={handleSearchResultSelect}
        />
      )}

      {/* Filter panel */}
      {showFilterPanel && (
        <FilterPanel
          showFilterPanel={showFilterPanel}
          activeFiltersCount={activeFiltersCount}
          columnFilters={columnFilters}
          onTogglePanel={() => setShowFilterPanel(false)}
          onClearAllFilters={clearAllFilters}
          onAddFilter={addColumnFilter}
          onUpdateFilter={updateColumnFilter}
          onRemoveFilter={removeColumnFilter}
        />
      )}

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
          setSubscriptionAssignmentUser(user);
          setShowSubscriptionModal(true);
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

      {showSubscriptionModal && subscriptionAssignmentUser && (
        <UserSubscriptionManagementModal
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
          onUpdate={async () => {
            await loadUsers(currentPage);
            onUserUpdate?.();
          }}
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
