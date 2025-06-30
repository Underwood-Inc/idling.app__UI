/**
 * Constants and configuration for User Management Panel
 * 
 * This module contains all the static configuration data including
 * filterable columns, sortable columns, and operational constants
 * used throughout the user management system.
 */

import type { FilterableColumn, FilterOperator, ManagementUser, SortableColumn } from './types';

// ================================
// PAGINATION CONSTANTS
// ================================

export const USERS_PER_PAGE = 10;
export const USERS_PER_LOAD = 10; // For infinite scroll

// ================================
// FILTERABLE COLUMNS CONFIGURATION
// ================================

export const FILTERABLE_COLUMNS: FilterableColumn[] = [
  { key: 'name', label: 'User Name', type: 'text' },
  { key: 'email', label: 'Contact Email', type: 'email' },
  {
    key: 'provider_name',
    label: 'Provider',
    type: 'select',
    options: ['Twitch', 'Discord', 'GitHub', 'Google']
  },
  { key: 'role_names', label: 'Roles', type: 'text' },
  {
    key: 'is_timed_out',
    label: 'Status',
    type: 'boolean'
  },
  {
    key: 'subscriptions',
    label: 'Plans',
    type: 'select',
    options: ['Free', 'Premium', 'Pro']
  },
  { key: 'active_timeout_reason', label: 'Timeout Reason', type: 'text' },
  { key: 'created_at', label: 'Join Date', type: 'date' }
];

// ================================
// SORTABLE COLUMNS CONFIGURATION
// ================================

export const SORTABLE_COLUMNS: SortableColumn[] = [
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    sortType: 'string'
  },
  {
    key: 'name',
    label: 'User',
    sortable: true,
    sortType: 'custom',
    customSortFn: (a, b, direction) => {
      // Sort by name, fallback to ID if names are equal/null
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();

      if (nameA !== nameB) {
        const result = nameA.localeCompare(nameB);
        return direction === 'asc' ? result : -result;
      }

      // Fallback to ID comparison
      const idA = parseInt(a.id);
      const idB = parseInt(b.id);
      const result = idA - idB;
      return direction === 'asc' ? result : -result;
    }
  },
  {
    key: 'email',
    label: 'Contact',
    sortable: true,
    sortType: 'string'
  },
  {
    key: 'provider_name',
    label: 'Provider',
    sortable: true,
    sortType: 'string'
  },
  {
    key: 'role_names',
    label: 'Roles',
    sortable: true,
    sortType: 'custom',
    customSortFn: (a, b, direction) => {
      // Sort by role count first, then alphabetically by role names
      const roleCountA = a.role_count || 0;
      const roleCountB = b.role_count || 0;

      if (roleCountA !== roleCountB) {
        const result = roleCountA - roleCountB;
        return direction === 'asc' ? result : -result;
      }

      // Fallback to alphabetical by role names
      const rolesA = (a.role_names || '').toLowerCase();
      const rolesB = (b.role_names || '').toLowerCase();
      const result = rolesA.localeCompare(rolesB);
      return direction === 'asc' ? result : -result;
    }
  },
  {
    key: 'is_timed_out',
    label: 'Status',
    sortable: true,
    sortType: 'boolean'
  },
  {
    key: 'subscriptions',
    label: 'Plans',
    sortable: true,
    sortType: 'custom',
    customSortFn: (a, b, direction) => {
      // Define subscription tier hierarchy
      const getTierValue = (user: ManagementUser): number => {
        if (user.subscriptions && user.subscriptions.length > 0) {
          const plans = user.subscriptions.map((sub) =>
            sub.plan_name.toLowerCase()
          );
          if (plans.includes('pro')) return 3;
          if (plans.includes('premium')) return 2;
          return 1; // Any other plan
        }
        return 0; // Free/no subscription
      };

      const tierA = getTierValue(a);
      const tierB = getTierValue(b);
      const result = tierA - tierB;
      return direction === 'asc' ? result : -result;
    }
  },
  {
    key: 'timeout_expires',
    label: 'Timeout Details',
    sortable: true,
    sortType: 'custom',
    customSortFn: (a, b, direction) => {
      // Sort by timeout status first (timed out users first), then by expiration date
      const timedOutA = a.is_timed_out ? 1 : 0;
      const timedOutB = b.is_timed_out ? 1 : 0;

      if (timedOutA !== timedOutB) {
        const result = timedOutB - timedOutA; // Timed out users first
        return direction === 'asc' ? result : -result;
      }

      // If both have same timeout status, sort by expiration date
      if (a.timeout_expires && b.timeout_expires) {
        const dateA = new Date(a.timeout_expires).getTime();
        const dateB = new Date(b.timeout_expires).getTime();
        const result = dateA - dateB;
        return direction === 'asc' ? result : -result;
      }

      // Handle cases where one has expiration and other doesn't
      if (a.timeout_expires && !b.timeout_expires)
        return direction === 'asc' ? -1 : 1;
      if (!a.timeout_expires && b.timeout_expires)
        return direction === 'asc' ? 1 : -1;

      return 0;
    }
  },
  {
    key: 'created_at',
    label: 'Joined',
    sortable: true,
    sortType: 'date'
  }
];

// ================================
// FILTER OPERATOR UTILITIES
// ================================

/**
 * Get valid operators for a given column type
 * @param columnType - The type of column to get operators for
 * @returns Array of valid filter operators
 */
export const getValidOperators = (
  columnType: FilterableColumn['type']
): FilterOperator[] => {
  switch (columnType) {
    case 'text':
    case 'email':
      return [
        'contains',
        'not_contains',
        'equals',
        'not_equals',
        'starts_with',
        'ends_with',
        'is_empty',
        'is_not_empty'
      ];

    case 'select':
      return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];

    case 'boolean':
      return ['equals', 'not_equals'];

    case 'date':
      return [
        'date_equals',
        'date_before',
        'date_after',
        'is_empty',
        'is_not_empty'
      ];

    default:
      return ['contains', 'equals'];
  }
};

/**
 * Get user-friendly label for filter operators
 * @param operator - The filter operator
 * @returns Human-readable label for the operator
 */
export const getOperatorLabel = (operator: FilterOperator): string => {
  switch (operator) {
    case 'contains':
      return 'Contains';
    case 'not_contains':
      return 'Does not contain';
    case 'equals':
      return 'Equals';
    case 'not_equals':
      return 'Does not equal';
    case 'starts_with':
      return 'Starts with';
    case 'ends_with':
      return 'Ends with';
    case 'is_empty':
      return 'Is empty';
    case 'is_not_empty':
      return 'Is not empty';
    case 'date_before':
      return 'Before date';
    case 'date_after':
      return 'After date';
    case 'date_equals':
      return 'On date';
    default:
      return operator;
  }
}; 