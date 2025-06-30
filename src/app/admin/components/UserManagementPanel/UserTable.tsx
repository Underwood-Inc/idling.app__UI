/**
 * User Table Component
 *
 * Handles the rendering of the users table with sorting, pagination indicators,
 * and individual user rows. This component is focused solely on table presentation.
 */

import React from 'react';
import { InteractiveTooltip } from '../../../components/tooltip/InteractiveTooltip';
import {
  InfiniteScrollEnd,
  InfiniteScrollLoading,
  RolesCell,
  TimeoutDetailsCell,
  UserActionsMenu,
  UserInfoCell
} from './components';
import { SORTABLE_COLUMNS } from './constants';
import type { ManagementUser } from './types';
import { formatDate, getPlansDisplay, getStatusBadge } from './utils';

interface UserTableProps {
  users: ManagementUser[];
  paginationMode: 'traditional' | 'infinite';
  isLoadingMore: boolean;
  hasMoreUsers: boolean;
  currentSort: { column: string; direction: 'asc' | 'desc' | null };
  onSort: (columnKey: string) => void;
  getSortIndicator: (columnKey: string) => string;
  onViewUser: (userId: string) => void;
  onAssignRole: (user: ManagementUser) => void;
  onManageSubscription: (user: ManagementUser) => void;
  onManageQuota: (user: ManagementUser) => void;
  onExportData: (user: ManagementUser) => void;
  onTimeoutUser: (user: ManagementUser) => void;
  onRevokeTimeout: (user: ManagementUser) => void;
  tableContainerRef: React.RefObject<HTMLDivElement>;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  paginationMode,
  isLoadingMore,
  hasMoreUsers,
  currentSort,
  onSort,
  getSortIndicator,
  onViewUser,
  onAssignRole,
  onManageSubscription,
  onManageQuota,
  onExportData,
  onTimeoutUser,
  onRevokeTimeout,
  tableContainerRef
}) => {
  return (
    <div
      className="users-table-container"
      ref={tableContainerRef}
      tabIndex={0}
      role="region"
      aria-label="User management table with horizontal and vertical scrolling"
    >
      <table className="users-table">
        <thead>
          <tr>
            {SORTABLE_COLUMNS.map((column) => (
              <th
                key={column.key}
                className={column.sortable ? 'sortable-header' : ''}
                onClick={column.sortable ? () => onSort(column.key) : undefined}
                title={column.sortable ? 'Click to sort' : undefined}
              >
                {column.label}
                {getSortIndicator(column.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="user-row">
              {/* Actions column */}
              <td className="actions-cell">
                <InteractiveTooltip
                  content={
                    <UserActionsMenu
                      user={user}
                      onViewUser={onViewUser}
                      onAssignRole={onAssignRole}
                      onManageSubscription={onManageSubscription}
                      onManageQuota={onManageQuota}
                      onExportData={onExportData}
                      onTimeoutUser={onTimeoutUser}
                      onRevokeTimeout={onRevokeTimeout}
                      closeTooltip={() => {}}
                    />
                  }
                  triggerOnClick={true}
                  className="user-actions-tooltip"
                >
                  <button className="hamburger-menu-btn" title="User Actions">
                    <span className="hamburger-icon">⋮</span>
                  </button>
                </InteractiveTooltip>
              </td>

              {/* User column with dual avatars */}
              <UserInfoCell user={user} />

              {/* Contact column */}
              <td className="contact-cell">
                <div className="contact-row">
                  <span className="user-email">{user.email}</span>
                </div>
              </td>

              {/* Provider column */}
              <td className="provider-cell">
                <div className="provider-row">
                  <span className="provider-name">
                    {user.provider_name || 'Not Available'}
                  </span>
                </div>
              </td>

              {/* Roles column */}
              <RolesCell user={user} />

              {/* Status column */}
              <td className="status-cell">{getStatusBadge(user)}</td>

              {/* Plans column */}
              <td className="plans-cell">{getPlansDisplay(user)}</td>

              {/* Timeout Details column */}
              <TimeoutDetailsCell user={user} formatDate={formatDate} />

              {/* Joined column */}
              <td className="joined-cell">
                <div className="joined-row">
                  <span className="joined-date">
                    {formatDate(user.created_at)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Infinite Scroll Loading Indicator */}
      {paginationMode === 'infinite' && isLoadingMore && (
        <InfiniteScrollLoading />
      )}

      {/* End of List Indicator for Infinite Scroll */}
      {paginationMode === 'infinite' && !hasMoreUsers && users.length > 0 && (
        <InfiniteScrollEnd />
      )}
    </div>
  );
};
