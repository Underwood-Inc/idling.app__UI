'use client';

import { usePaginationMode } from '@/lib/context/UserPreferencesContext';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Avatar } from '../../components/avatar/Avatar';
import { InteractiveTooltip } from '../../components/tooltip/InteractiveTooltip';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { AssignRoleModal } from './modals/AssignRoleModal';
import { AssignSubscriptionModal } from './modals/AssignSubscriptionModal';
import { ExportModal } from './modals/ExportModal';
import { TimeoutModal, type TimeoutOptions } from './modals/TimeoutModal';
import { UserDetailsModal } from './modals/UserDetailsModal';
import './UserManagementPanel.css';

// ================================
// INTERFACES
// ================================

interface ManagementUser {
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

interface ManagementUserRole {
  id: string;
  name: string;
  display_name: string;
  assigned_at: string;
}

interface ManagementUserSubscription {
  id: string;
  service_name: string;
  plan_name: string;
  status: string;
  expires_at: string | null;
}

interface ManagementUserTimeout {
  id: string;
  reason: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

interface SearchResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role_names?: string | null;
  roles?: ManagementUserRole[];
  subscriptions?: ManagementUserSubscription[];
}

interface AdminUserManagementPanelProps {
  onUserUpdate?: () => void;
}

interface UserActionsMenuProps {
  user: ManagementUser;
  onViewUser: (userId: string) => void;
  onAssignRole: (user: ManagementUser) => void;
  onManageSubscription: (user: ManagementUser) => void;
  onExportData: (user: ManagementUser) => void;
  onTimeoutUser: (user: ManagementUser) => void;
  closeTooltip?: () => void;
}

// Column filtering interfaces
interface ColumnFilter {
  column: string;
  operator: FilterOperator;
  value: string;
  active: boolean;
}

type FilterOperator =
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

interface FilterableColumn {
  key: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'boolean' | 'select';
  options?: string[]; // For select type filters
}

// Column sorting interfaces
type SortDirection = 'asc' | 'desc' | null;

interface ColumnSort {
  column: string;
  direction: SortDirection;
}

interface SortableColumn {
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

// Define filterable columns
const FILTERABLE_COLUMNS: FilterableColumn[] = [
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

// Define sortable columns with their sorting behavior
const SORTABLE_COLUMNS: SortableColumn[] = [
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

// Define which operators are valid for each column type
const getValidOperators = (
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

// Get user-friendly operator labels
const getOperatorLabel = (operator: FilterOperator): string => {
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

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  onViewUser,
  onAssignRole,
  onManageSubscription,
  onExportData,
  onTimeoutUser,
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
          onTimeoutUser(user);
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
// MAIN COMPONENT
// ================================

export const UserManagementPanel: React.FC<AdminUserManagementPanelProps> = ({
  onUserUpdate
}) => {
  // State management
  const [users, setUsers] = useState<ManagementUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<ManagementUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [roleAssignmentUser, setRoleAssignmentUser] =
    useState<ManagementUser | null>(null);
  const [subscriptionAssignmentUser, setSubscriptionAssignmentUser] =
    useState<ManagementUser | null>(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [timeoutUser, setTimeoutUser] = useState<ManagementUser | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

  // Column filtering state
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Column sorting state
  const [currentSort, setCurrentSort] = useState<ColumnSort>({
    column: '',
    direction: null
  });

  // Pagination mode from user preferences
  const { mode: paginationMode } = usePaginationMode();

  // Infinite scroll state
  const [displayedUsers, setDisplayedUsers] = useState<ManagementUser[]>([]);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const USERS_PER_PAGE = 10;
  const USERS_PER_LOAD = 10; // For infinite scroll

  // Apply column filters to users
  const applyColumnFilters = useCallback(
    (userList: ManagementUser[]): ManagementUser[] => {
      // If no filters are active, return all users
      if (columnFilters.length === 0 || activeFiltersCount === 0) {
        return userList;
      }

      const filtered = userList.filter((user) => {
        return columnFilters.every((filter) => {
          if (!filter.active) return true;

          const fieldValue = getFieldValue(user, filter.column);
          const filterValue = filter.value.toLowerCase().trim();

          switch (filter.operator) {
            case 'contains':
              return fieldValue.toLowerCase().includes(filterValue);
            case 'not_contains':
              return !fieldValue.toLowerCase().includes(filterValue);
            case 'equals':
              return fieldValue.toLowerCase() === filterValue;
            case 'not_equals':
              return fieldValue.toLowerCase() !== filterValue;
            case 'starts_with':
              return fieldValue.toLowerCase().startsWith(filterValue);
            case 'ends_with':
              return fieldValue.toLowerCase().endsWith(filterValue);
            case 'is_empty':
              return !fieldValue || fieldValue.trim() === '';
            case 'is_not_empty':
              return fieldValue && fieldValue.trim() !== '';
            case 'date_before':
              return new Date(fieldValue) < new Date(filter.value);
            case 'date_after':
              return new Date(fieldValue) > new Date(filter.value);
            case 'date_equals':
              return (
                new Date(fieldValue).toDateString() ===
                new Date(filter.value).toDateString()
              );
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    [columnFilters, activeFiltersCount]
  );

  // Apply sorting to users
  const applySorting = useCallback(
    (userList: ManagementUser[]): ManagementUser[] => {
      if (!currentSort.direction || !currentSort.column) {
        return userList;
      }

      const sortColumn = SORTABLE_COLUMNS.find(
        (col) => col.key === currentSort.column
      );
      if (!sortColumn || !sortColumn.sortable) {
        return userList;
      }

      const sorted = [...userList].sort((a, b) => {
        // Use custom sort function if provided
        if (sortColumn.customSortFn) {
          return sortColumn.customSortFn(a, b, currentSort.direction!);
        }

        // Default sorting based on type
        const valueA = getFieldValue(a, currentSort.column);
        const valueB = getFieldValue(b, currentSort.column);

        switch (sortColumn.sortType) {
          case 'string': {
            const result = valueA
              .toLowerCase()
              .localeCompare(valueB.toLowerCase());
            return currentSort.direction === 'asc' ? result : -result;
          }

          case 'number': {
            const numA = parseFloat(valueA) || 0;
            const numB = parseFloat(valueB) || 0;
            const numResult = numA - numB;
            return currentSort.direction === 'asc' ? numResult : -numResult;
          }

          case 'date': {
            const dateA = new Date(valueA).getTime();
            const dateB = new Date(valueB).getTime();
            const dateResult = dateA - dateB;
            return currentSort.direction === 'asc' ? dateResult : -dateResult;
          }

          case 'boolean': {
            const boolA =
              valueA.toLowerCase() === 'true' ||
              valueA.toLowerCase() === 'timed out';
            const boolB =
              valueB.toLowerCase() === 'true' ||
              valueB.toLowerCase() === 'timed out';
            const boolResult = Number(boolA) - Number(boolB);
            return currentSort.direction === 'asc' ? boolResult : -boolResult;
          }

          default:
            return 0;
        }
      });

      return sorted;
    },
    [currentSort]
  );

  // Handle column header click for sorting
  const handleSort = useCallback((columnKey: string) => {
    const sortColumn = SORTABLE_COLUMNS.find((col) => col.key === columnKey);
    if (!sortColumn || !sortColumn.sortable) return;

    setCurrentSort((prev) => {
      if (prev.column === columnKey) {
        // Cycle through: asc -> desc -> null -> asc
        const newDirection: SortDirection =
          prev.direction === 'asc'
            ? 'desc'
            : prev.direction === 'desc'
              ? null
              : 'asc';
        return { column: columnKey, direction: newDirection };
      } else {
        // New column, start with ascending
        return { column: columnKey, direction: 'asc' };
      }
    });
  }, []);

  // Get sort indicator for column headers
  const getSortIndicator = useCallback(
    (columnKey: string): string => {
      if (currentSort.column !== columnKey) return '';
      switch (currentSort.direction) {
        case 'asc':
          return ' ↑';
        case 'desc':
          return ' ↓';
        default:
          return '';
      }
    },
    [currentSort]
  );

  // Helper function to get display value for UI
  const getDisplayValue = (user: ManagementUser, field: string): string => {
    switch (field) {
      case 'is_timed_out':
        return user.is_timed_out ? 'Timed Out' : 'Active';
      default:
        return getFieldValue(user, field);
    }
  };

  // Helper function to get field value from user object (for filtering/sorting)
  const getFieldValue = (user: ManagementUser, field: string): string => {
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

  // Update filtered users when users, filters, or sorting changes
  useEffect(() => {
    const filtered = applyColumnFilters(users);
    const sorted = applySorting(filtered);
    setFilteredUsers(sorted);

    // Update pagination based on filtered results
    const usersPerPage = 10;
    const newTotalPages = Math.ceil(sorted.length / usersPerPage);
    setTotalPages(newTotalPages);

    // Reset to first page if current page is beyond new total
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [users, applyColumnFilters, applySorting, currentPage, currentSort]);

  // Initialize filtered users when users load for the first time
  useEffect(() => {
    if (
      users.length > 0 &&
      filteredUsers.length === 0 &&
      activeFiltersCount === 0
    ) {
      setFilteredUsers(users);
    }
  }, [users, filteredUsers.length, activeFiltersCount]);

  // Update active filters count
  useEffect(() => {
    const activeCount = columnFilters.filter((filter) => filter.active).length;
    setActiveFiltersCount(activeCount);
  }, [columnFilters]);

  // Add new filter
  const addColumnFilter = useCallback((column: string) => {
    const newFilter: ColumnFilter = {
      column,
      operator: 'contains',
      value: '',
      active: false
    };
    setColumnFilters((prev) => [...prev, newFilter]);
  }, []);

  // Update filter
  const updateColumnFilter = useCallback(
    (index: number, updates: Partial<ColumnFilter>) => {
      setColumnFilters((prev) =>
        prev.map((filter, i) =>
          i === index ? { ...filter, ...updates } : filter
        )
      );
    },
    []
  );

  // Remove filter
  const removeColumnFilter = useCallback((index: number) => {
    setColumnFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setColumnFilters([]);
    setActiveFiltersCount(0);
  }, []);

  // Smart search functionality
  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(value.trim())}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearchChange(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearchChange]);

  // Search result selection
  const handleSearchResultSelect = useCallback((user: SearchResult) => {
    setSelectedUser({
      ...user,
      created_at: new Date().toISOString(), // Placeholder, will be fetched with full details
      timeouts: []
    });
    setShowSearchResults(false);
    setSearchQuery('');
  }, []);

  // Search overlay content for InteractiveTooltip
  const searchOverlayContent = useMemo(() => {
    if (!showSearchResults) return null;

    return (
      <div className="user-search-overlay-content">
        {isSearching && (
          <div className="search-overlay-loading">
            <span>🔍</span> Searching users...
          </div>
        )}
        {!isSearching &&
          searchResults.length === 0 &&
          searchQuery.trim().length >= 2 && (
            <div className="search-overlay-no-results">
              <span>👤</span> No users found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        {searchResults.map((user) => (
          <button
            key={user.id}
            className="search-overlay-item"
            onClick={() => handleSearchResultSelect(user)}
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
      </div>
    );
  }, [
    showSearchResults,
    isSearching,
    searchResults,
    searchQuery,
    handleSearchResultSelect
  ]);

  // Load users function
  const loadUsers = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users?page=${page}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // User action handlers
  const handleViewUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSelectedUser(userData);
        setShowUserDetailsModal(true);
      } else {
        console.error('Failed to load user details');
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
          if (onUserUpdate) onUserUpdate();
        } else {
          console.error('Failed to assign role');
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
      reason?: string
    ) => {
      if (!subscriptionAssignmentUser) return;

      try {
        const response = await fetch(
          `/api/admin/users/${subscriptionAssignmentUser.id}/subscriptions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId, billingCycle, expiresAt, reason })
          }
        );

        if (response.ok) {
          await loadUsers(currentPage);
          if (onUserUpdate) onUserUpdate();
        } else {
          console.error('Failed to manage subscription');
        }
      } catch (error) {
        console.error('Error managing subscription:', error);
      }
    },
    [subscriptionAssignmentUser, currentPage, loadUsers, onUserUpdate]
  );

  // Handle timeout action with modal
  const handleTimeoutUser = useCallback(async (user: ManagementUser) => {
    setTimeoutUser(user);
    setShowTimeoutModal(true);
  }, []);

  // Handle actual timeout submission
  const handleTimeoutSubmit = useCallback(
    async (userId: string, options: TimeoutOptions) => {
      try {
        const response = await fetch(`/api/admin/users/timeout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
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
        } else {
          const errorData = await response.json();
          console.error('Timeout failed:', errorData);
          setError(
            `Failed to timeout user: ${errorData.error || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error timing out user:', error);
        setError('Failed to timeout user');
      }
    },
    [currentPage, loadUsers, onUserUpdate]
  );

  // Pagination handlers
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        loadUsers(page);
      }
    },
    [totalPages, loadUsers]
  );

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (user: ManagementUser) => {
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

  const getPlansDisplay = (user: ManagementUser) => {
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

  // Get paginated users from filtered results
  const getPaginatedUsers = useCallback(() => {
    if (paginationMode === 'infinite') {
      // For infinite scroll, return displayedUsers
      return displayedUsers;
    } else {
      // Traditional pagination
      const startIndex = (currentPage - 1) * USERS_PER_PAGE;
      const endIndex = startIndex + USERS_PER_PAGE;
      return filteredUsers.slice(startIndex, endIndex);
    }
  }, [paginationMode, displayedUsers, filteredUsers, currentPage]);

  // Load more users for infinite scroll
  const loadMoreUsers = useCallback(() => {
    if (isLoadingMore || !hasMoreUsers || paginationMode !== 'infinite') return;

    setIsLoadingMore(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentDisplayed = displayedUsers.length;
      const nextBatch = filteredUsers.slice(
        currentDisplayed,
        currentDisplayed + USERS_PER_LOAD
      );

      if (nextBatch.length > 0) {
        setDisplayedUsers((prev) => [...prev, ...nextBatch]);
        setHasMoreUsers(
          currentDisplayed + nextBatch.length < filteredUsers.length
        );
      } else {
        setHasMoreUsers(false);
      }

      setIsLoadingMore(false);
    }, 300);
  }, [
    displayedUsers,
    filteredUsers,
    isLoadingMore,
    hasMoreUsers,
    paginationMode
  ]);

  // Initialize displayed users for infinite scroll when filteredUsers change
  useEffect(() => {
    if (paginationMode === 'infinite') {
      const initialUsers = filteredUsers.slice(0, USERS_PER_LOAD);
      setDisplayedUsers(initialUsers);
      setHasMoreUsers(initialUsers.length < filteredUsers.length);
    }
  }, [filteredUsers, paginationMode]);

  // Infinite scroll handler
  useEffect(() => {
    if (paginationMode !== 'infinite') return;

    const container = tableContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 100; // Load more when 100px from bottom

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        loadMoreUsers();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMoreUsers, paginationMode]);

  const paginatedUsers = getPaginatedUsers();

  if (loading && users.length === 0) {
    return (
      <div className="user-management-panel">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management-panel">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={() => loadUsers()} className="btn btn--primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-panel">
      {/* Header with Smart Search */}
      <div className="panel-header">
        <div className="header-content">
          <h2 className="panel-title">User Management</h2>
          <p className="panel-description">
            Manage user accounts, roles, subscriptions, and permissions
          </p>
        </div>

        <div className="header-actions">
          <button
            className={`filter-toggle-btn ${showFilterPanel ? 'active' : ''}`}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title="Toggle column filters"
          >
            <span className="filter-icon">🔍</span>
            <span className="filter-label">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="filter-count">{activeFiltersCount}</span>
            )}
          </button>

          <button
            className="export-all-btn"
            onClick={() => {
              setSelectedUser(null);
              setShowExportModal(true);
            }}
            title="Export all user data"
          >
            <span className="export-icon">📊</span>
            <span className="export-label">Export All</span>
          </button>

          {/* Smart Search Input with InteractiveTooltip */}
          <div className="search-container">
            <InteractiveTooltip
              content={searchOverlayContent}
              show={showSearchResults}
              className="search-overlay-tooltip"
              triggerOnClick={false}
            >
              <div className="search-input-wrapper">
                <div className="search-input-icon">
                  {isSearching ? (
                    <div className="search-spinner"></div>
                  ) : (
                    <span>🔍</span>
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name, email, or ID..."
                  className="search-input"
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) {
                      setShowSearchResults(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding to allow clicks on results
                    setTimeout(() => setShowSearchResults(false), 200);
                  }}
                />
                {searchQuery && (
                  <button
                    className="search-clear-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </InteractiveTooltip>
          </div>
        </div>
      </div>

      {/* Column Filter Panel */}
      {showFilterPanel && (
        <div className="filter-panel">
          <div className="filter-panel-header">
            <h3>Column Filters</h3>
            <div className="filter-panel-actions">
              {activeFiltersCount > 0 && (
                <button
                  className="clear-filters-btn"
                  onClick={clearAllFilters}
                  title="Clear all filters"
                >
                  Clear All ({activeFiltersCount})
                </button>
              )}
              <button
                className="close-filter-panel-btn"
                onClick={() => setShowFilterPanel(false)}
                title="Close filter panel"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="filter-panel-content">
            {/* Add Filter Dropdown */}
            <div className="add-filter-section">
              <label>Add Filter:</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addColumnFilter(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="add-filter-select"
              >
                <option value="">Select column to filter...</option>
                {FILTERABLE_COLUMNS.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Filters */}
            <div className="active-filters-section">
              {columnFilters.map((filter, index) => (
                <div key={index} className="filter-row">
                  <div className="filter-column">
                    <select
                      value={filter.column}
                      onChange={(e) =>
                        updateColumnFilter(index, { column: e.target.value })
                      }
                      className="filter-column-select"
                    >
                      {FILTERABLE_COLUMNS.map((column) => (
                        <option key={column.key} value={column.key}>
                          {column.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-operator">
                    <select
                      value={filter.operator}
                      onChange={(e) =>
                        updateColumnFilter(index, {
                          operator: e.target.value as FilterOperator
                        })
                      }
                      className="filter-operator-select"
                    >
                      {(() => {
                        const column = FILTERABLE_COLUMNS.find(
                          (col) => col.key === filter.column
                        );
                        const validOperators = column
                          ? getValidOperators(column.type)
                          : (['contains', 'equals'] as FilterOperator[]);

                        return validOperators.map((operator) => (
                          <option key={operator} value={operator}>
                            {getOperatorLabel(operator)}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                    <div className="filter-value">
                      {(() => {
                        const column = FILTERABLE_COLUMNS.find(
                          (col) => col.key === filter.column
                        );

                        if (column?.type === 'select' && column.options) {
                          return (
                            <select
                              value={filter.value}
                              onChange={(e) =>
                                updateColumnFilter(index, {
                                  value: e.target.value
                                })
                              }
                              className="filter-value-select"
                            >
                              <option value="">Select value...</option>
                              {column.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          );
                        } else if (column?.type === 'boolean') {
                          return (
                            <select
                              value={filter.value}
                              onChange={(e) =>
                                updateColumnFilter(index, {
                                  value: e.target.value
                                })
                              }
                              className="filter-value-select"
                            >
                              <option value="">Select status...</option>
                              <option value="true">Timed Out</option>
                              <option value="false">Active</option>
                            </select>
                          );
                        } else if (column?.type === 'date') {
                          return (
                            <input
                              type="date"
                              value={filter.value}
                              onChange={(e) =>
                                updateColumnFilter(index, {
                                  value: e.target.value
                                })
                              }
                              className="filter-value-input"
                            />
                          );
                        } else {
                          return (
                            <input
                              type="text"
                              value={filter.value}
                              onChange={(e) =>
                                updateColumnFilter(index, {
                                  value: e.target.value
                                })
                              }
                              placeholder="Enter filter value..."
                              className="filter-value-input"
                            />
                          );
                        }
                      })()}
                    </div>
                  )}

                  <div className="filter-actions">
                    <label className="filter-active-checkbox">
                      <input
                        type="checkbox"
                        checked={filter.active}
                        onChange={(e) =>
                          updateColumnFilter(index, {
                            active: e.target.checked
                          })
                        }
                      />
                      <span className="checkbox-label">Active</span>
                    </label>

                    <button
                      className="remove-filter-btn"
                      onClick={() => removeColumnFilter(index)}
                      title="Remove filter"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              {columnFilters.length === 0 && (
                <div className="no-filters-message">
                  No filters added yet. Select a column above to add your first
                  filter.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
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
                  onClick={
                    column.sortable ? () => handleSort(column.key) : undefined
                  }
                  title={column.sortable ? 'Click to sort' : undefined}
                >
                  {column.label}
                  {getSortIndicator(column.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="user-row">
                {/* Actions column */}
                <td className="actions-cell">
                  <InteractiveTooltip
                    content={
                      <UserActionsMenu
                        user={user}
                        onViewUser={handleViewUser}
                        onAssignRole={(user) => {
                          setRoleAssignmentUser(user);
                          setShowRoleModal(true);
                        }}
                        onManageSubscription={(user) => {
                          setSubscriptionAssignmentUser(user);
                          setShowSubscriptionModal(true);
                        }}
                        onExportData={(user) => {
                          setSelectedUser(user);
                          setShowExportModal(true);
                        }}
                        onTimeoutUser={handleTimeoutUser}
                        closeTooltip={() => {}} // Placeholder for now
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
                    <Avatar
                      seed={user.id}
                      size="sm"
                      enableTooltip={true}
                      tooltipScale={2}
                    />
                  </div>
                  <div className="user-details">
                    <div className="user-name-row">
                      <span className="user-name">
                        {user.name || 'Unnamed User'}
                      </span>
                    </div>
                    <div className="user-id-row">
                      <span className="user-id">ID: {user.id}</span>
                    </div>
                  </div>
                </td>

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

                {/* Status column - timeout status only */}
                <td className="status-cell">{getStatusBadge(user)}</td>

                {/* Plans column - subscription plans only */}
                <td className="plans-cell">{getPlansDisplay(user)}</td>

                {/* Timeout Details column */}
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
          <div className="infinite-scroll-loading">
            <div className="loading-spinner"></div>
            <span>Loading more users...</span>
          </div>
        )}

        {/* End of List Indicator for Infinite Scroll */}
        {paginationMode === 'infinite' &&
          !hasMoreUsers &&
          paginatedUsers.length > 0 && (
            <div className="infinite-scroll-end">
              <span>You&apos;ve reached the end of the list! 🎉</span>
            </div>
          )}
      </div>

      {/* Pagination - Show different content based on mode */}
      <div className="pagination">
        <div className="pagination-info-section">
          {paginationMode === 'traditional' ? (
            <>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <span className="results-info">
                {activeFiltersCount > 0 ? (
                  <>
                    Showing {paginatedUsers.length} of {filteredUsers.length}{' '}
                    filtered results
                    {filteredUsers.length !== users.length && (
                      <span className="total-results">
                        {' '}
                        (from {users.length} total)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Showing {paginatedUsers.length} of {users.length} users
                  </>
                )}
              </span>
            </>
          ) : (
            <span className="results-info">
              {activeFiltersCount > 0 ? (
                <>
                  Showing {paginatedUsers.length} of {filteredUsers.length}{' '}
                  filtered results
                  {filteredUsers.length !== users.length && (
                    <span className="total-results">
                      {' '}
                      (from {users.length} total)
                    </span>
                  )}
                  {hasMoreUsers && (
                    <span className="scroll-hint">
                      {' '}
                      • Scroll down to load more
                    </span>
                  )}
                </>
              ) : (
                <>
                  Showing {paginatedUsers.length} of {users.length} users
                  {hasMoreUsers && (
                    <span className="scroll-hint">
                      {' '}
                      • Scroll down to load more
                    </span>
                  )}
                </>
              )}
            </span>
          )}
        </div>

        {/* Traditional Pagination Controls */}
        {paginationMode === 'traditional' && (
          <div className="pagination-controls">
            <button
              className="btn btn--secondary"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Role Modal */}
      {showRoleModal && roleAssignmentUser && (
        <AssignRoleModal
          isOpen={showRoleModal}
          userName={roleAssignmentUser.name || 'Unknown User'}
          userId={roleAssignmentUser.id}
          onClose={() => {
            setShowRoleModal(false);
            setRoleAssignmentUser(null);
          }}
          onAssign={handleAssignRole}
        />
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && subscriptionAssignmentUser && (
        <AssignSubscriptionModal
          isOpen={showSubscriptionModal}
          userName={subscriptionAssignmentUser.name || 'Unknown User'}
          userId={subscriptionAssignmentUser.id}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSubscriptionAssignmentUser(null);
          }}
          onAssign={handleManageSubscription}
        />
      )}

      {/* Timeout Modal */}
      {showTimeoutModal && timeoutUser && (
        <TimeoutModal
          user={{
            id: timeoutUser.id,
            name: timeoutUser.name,
            email: timeoutUser.email
          }}
          isOpen={showTimeoutModal}
          onClose={() => {
            setShowTimeoutModal(false);
            setTimeoutUser(null);
          }}
          onTimeout={handleTimeoutSubmit}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setSelectedUser(null);
          }}
          users={activeFiltersCount > 0 ? filteredUsers : users}
          selectedUser={selectedUser}
        />
      )}

      {/* User Details Modal */}
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
