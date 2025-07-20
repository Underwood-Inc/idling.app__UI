/**
 * Global Guest Quota Management Panel
 *
 * Admin interface for managing global quota settings for anonymous/guest users
 * with feature-level granularity and real-time updates.
 *
 * @version 1.0.0
 * @author System
 */

import { noCacheFetch } from '@lib/utils/no-cache-fetch';
import React, { useCallback, useEffect, useState } from 'react';
import './GlobalGuestQuotaPanel.css';

// ================================
// TYPES & INTERFACES
// ================================

interface GlobalGuestQuota {
  id: number;
  service_name: string;
  feature_name: string;
  quota_limit: number;
  is_unlimited: boolean;
  reset_period: string;
  is_active: boolean;
  description: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  service_display_name?: string;
  feature_display_name?: string;
}

interface ServiceFeature {
  service_name: string;
  service_display_name: string;
  feature_name: string;
  feature_display_name: string;
  feature_type: string;
  current_quota: number | null;
  is_unlimited: boolean;
  reset_period: string;
  is_active: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// ================================
// MAIN COMPONENT
// ================================

export default function GlobalGuestQuotaPanel(): React.JSX.Element {
  // State management
  const [quotas, setQuotas] = useState<GlobalGuestQuota[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<ServiceFeature[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuota, setEditingQuota] = useState<GlobalGuestQuota | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Form state for creating/editing quotas
  const [formData, setFormData] = useState({
    service_name: '',
    feature_name: '',
    quota_limit: 1,
    is_unlimited: false,
    reset_period: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    description: '',
    is_active: true
  });

  // ================================
  // DATA FETCHING
  // ================================

  const fetchQuotas = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await noCacheFetch('/api/admin/quotas/global', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result: ApiResponse<{
        quotas: GlobalGuestQuota[];
        available_features: ServiceFeature[];
      }> = await response.json();

      if (result.success) {
        setQuotas(result.data.quotas);
        setAvailableFeatures(result.data.available_features);
      } else {
        setError(result.error || 'Failed to fetch global quotas');
      }
    } catch (err) {
      console.error('Error fetching global quotas:', err);
      setError('Network error while fetching quotas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotas();
  }, [fetchQuotas]);

  // ================================
  // CRUD OPERATIONS
  // ================================

  const handleCreateQuota = async (): Promise<void> => {
    try {
      const response = await noCacheFetch('/api/admin/quotas/global', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result: ApiResponse<{ quota: GlobalGuestQuota }> =
        await response.json();

      if (result.success) {
        await fetchQuotas(); // Refresh the list
        setShowCreateForm(false);
        resetForm();
        setError(null);
      } else {
        setError(result.error || 'Failed to create quota');
      }
    } catch (err) {
      console.error('Error creating quota:', err);
      setError('Network error while creating quota');
    }
  };

  const handleUpdateQuota = async (quotaId: number): Promise<void> => {
    if (!editingQuota) return;

    try {
      const updateData = {
        quota_limit: editingQuota.is_unlimited
          ? undefined
          : editingQuota.quota_limit,
        is_unlimited: editingQuota.is_unlimited,
        reset_period: editingQuota.reset_period,
        description: editingQuota.description || '',
        is_active: editingQuota.is_active
      };

      const response = await noCacheFetch(
        `/api/admin/quotas/global/${quotaId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );

      const result: ApiResponse<{ quota: GlobalGuestQuota }> =
        await response.json();

      if (result.success) {
        await fetchQuotas(); // Refresh the list
        setEditingQuota(null);
        setError(null);
      } else {
        setError(result.error || 'Failed to update quota');
      }
    } catch (err) {
      console.error('Error updating quota:', err);
      setError('Network error while updating quota');
    }
  };

  const handleDeleteQuota = async (quotaId: number): Promise<void> => {
    if (
      !confirm(
        'Are you sure you want to delete this global quota? This will remove quota limits for this service/feature for all guest users.'
      )
    ) {
      return;
    }

    try {
      const response = await noCacheFetch(
        `/api/admin/quotas/global/${quotaId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      const result: ApiResponse<{ deleted: boolean }> = await response.json();

      if (result.success) {
        await fetchQuotas(); // Refresh the list
        setError(null);
      } else {
        setError(result.error || 'Failed to delete quota');
      }
    } catch (err) {
      console.error('Error deleting quota:', err);
      setError('Network error while deleting quota');
    }
  };

  // ================================
  // FORM HELPERS
  // ================================

  const resetForm = (): void => {
    setFormData({
      service_name: '',
      feature_name: '',
      quota_limit: 1,
      is_unlimited: false,
      reset_period: 'daily',
      description: '',
      is_active: true
    });
  };

  const getAvailableFeaturesForService = (
    serviceName: string
  ): ServiceFeature[] => {
    return availableFeatures.filter((f) => f.service_name === serviceName);
  };

  const getUniqueServices = (): ServiceFeature[] => {
    const serviceMap = new Map<string, ServiceFeature>();
    availableFeatures.forEach((feature) => {
      if (!serviceMap.has(feature.service_name)) {
        serviceMap.set(feature.service_name, feature);
      }
    });
    return Array.from(serviceMap.values());
  };

  // ================================
  // RENDER METHODS
  // ================================

  const renderCreateForm = (): React.JSX.Element => (
    <div
      style={{
        background: 'var(--glass-overlay-medium, var(--glass-bg-medium))',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border:
          '1px solid var(--glass-border-overlay-medium, var(--glass-border-medium))',
        backdropFilter: 'var(--glass-blur-medium)',
        WebkitBackdropFilter: 'var(--glass-blur-medium)',
        boxShadow: 'var(--glass-shadow-medium)'
      }}
    >
      <h3
        style={{
          color: 'var(--dark-bg__text-color--primary)',
          marginBottom: '15px'
        }}
      >
        🎯 Create Global Guest Quota
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}
      >
        <div>
          <label
            style={{ color: 'white', display: 'block', marginBottom: '5px' }}
          >
            Service:
          </label>
          <select
            value={formData.service_name}
            onChange={(e) =>
              setFormData({
                ...formData,
                service_name: e.target.value,
                feature_name: ''
              })
            }
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none'
            }}
          >
            <option value="">Select Service</option>
            {getUniqueServices().map((service) => (
              <option key={service.service_name} value={service.service_name}>
                {service.service_display_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{ color: 'white', display: 'block', marginBottom: '5px' }}
          >
            Feature:
          </label>
          <select
            value={formData.feature_name}
            onChange={(e) =>
              setFormData({ ...formData, feature_name: e.target.value })
            }
            disabled={!formData.service_name}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none'
            }}
          >
            <option value="">Select Feature</option>
            {getAvailableFeaturesForService(formData.service_name).map(
              (feature) => (
                <option key={feature.feature_name} value={feature.feature_name}>
                  {feature.feature_display_name}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label
            style={{ color: 'white', display: 'block', marginBottom: '5px' }}
          >
            Quota Limit:
          </label>
          <input
            type="number"
            value={formData.quota_limit}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              setFormData({
                ...formData,
                quota_limit: value,
                is_unlimited: value === 0
              });
            }}
            min="0"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none'
            }}
            placeholder="Enter 0 for unlimited"
          />
          <small
            style={{
              color: '#ccc',
              fontSize: '12px',
              marginTop: '2px',
              display: 'block'
            }}
          >
            💡 Enter 0 for unlimited quota
          </small>
        </div>

        <div>
          <label
            style={{ color: 'white', display: 'block', marginBottom: '5px' }}
          >
            Reset Period:
          </label>
          <select
            value={formData.reset_period}
            onChange={(e) =>
              setFormData({ ...formData, reset_period: e.target.value as any })
            }
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none'
            }}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label
          style={{ color: 'white', display: 'block', marginBottom: '5px' }}
        >
          Description (optional):
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: 'none'
          }}
          placeholder="Optional description for this quota"
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleCreateQuota}
          disabled={!formData.service_name || !formData.feature_name}
          style={{
            background:
              formData.service_name && formData.feature_name
                ? '#4CAF50'
                : '#666',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor:
              formData.service_name && formData.feature_name
                ? 'pointer'
                : 'not-allowed'
          }}
        >
          ✅ Create Quota
        </button>
        <button
          onClick={() => {
            setShowCreateForm(false);
            resetForm();
          }}
          style={{
            background: '#f44336',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );

  const renderQuotaList = (): React.JSX.Element => (
    <div>
      <h3 style={{ marginBottom: '15px' }}>📊 Current Global Guest Quotas</h3>

      {quotas.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          No global guest quotas configured. Guest users will use system
          defaults.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {quotas.map((quota) => (
            <div
              key={quota.id}
              style={{
                background: quota.is_active
                  ? 'var(--glass-overlay-medium, var(--glass-bg-medium))'
                  : 'var(--glass-overlay-light, var(--glass-bg-light))',
                padding: '15px',
                borderRadius: '8px',
                border: `1px solid ${
                  quota.is_active
                    ? 'var(--glass-border-overlay-medium, var(--glass-border-medium))'
                    : 'var(--glass-border-overlay-light, var(--glass-border-light))'
                }`,
                backdropFilter: 'var(--glass-blur-medium)',
                WebkitBackdropFilter: 'var(--glass-blur-medium)',
                boxShadow: quota.is_active
                  ? 'var(--glass-shadow-medium)'
                  : 'var(--glass-shadow-light)'
              }}
            >
              {editingQuota?.id === quota.id ? (
                <div>
                  <h4 style={{ marginBottom: '10px' }}>
                    🔧 Editing: {quota.service_display_name} -{' '}
                    {quota.feature_display_name}
                  </h4>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '10px',
                      marginBottom: '10px'
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold'
                        }}
                      >
                        Quota Limit:
                      </label>
                      <input
                        type="number"
                        value={
                          editingQuota.quota_limit === -1
                            ? 0
                            : editingQuota.quota_limit
                        }
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setEditingQuota({
                            ...editingQuota,
                            quota_limit: value,
                            is_unlimited: value === 0
                          });
                        }}
                        min="0"
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                        placeholder="Enter 0 for unlimited"
                      />
                      <small
                        style={{
                          color: '#666',
                          fontSize: '11px',
                          marginTop: '2px',
                          display: 'block'
                        }}
                      >
                        💡 Enter 0 for unlimited quota
                      </small>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold'
                        }}
                      >
                        Reset Period:
                      </label>
                      <select
                        value={editingQuota.reset_period}
                        onChange={(e) =>
                          setEditingQuota({
                            ...editingQuota,
                            reset_period: e.target.value
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ccc'
                        }}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '5px',
                          fontWeight: 'bold'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editingQuota.is_active}
                          onChange={(e) =>
                            setEditingQuota({
                              ...editingQuota,
                              is_active: e.target.checked
                            })
                          }
                          style={{ marginRight: '5px' }}
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: 'bold'
                      }}
                    >
                      Description:
                    </label>
                    <input
                      type="text"
                      value={editingQuota.description || ''}
                      onChange={(e) =>
                        setEditingQuota({
                          ...editingQuota,
                          description: e.target.value
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                      }}
                      placeholder="Optional description"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleUpdateQuota(quota.id)}
                      style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      💾 Save Changes
                    </button>
                    <button
                      onClick={() => setEditingQuota(null)}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '10px'
                    }}
                  >
                    <h4 style={{ margin: 0 }}>
                      {quota.service_display_name} -{' '}
                      {quota.feature_display_name}
                      {!quota.is_active && (
                        <span style={{ color: '#999', marginLeft: '10px' }}>
                          (Inactive)
                        </span>
                      )}
                    </h4>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => setEditingQuota(quota)}
                        style={{
                          background: '#2196F3',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuota(quota.id)}
                        style={{
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '10px',
                      fontSize: '14px'
                    }}
                  >
                    <div>
                      <strong>Quota:</strong>{' '}
                      {quota.is_unlimited || quota.quota_limit === -1
                        ? '♾️ Unlimited (0)'
                        : `${quota.quota_limit} per ${quota.reset_period}`}
                    </div>
                    {quota.description && (
                      <div>
                        <strong>Description:</strong> {quota.description}
                      </div>
                    )}
                    <div>
                      <strong>Created:</strong>{' '}
                      {new Date(quota.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ================================
  // MAIN RENDER
  // ================================

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
        <p>Loading global guest quotas...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h2>🎯 Global Guest Quota Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
          style={{
            background: showCreateForm ? '#666' : '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: showCreateForm ? 'not-allowed' : 'pointer'
          }}
        >
          ➕ Add New Quota
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #e57373'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {showCreateForm && renderCreateForm()}
      {renderQuotaList()}

      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          background: 'var(--glass-overlay-light, var(--glass-bg-light))',
          borderRadius: '8px',
          border:
            '1px solid var(--glass-border-overlay-light, var(--glass-border-light))',
          backdropFilter: 'var(--glass-blur-light)',
          WebkitBackdropFilter: 'var(--glass-blur-light)',
          boxShadow: 'var(--glass-shadow-light)'
        }}
      >
        <h4 style={{ margin: '0 0 10px 0' }}>
          💡 How Global Guest Quotas Work:
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>
            <strong>Priority:</strong> Global quotas apply to anonymous users
            when no user-specific overrides exist
          </li>
          <li>
            <strong>Feature-Level:</strong> Set different quotas for different
            services/features to avoid unintended impacts
          </li>
          <li>
            <strong>IP-Based:</strong> Quotas are tracked by IP address and
            optional machine fingerprinting
          </li>
          <li>
            <strong>Reset Periods:</strong> Choose hourly, daily, weekly, or
            monthly reset cycles
          </li>
          <li>
            <strong>Unlimited:</strong> Check &ldquo;Unlimited&rdquo; to remove
            quota restrictions entirely
          </li>
        </ul>
      </div>
    </div>
  );
}
