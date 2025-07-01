/**
 * Type definitions for User Management Panel
 * 
 * This module contains all the interfaces and types used throughout
 * the user management system, providing a central location for
 * type definitions and ensuring consistency across components.
 */

// ================================
// USER MANAGEMENT INTERFACES
// ================================

export interface ManagementUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  created_at: string;
  provider_name?: string | null;
  is_timed_out?: boolean;
  active_timeout_id?: number | null;
  active_timeout_reason?: string | null;
  timeout_expires?: string | null;
  // Role summary from API
  role_count?: number;
  role_names?: string | null;
  has_admin?: boolean;
  has_moderator?: boolean;
  // Legacy format for compatibility
  roles?: ManagementUserRole[];
  subscriptions?: ManagementUserSubscription[];
  timeouts?: ManagementUserTimeout[];
}

export interface ManagementUserRole {
  id: string;
  name: string;
  display_name: string;
  assigned_at: string;
}

export interface ManagementUserSubscription {
  id: string;
  service_name: string;
  plan_name: string;
  status: string;
  expires_at: string | null;
}

export interface ManagementUserTimeout {
  id: string;
  reason: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

export interface SearchResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role_names?: string | null;
  roles?: ManagementUserRole[];
  subscriptions?: ManagementUserSubscription[];
}

// ================================
// COMPONENT PROP INTERFACES
// ================================

export interface AdminUserManagementPanelProps {
  onUserUpdate?: () => void;
}

export interface UserActionsMenuProps {
  user: ManagementUser;
  onViewUser: (userId: string) => void;
  onAssignRole: (user: ManagementUser) => void;
  onManageSubscription: (user: ManagementUser) => void;
  onManageQuota: (user: ManagementUser) => void;
  onExportData: (user: ManagementUser) => void;
  onTimeoutUser: (user: ManagementUser) => void;
  onRevokeTimeout: (user: ManagementUser) => void;
  closeTooltip?: () => void;
}

// ================================
// FILTERING INTERFACES
// ================================

export interface ColumnFilter {
  column: string;
  operator: FilterOperator;
  value: string;
  active: boolean;
}

export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'starts_with'
  | 'ends_with'
  | 'not_contains'
  | 'not_equals'
  | 'is_empty'
  | 'is_not_empty'
  | 'date_before'
  | 'date_after'
  | 'date_equals';

export interface FilterableColumn {
  key: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'boolean' | 'select';
  options?: string[]; // For select type filters
}

// ================================
// SORTING INTERFACES
// ================================

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnSort {
  column: string;
  direction: SortDirection;
}

export interface SortableColumn {
  key: string;
  label: string;
  sortable: boolean;
  sortType: 'string' | 'number' | 'date' | 'boolean' | 'custom';
  customSortFn?: (
    a: ManagementUser,
    b: ManagementUser,
    direction: 'asc' | 'desc'
  ) => number;
} 