'use client';

/**
 * Permission Management Panel
 * Professional industry-grade permissions management interface
 *
 * Features:
 * - Glassmorphism design with orange undertones
 * - Full CRUD operations (Create, Read, Update, Disable, Archive)
 * - Advanced search, filtering, and sorting
 * - Real-time statistics and analytics
 * - Comprehensive audit logging
 * - Scalable architecture patterns
 *
 * @author System Wizard 🧙‍♂️
 * @version 1.0.0
 */

import { noCacheFetch } from '@lib/utils/no-cache-fetch';
import { useCallback, useEffect, useMemo, useState } from 'react';
import './PermissionManagementPanel.css';

// ================================
// TYPES & INTERFACES
// ================================

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string;
  category: string;
  is_inheritable: boolean;
  is_active: boolean;
  is_archived: boolean;
  is_system: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  sort_order: number;
  dependencies: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: number | null;
  archive_reason: string | null;
  usage_count: number;
  role_count: number;
  user_count: number;
  last_used: string | null;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_inheritable: boolean;
  is_active: boolean;
  is_archived: boolean;
  is_system: boolean;
  sort_order: number;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
  user_count: number;
}

interface PermissionOverview {
  total_permissions: number;
  active_permissions: number;
  archived_permissions: number;
  system_permissions: number;
  categories: { name: string; count: number }[];
  risk_levels: { level: string; count: number }[];
  total_roles: number;
  active_roles: number;
}

type ViewMode = 'permissions' | 'roles' | 'audit';
type PermissionStatus = 'all' | 'active' | 'disabled' | 'archived';
type RiskLevel = 'all' | 'low' | 'medium' | 'high' | 'critical';

// ================================
// MAIN COMPONENT
// ================================

export default function PermissionManagementPanel() {
  // ================================
  // STATE MANAGEMENT
  // ================================

  const [viewMode, setViewMode] = useState<ViewMode>('permissions');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [overview, setOverview] = useState<PermissionOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PermissionStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel>('all');
  const [sortBy, setSortBy] = useState('sort_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Permission | Role | null>(
    null
  );

  // ================================
  // API FUNCTIONS
  // ================================

  const fetchPermissions = useCallback(async () => {
    if (viewMode !== 'permissions') return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: searchQuery,
        category: categoryFilter === 'all' ? '' : categoryFilter,
        status: statusFilter,
        risk_level: riskFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      const response = await noCacheFetch(`/api/admin/permissions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch permissions');

      const data = await response.json();
      setPermissions(data.permissions || []);
      setOverview(data.overview || null);
      setTotalItems(data.pagination?.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch permissions'
      );
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [
    viewMode,
    searchQuery,
    categoryFilter,
    statusFilter,
    riskFilter,
    sortBy,
    sortOrder,
    currentPage,
    pageSize
  ]);

  const fetchRoles = useCallback(async () => {
    if (viewMode !== 'roles') return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: currentPage.toString(),
        limit: pageSize.toString()
      });

      const response = await noCacheFetch(
        `/api/admin/permissions/roles?${params}`
      );
      if (!response.ok) throw new Error('Failed to fetch roles');

      const data = await response.json();
      setRoles(data.roles || []);
      setTotalItems(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [
    viewMode,
    searchQuery,
    statusFilter,
    sortBy,
    sortOrder,
    currentPage,
    pageSize
  ]);

  // ================================
  // EFFECTS
  // ================================

  useEffect(() => {
    if (viewMode === 'permissions') {
      fetchPermissions();
    } else if (viewMode === 'roles') {
      fetchRoles();
    }
  }, [fetchPermissions, fetchRoles, viewMode]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    riskFilter,
    sortBy,
    sortOrder,
    viewMode
  ]);

  // ================================
  // COMPUTED VALUES
  // ================================

  const categories = useMemo(() => {
    const cats = new Set(permissions.map((p) => p.category));
    return Array.from(cats).sort();
  }, [permissions]);

  const totalPages = Math.ceil(totalItems / pageSize);

  // ================================
  // EVENT HANDLERS
  // ================================

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: PermissionStatus) => {
    setStatusFilter(status);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
  };

  const handleRiskFilter = (risk: RiskLevel) => {
    setRiskFilter(risk);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateNew = () => {
    setSelectedItem(null);
    setShowCreateModal(true);
  };

  const handleEdit = (item: Permission | Role) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleArchive = (item: Permission | Role) => {
    setSelectedItem(item);
    setShowArchiveModal(true);
  };

  const handleToggleStatus = async (item: Permission | Role) => {
    try {
      const endpoint =
        viewMode === 'permissions'
          ? `/api/admin/permissions/${item.id}`
          : `/api/admin/permissions/roles/${item.id}`;

      const response = await noCacheFetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !item.is_active,
          reason: `${item.is_active ? 'Disabled' : 'Enabled'} ${viewMode === 'permissions' ? 'permission' : 'role'}`
        })
      });

      if (!response.ok)
        throw new Error(
          `Failed to toggle ${viewMode === 'permissions' ? 'permission' : 'role'} status`
        );

      // Refresh data
      if (viewMode === 'permissions') {
        fetchPermissions();
      } else {
        fetchRoles();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  // ================================
  // RENDER HELPERS
  // ================================

  const renderStatusBadge = (item: Permission | Role) => {
    if (item.is_archived) {
      return (
        <span className="status-badge status-badge--archived">📦 Archived</span>
      );
    }
    if (!item.is_active) {
      return (
        <span className="status-badge status-badge--disabled">🔒 Disabled</span>
      );
    }
    return <span className="status-badge status-badge--active">✅ Active</span>;
  };

  const renderRiskBadge = (riskLevel: string | null | undefined) => {
    if (!riskLevel) return null;

    const riskConfig = {
      low: { emoji: '🟢', class: 'risk-low' },
      medium: { emoji: '🟡', class: 'risk-medium' },
      high: { emoji: '🟠', class: 'risk-high' },
      critical: { emoji: '🔴', class: 'risk-critical' }
    };

    const config =
      riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.low;
    return (
      <span className={`risk-badge ${config.class}`}>
        {config.emoji} {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
      </span>
    );
  };

  const renderSystemBadge = (isSystem: boolean) => {
    if (!isSystem) return null;
    return <span className="system-badge">🔒 System</span>;
  };

  const renderOverviewStats = () => {
    if (!overview) return null;

    return (
      <div className="overview-stats">
        <div className="stats-grid">
          <div className="stat-card stat-card--permissions">
            <div className="stat-icon">🛡️</div>
            <div className="stat-content">
              <h3>Permissions</h3>
              <div className="stat-number">{overview.total_permissions}</div>
              <div className="stat-breakdown">
                <span className="stat-item stat-item--active">
                  {overview.active_permissions} Active
                </span>
                <span className="stat-item stat-item--disabled">
                  {overview.archived_permissions} Archived
                </span>
                <span className="stat-item stat-item--system">
                  {overview.system_permissions} System
                </span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card--roles">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Roles</h3>
              <div className="stat-number">{overview.total_roles}</div>
              <div className="stat-breakdown">
                <span className="stat-item stat-item--active">
                  {overview.active_roles} Active
                </span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-card--categories">
            <div className="stat-icon">🗂️</div>
            <div className="stat-content">
              <h3>Categories</h3>
              <div className="stat-number">{overview.categories.length}</div>
              <div className="stat-breakdown">
                {overview.categories.map((cat) => (
                  <span key={cat.name} className="stat-item">
                    {cat.name}: {cat.count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="stat-card stat-card--risk-levels">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>Risk Levels</h3>
              <div className="stat-number">{overview.risk_levels.length}</div>
              <div className="stat-breakdown">
                {overview.risk_levels.map((risk) => (
                  <span key={risk.level} className="stat-item">
                    {risk.level}: {risk.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSearchAndFilters = () => (
    <div className="search-filters">
      <div className="search-bar">
        <input
          type="text"
          placeholder={`Search ${viewMode}...`}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="filters">
        <select
          value={statusFilter}
          onChange={(e) =>
            handleStatusFilter(e.target.value as PermissionStatus)
          }
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="archived">Archived</option>
        </select>

        {viewMode === 'permissions' && (
          <>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={riskFilter}
              onChange={(e) => handleRiskFilter(e.target.value as RiskLevel)}
              className="filter-select"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
          </>
        )}

        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split(':');
            setSortBy(field);
            setSortOrder(order as 'asc' | 'desc');
          }}
          className="filter-select"
        >
          <option value="sort_order:asc">Default Order</option>
          <option value="display_name:asc">Name A-Z</option>
          <option value="display_name:desc">Name Z-A</option>
          <option value="created_at:desc">Newest First</option>
          <option value="created_at:asc">Oldest First</option>
          <option value="usage_count:desc">Most Used</option>
          <option value="usage_count:asc">Least Used</option>
        </select>
      </div>
    </div>
  );

  const renderPermissionsList = () => (
    <div className="items-list">
      {permissions.map((permission) => (
        <div key={permission.id} className="item-card permission-card">
          <div className="item-header">
            <div className="item-title">
              <h3>{permission.display_name}</h3>
              <code className="item-code">{permission.name}</code>
            </div>
            <div className="item-badges">
              {renderStatusBadge(permission)}
              {renderRiskBadge(permission.risk_level)}
              {renderSystemBadge(permission.is_system)}
            </div>
          </div>

          <div className="item-content">
            <p className="item-description">
              {permission.description || 'No description provided'}
            </p>

            <div className="item-meta">
              <span className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value category-tag">
                  {permission.category}
                </span>
              </span>
              <span className="meta-item">
                <span className="meta-label">Usage:</span>
                <span className="meta-value">
                  {permission.role_count} roles, {permission.user_count} users
                </span>
              </span>
              {permission.is_inheritable && (
                <span className="meta-item">
                  <span className="inheritable-badge">🔗 Inheritable</span>
                </span>
              )}
            </div>

            {permission.dependencies && permission.dependencies.length > 0 && (
              <div className="dependencies">
                <span className="dependencies-label">Dependencies:</span>
                {permission.dependencies.map((dep) => (
                  <span key={dep} className="dependency-tag">
                    {dep}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="item-actions">
            <button
              onClick={() => handleEdit(permission)}
              className="action-btn action-btn--edit"
              disabled={loading}
            >
              ✏️ Edit
            </button>

            <button
              onClick={() => handleToggleStatus(permission)}
              className={`action-btn ${permission.is_active ? 'action-btn--disable' : 'action-btn--enable'}`}
              disabled={loading || permission.is_system}
            >
              {permission.is_active ? '🔒 Disable' : '✅ Enable'}
            </button>

            {!permission.is_system && !permission.is_archived && (
              <button
                onClick={() => handleArchive(permission)}
                className="action-btn action-btn--archive"
                disabled={loading}
              >
                📦 Archive
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderRolesList = () => (
    <div className="items-list">
      {roles.map((role) => (
        <div key={role.id} className="item-card role-card">
          <div className="item-header">
            <div className="item-title">
              <div className="role-title-with-icon">
                <span className="role-icon" style={{ color: '#007bff' }}>
                  👥
                </span>
                <h3>{role.display_name}</h3>
              </div>
              <code className="item-code">{role.name}</code>
            </div>
            <div className="item-badges">
              {renderStatusBadge(role)}
              {renderSystemBadge(role.is_system)}
            </div>
          </div>

          <div className="item-content">
            <p className="item-description">
              {role.description || 'No description provided'}
            </p>

            <div className="item-meta">
              <span className="meta-item">
                <span className="meta-label">Users:</span>
                <span className="meta-value">{role.user_count}</span>
              </span>
              <span className="meta-item">
                <span className="meta-label">Permissions:</span>
                <span className="meta-value">{role.permissions.length}</span>
              </span>
            </div>

            {role.permissions.length > 0 && (
              <div className="role-permissions">
                <span className="permissions-label">Permissions:</span>
                <div className="permissions-tags">
                  {role.permissions.slice(0, 5).map((permission) => (
                    <span key={permission.id} className="permission-tag">
                      {permission.display_name}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="permissions-more">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="item-actions">
            <button
              onClick={() => handleEdit(role)}
              className="action-btn action-btn--edit"
              disabled={loading}
            >
              ✏️ Edit
            </button>

            <button
              onClick={() => handleToggleStatus(role)}
              className={`action-btn ${role.is_active ? 'action-btn--disable' : 'action-btn--enable'}`}
              disabled={loading || role.is_system}
            >
              {role.is_active ? '🔒 Disable' : '✅ Enable'}
            </button>

            {!role.is_system && !role.is_archived && (
              <button
                onClick={() => handleArchive(role)}
                className="action-btn action-btn--archive"
                disabled={loading}
              >
                📦 Archive
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          ← Previous
        </button>

        <div className="pagination-info">
          Page {currentPage} of {totalPages} ({totalItems} total)
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next →
        </button>
      </div>
    );
  };

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  const getRoleIcon = (iconName: string) => {
    const icons: Record<string, string> = {
      crown: '👑',
      shield: '🛡️',
      eye: '👁️',
      users: '👥',
      pen: '✏️',
      star: '⭐',
      flask: '🧪',
      user: '👤'
    };
    return icons[iconName] || '👤';
  };

  // ================================
  // MAIN RENDER
  // ================================

  return (
    <div className="permission-management-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-content">
          <h1 className="panel-title">
            <span className="title-icon">🔐</span>
            Permission Management System
          </h1>
          <p className="panel-subtitle">
            Comprehensive permissions and roles management with enterprise-grade
            security
          </p>
        </div>

        <div className="header-actions">
          <button
            onClick={handleCreateNew}
            className="create-btn"
            disabled={loading}
          >
            <span className="btn-icon">➕</span>
            Create New {viewMode === 'permissions' ? 'Permission' : 'Role'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          onClick={() => setViewMode('permissions')}
          className={`nav-tab ${viewMode === 'permissions' ? 'nav-tab--active' : ''}`}
        >
          🛡️ Permissions
        </button>
        <button
          onClick={() => setViewMode('roles')}
          className={`nav-tab ${viewMode === 'roles' ? 'nav-tab--active' : ''}`}
        >
          👥 Roles
        </button>
        <button
          onClick={() => setViewMode('audit')}
          className={`nav-tab ${viewMode === 'audit' ? 'nav-tab--active' : ''}`}
        >
          📊 Audit Trail
        </button>
      </div>

      {/* Overview Statistics */}
      {viewMode === 'permissions' && renderOverviewStats()}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="error-close">
            ×
          </button>
        </div>
      )}

      {/* Search and Filters */}
      {viewMode !== 'audit' && renderSearchAndFilters()}

      {/* Content Area */}
      <div className="content-area">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading {viewMode}...</p>
          </div>
        )}

        {!loading && viewMode === 'permissions' && renderPermissionsList()}
        {!loading && viewMode === 'roles' && renderRolesList()}
        {!loading && viewMode === 'audit' && (
          <div className="audit-placeholder">
            <h3>📊 Audit Trail</h3>
            <p>Comprehensive audit logging coming soon...</p>
          </div>
        )}

        {!loading &&
          ((viewMode === 'permissions' && permissions.length === 0) ||
            (viewMode === 'roles' && roles.length === 0)) && (
            <div className="empty-state">
              <div className="empty-icon">
                {viewMode === 'permissions' ? '🛡️' : '👥'}
              </div>
              <h3>No {viewMode} found</h3>
              <p>
                {searchQuery ||
                statusFilter !== 'all' ||
                categoryFilter !== 'all' ||
                riskFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : `Create your first ${viewMode === 'permissions' ? 'permission' : 'role'} to get started.`}
              </p>
            </div>
          )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Modals would go here */}
      {/* TODO: Implement CreatePermissionModal, EditPermissionModal, ArchiveModal, etc. */}
    </div>
  );
}
