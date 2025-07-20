'use client';

/**
 * Custom Alerts Management Panel
 *
 * Provides comprehensive admin interface for managing custom alerts:
 * - Create, edit, delete, and disable custom alerts
 * - Targeting options (all users, authenticated, subscribers, admins, roles, specific users)
 * - Scheduling and priority management
 * - Analytics and performance tracking
 *
 * @version 1.0.0
 * @author System Wizard 🧙‍♂️
 */

import { noCacheFetch } from '@lib/utils/no-cache-fetch';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AlertStatusTooltip } from './AlertStatusTooltip';
import './CustomAlertsPanel.css';

// Force logging function to bypass console silencer
const forceLog = (
  message: string,
  data?: any,
  level: 'info' | 'warn' | 'error' | 'debug' = 'info'
) => {
  if (typeof window !== 'undefined' && (window as any).__originalConsole) {
    const logMethod =
      (window as any).__originalConsole[level] ||
      (window as any).__originalConsole.log;
    logMethod(message, data);
  }
};

// ================================
// TYPES & INTERFACES
// ================================

interface CustomAlert {
  id: number;
  title: string;
  message?: string;
  details?: string;
  alert_type:
    | 'info'
    | 'warning'
    | 'error'
    | 'success'
    | 'maintenance'
    | 'custom';
  target_audience:
    | 'all'
    | 'authenticated'
    | 'subscribers'
    | 'admins'
    | 'role_based'
    | 'specific_users';
  target_roles?: string[];
  target_users?: number[];
  priority: number;
  icon?: string;
  dismissible: boolean;
  persistent: boolean;
  start_date?: string;
  end_date?: string;
  expires_at?: string;
  is_active: boolean;
  is_published: boolean;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  metadata?: Record<string, any>;
  created_by_name?: string;
  updated_by_name?: string;
}

interface AlertFormData {
  title: string;
  message: string;
  details: string;
  alert_type: CustomAlert['alert_type'];
  target_audience: CustomAlert['target_audience'];
  target_roles: string[];
  target_users: string;
  priority: number;
  icon: string;
  dismissible: boolean;
  persistent: boolean;
  start_date: string;
  end_date: string;
  expires_at: string;
  is_active: boolean;
  is_published: boolean;
}

// Helper function to create a stable key for alert comparison
const createAlertKey = (alert: CustomAlert): string => {
  return `${alert.id}-${alert.title}-${alert.is_active}-${alert.is_published}-${alert.updated_at}`;
};

// Helper function to check if two alert arrays are equivalent
const areAlertsEqual = (prev: CustomAlert[], next: CustomAlert[]): boolean => {
  if (prev.length !== next.length) return false;

  const prevKeys = prev.map(createAlertKey).sort();
  const nextKeys = next.map(createAlertKey).sort();

  return prevKeys.every((key, index) => key === nextKeys[index]);
};

// ================================
// MAIN COMPONENT
// ================================

export default function CustomAlertsPanel() {
  const [alerts, setAlerts] = useState<CustomAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<CustomAlert | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');
  const lastFetchRef = useRef<string>(''); // Track last successful fetch signature
  const [formData, setFormData] = useState<AlertFormData>({
    title: '',
    message: '',
    details: '',
    alert_type: 'info',
    target_audience: 'all',
    target_roles: [],
    target_users: '',
    priority: 0,
    icon: '',
    dismissible: true,
    persistent: false,
    start_date: '',
    end_date: '',
    expires_at: '',
    is_active: true,
    is_published: false
  });

  // ================================
  // DATA FETCHING
  // ================================

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);

      const response = await noCacheFetch('/api/admin/alerts');

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage =
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const newAlerts = Array.isArray(data.alerts)
        ? data.alerts
        : Array.isArray(data)
          ? data
          : [];

      forceLog('🧙‍♂️ Raw API response:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        hasAlertsProperty: 'alerts' in data,
        alertCount: newAlerts.length,
        firstAlertId: newAlerts[0]?.id,
        firstAlertTitle: newAlerts[0]?.title,
        firstAlertUpdated: newAlerts[0]?.updated_at
      });

      // Create a signature of the current fetch to compare with previous
      const currentSignature = JSON.stringify(
        newAlerts.map(createAlertKey).sort()
      );

      // Only update state if data actually changed
      if (lastFetchRef.current !== currentSignature) {
        lastFetchRef.current = currentSignature;
        setAlerts(newAlerts);
      }

      // Only set loading to false on first successful load
      if (loading) {
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      if (loading) {
        setLoading(false);
      }
    }
  }, [loading]);

  // ================================
  // POLLING FOR UPDATES (OPTIMIZED)
  // ================================

  // Smart polling that only updates when data changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchAlerts();
      }
    }, 15000); // Poll every 15 seconds (increased from 10 for less aggressive polling)

    return () => clearInterval(interval);
  }, [loading, fetchAlerts]);

  // ================================
  // INITIAL DATA LOADING
  // ================================

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // ================================
  // FORM HANDLERS
  // ================================

  const handleInputChange = (field: keyof AlertFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      details: '',
      alert_type: 'info',
      target_audience: 'all',
      target_roles: [],
      target_users: '',
      priority: 0,
      icon: '',
      dismissible: true,
      persistent: false,
      start_date: '',
      end_date: '',
      expires_at: '',
      is_active: true,
      is_published: false
    });
    setEditingAlert(null);
  };

  const handleEdit = (alert: CustomAlert) => {
    setEditingAlert(alert);

    // Safely handle target_users - could be array, string, or undefined
    let targetUsersString = '';
    if (alert.target_users) {
      if (Array.isArray(alert.target_users)) {
        targetUsersString = alert.target_users.join(', ');
      } else if (typeof alert.target_users === 'string') {
        targetUsersString = alert.target_users;
      } else {
        // Handle case where it might be a single number or other type
        targetUsersString = String(alert.target_users);
      }
    }

    // Safely handle target_roles - could be array, string, or undefined
    let targetRolesArray: string[] = [];
    if (alert.target_roles) {
      if (Array.isArray(alert.target_roles)) {
        targetRolesArray = alert.target_roles;
      } else if (typeof alert.target_roles === 'string') {
        try {
          // Try to parse as JSON if it's a string
          const parsed = JSON.parse(alert.target_roles);
          targetRolesArray = Array.isArray(parsed) ? parsed : [];
        } catch {
          // If not JSON, treat as single role
          targetRolesArray = [alert.target_roles];
        }
      }
    }

    setFormData({
      title: alert.title,
      message: alert.message || '',
      details: alert.details || '',
      alert_type: alert.alert_type,
      target_audience: alert.target_audience,
      target_roles: targetRolesArray,
      target_users: targetUsersString,
      priority: alert.priority,
      icon: alert.icon || '',
      dismissible: alert.dismissible,
      persistent: alert.persistent,
      start_date: alert.start_date
        ? new Date(alert.start_date).toISOString().slice(0, 16)
        : '',
      end_date: alert.end_date
        ? new Date(alert.end_date).toISOString().slice(0, 16)
        : '',
      expires_at: alert.expires_at
        ? new Date(alert.expires_at).toISOString().slice(0, 16)
        : '',
      is_active: alert.is_active,
      is_published: alert.is_published
    });
    setShowCreateModal(true);
  };

  // ================================
  // CRUD OPERATIONS
  // ================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        target_roles: Array.isArray(formData.target_roles)
          ? formData.target_roles
          : formData.target_roles
            ? [formData.target_roles]
            : [],
        target_users: formData.target_users
          ? formData.target_users
              .split(',')
              .map((id) => parseInt(id.trim()))
              .filter((id) => !isNaN(id))
          : [],
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        expires_at: formData.expires_at || undefined
      };

      const url = editingAlert
        ? `/api/admin/alerts/${editingAlert.id}`
        : '/api/admin/alerts';
      const method = editingAlert ? 'PUT' : 'POST';

      forceLog('🧙‍♂️ Submitting alert:', { url, method, payload });

      const response = await noCacheFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      forceLog('🧙‍♂️ Response status:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        let errorData;
        const responseText = await response.text();
        forceLog('🧙‍♂️ Error response text:', responseText);

        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = {
            error:
              responseText || `HTTP ${response.status}: ${response.statusText}`
          };
        }

        let errorMessage =
          errorData.error || errorData.message || 'Failed to save alert';

        // If validation failed, include details
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map(
              (detail: any) => `${detail.path?.join('.')}: ${detail.message}`
            )
            .join(', ');
          errorMessage += ` - ${validationErrors}`;
        }

        forceLog('🧙‍♂️ Save error:', { errorMessage, errorData }, 'error');
        throw new Error(errorMessage);
      }

      // Clear banner cache and refresh
      if (typeof window !== 'undefined' && (window as any).__refreshBanners) {
        (window as any).__refreshBanners();
      }

      await fetchAlerts();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save alert';
      forceLog('🧙‍♂️ Submit error:', { errorMessage, err }, 'error');
      setError(errorMessage);
    }
  };

  const handleDelete = async (alertId: number) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      const response = await noCacheFetch(`/api/admin/alerts/${alertId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }

      // Clear banner cache and refresh
      if (typeof window !== 'undefined' && (window as any).__refreshBanners) {
        (window as any).__refreshBanners();
      }

      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert');
    }
  };

  const handleToggleStatus = async (
    alert: CustomAlert,
    field: 'is_active' | 'is_published'
  ) => {
    try {
      const response = await noCacheFetch(`/api/admin/alerts/${alert.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          [field]: !alert[field]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update alert ${field}`);
      }

      // Clear banner cache and refresh
      if (typeof window !== 'undefined' && (window as any).__refreshBanners) {
        (window as any).__refreshBanners();
      }

      // Force cache reset so fetchAlerts will update
      lastFetchRef.current = '';
      await fetchAlerts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to update alert ${field}`
      );
    }
  };

  // ================================
  // UTILITY FUNCTIONS (MEMOIZED)
  // ================================

  const getAlertTypeIcon = useCallback((type: CustomAlert['alert_type']) => {
    const icons = {
      info: '💡',
      warning: '⚠️',
      error: '❌',
      success: '✅',
      maintenance: '🔧',
      custom: '🎨'
    };
    return icons[type];
  }, []);

  const getTargetAudienceLabel = useCallback(
    (audience: CustomAlert['target_audience']) => {
      const labels = {
        all: 'All Users',
        authenticated: 'Authenticated Users',
        subscribers: 'Subscribers',
        admins: 'Administrators',
        role_based: 'Role-Based',
        specific_users: 'Specific Users'
      };
      return labels[audience];
    },
    []
  );

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Memoize sorted alerts to prevent unnecessary re-sorts
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [alerts]);

  // ================================
  // RENDER
  // ================================

  if (loading) {
    return (
      <div className="custom-alerts-panel">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading custom alerts...</p>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--light-bg__text-color--secondary)',
              marginTop: '1rem'
            }}
          >
            Debug: Fetching from /api/admin/alerts...
          </p>
        </div>
      </div>
    );
  }

  // Show ANY error prominently for debugging
  if (error) {
    return (
      <div className="custom-alerts-panel">
        <div className="loading-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h3 style={{ color: 'var(--error)', marginBottom: '1rem' }}>
            Error Loading Alerts
          </h3>
          <div
            style={{
              background: 'var(--error-background)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--border-radius)',
              padding: '1rem',
              marginBottom: '1rem',
              textAlign: 'left',
              maxWidth: '600px'
            }}
          >
            <strong>Error Details:</strong>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem',
                margin: '0.5rem 0 0 0',
                color: 'var(--error)'
              }}
            >
              {error}
            </pre>
          </div>
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
          >
            <button
              className="btn btn-primary"
              onClick={() => {
                setError(null);
                fetchAlerts();
              }}
            >
              🔄 Retry
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => (window.location.href = '/api/auth/signin')}
            >
              🔑 Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication error prominently
  if (
    error &&
    (error.includes('Unauthorized') ||
      error.includes('Authentication required'))
  ) {
    return (
      <div className="custom-alerts-panel">
        <div className="loading-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <h3 style={{ color: 'var(--error)', marginBottom: '1rem' }}>
            Authentication Required
          </h3>
          <p style={{ marginBottom: '1rem' }}>
            You need to log in to access the admin panel.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = '/api/auth/signin')}
          >
            🔑 Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show admin access error
  if (error && error.includes('Admin access required')) {
    return (
      <div className="custom-alerts-panel">
        <div className="loading-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
          <h3 style={{ color: 'var(--error)', marginBottom: '1rem' }}>
            Admin Access Required
          </h3>
          <p style={{ marginBottom: '1rem' }}>
            You don&apos;t have permission to access this admin feature.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => (window.location.href = '/')}
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-alerts-panel">
      <div className="panel-header">
        <h2>Custom Alerts Management 🎯</h2>
        <p>Create, edit, and manage custom alerts for different user groups</p>
        {lastRefreshTime && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--light-bg__text-color--secondary)'
            }}
          >
            Last refreshed: {lastRefreshTime}
          </p>
        )}
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Create New Alert
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="alerts-grid">
        {Array.isArray(sortedAlerts) &&
          sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card alert-card--${alert.alert_type}`}
            >
              <div className="alert-card__header">
                <div className="alert-card__title">
                  <span className="alert-icon">
                    {alert.icon || getAlertTypeIcon(alert.alert_type)}
                  </span>
                  <h3>{alert.title}</h3>
                </div>
                <div className="alert-card__actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(alert)}
                    title="Edit alert"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(alert.id)}
                    title="Delete alert"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="alert-card__content">
                {alert.message && (
                  <p className="alert-message">{alert.message}</p>
                )}

                <div className="alert-meta">
                  <div className="meta-item">
                    <strong>Target:</strong>{' '}
                    {getTargetAudienceLabel(alert.target_audience)}
                  </div>
                  <div className="meta-item">
                    <strong>Priority:</strong> {alert.priority}
                  </div>
                  <div className="meta-item">
                    <strong>Created:</strong> {formatDate(alert.created_at)}
                  </div>
                  {alert.created_by_name && (
                    <div className="meta-item">
                      <strong>By:</strong> {alert.created_by_name}
                    </div>
                  )}
                </div>

                <div className="alert-status">
                  <label className="status-toggle">
                    <input
                      type="checkbox"
                      checked={alert.is_active}
                      onChange={() => handleToggleStatus(alert, 'is_active')}
                    />
                    <span className="toggle-slider"></span>
                    <AlertStatusTooltip
                      type="active"
                      isActive={alert.is_active}
                      isPublished={alert.is_published}
                    >
                      <span>Active</span>
                    </AlertStatusTooltip>
                  </label>
                  <label className="status-toggle">
                    <input
                      type="checkbox"
                      checked={alert.is_published}
                      onChange={() => handleToggleStatus(alert, 'is_published')}
                    />
                    <span className="toggle-slider"></span>
                    <AlertStatusTooltip
                      type="published"
                      isActive={alert.is_active}
                      isPublished={alert.is_published}
                    >
                      <span>Published</span>
                    </AlertStatusTooltip>
                  </label>
                </div>
              </div>
            </div>
          ))}
      </div>

      {Array.isArray(sortedAlerts) && sortedAlerts.length === 0 && (
        <div className="empty-state">
          <h3>No Custom Alerts Yet 📢</h3>
          <p>
            Create your first custom alert to start engaging with your users!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Create First Alert
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingAlert ? 'Edit Alert' : 'Create New Alert'}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="alert-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="alert_type">Type</label>
                  <select
                    id="alert_type"
                    value={formData.alert_type}
                    onChange={(e) =>
                      handleInputChange('alert_type', e.target.value)
                    }
                  >
                    <option value="info">Info 💡</option>
                    <option value="warning">Warning ⚠️</option>
                    <option value="error">Error ❌</option>
                    <option value="success">Success ✅</option>
                    <option value="maintenance">Maintenance 🔧</option>
                    <option value="custom">Custom 🎨</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      handleInputChange('priority', parseInt(e.target.value))
                    }
                    min={-100}
                    max={100}
                  />
                  <small>Higher numbers show first (-100 to 100)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="icon">Icon (Emoji)</label>
                  <input
                    id="icon"
                    type="text"
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    maxLength={20}
                    placeholder="🎉"
                  />
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange('message', e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div className="form-group form-group--full">
                  <label htmlFor="details">Details</label>
                  <textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) =>
                      handleInputChange('details', e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="target_audience">Target Audience</label>
                  <select
                    id="target_audience"
                    value={formData.target_audience}
                    onChange={(e) =>
                      handleInputChange('target_audience', e.target.value)
                    }
                  >
                    <option value="all">All Users</option>
                    <option value="authenticated">Authenticated Users</option>
                    <option value="subscribers">Subscribers</option>
                    <option value="admins">Administrators</option>
                    <option value="role_based">Role-Based</option>
                    <option value="specific_users">Specific Users</option>
                  </select>
                </div>

                {formData.target_audience === 'specific_users' && (
                  <div className="form-group">
                    <label htmlFor="target_users">User IDs</label>
                    <input
                      id="target_users"
                      type="text"
                      value={formData.target_users}
                      onChange={(e) =>
                        handleInputChange('target_users', e.target.value)
                      }
                      placeholder="1, 2, 3"
                    />
                    <small>Comma-separated user IDs</small>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="start_date">Start Date</label>
                  <input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) =>
                      handleInputChange('start_date', e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end_date">End Date</label>
                  <input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) =>
                      handleInputChange('end_date', e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expires_at">Auto-Dismiss At</label>
                  <input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) =>
                      handleInputChange('expires_at', e.target.value)
                    }
                  />
                </div>

                <div className="form-group form-group--checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.dismissible}
                      onChange={(e) =>
                        handleInputChange('dismissible', e.target.checked)
                      }
                    />
                    Dismissible
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.persistent}
                      onChange={(e) =>
                        handleInputChange('persistent', e.target.checked)
                      }
                    />
                    Persistent (survives page reloads)
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        handleInputChange('is_active', e.target.checked)
                      }
                    />
                    <AlertStatusTooltip
                      type="active"
                      isActive={formData.is_active}
                      isPublished={formData.is_published}
                    >
                      <span>Active</span>
                    </AlertStatusTooltip>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) =>
                        handleInputChange('is_published', e.target.checked)
                      }
                    />
                    <AlertStatusTooltip
                      type="published"
                      isActive={formData.is_active}
                      isPublished={formData.is_published}
                    >
                      <span>Published</span>
                    </AlertStatusTooltip>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAlert ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
