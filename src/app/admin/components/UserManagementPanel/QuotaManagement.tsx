/**
 * Quota Management Component
 *
 * Integrates with the existing subscription system to allow admins
 * to view and modify user quotas for different services.
 */

import React, { useEffect, useState } from 'react';
import { TimestampWithTooltip } from '../../../components/ui/TimestampWithTooltip';
import type { ManagementUser } from './types';

interface QuotaData {
  service_name: string;
  feature_name: string;
  display_name: string;
  current_usage: number;
  quota_limit: number;
  is_unlimited: boolean;
  is_custom: boolean;
  reset_date: string;
  quota_source: string;
  reset_period: string;
}

interface QuotaManagementProps {
  user: ManagementUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const QuotaManagement: React.FC<QuotaManagementProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [quotas, setQuotas] = useState<QuotaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<number>(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen && user.id) {
      loadUserQuotas();
    }
  }, [isOpen, user.id]);

  const loadUserQuotas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/quotas`, {
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        // Handle the nested response structure: result.data.quotas
        setQuotas(result.data?.quotas || result.quotas || []);
      } else {
        setError('Failed to load user quotas');
      }
    } catch (err) {
      setError('Error loading quotas');
      console.error('Error loading quotas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuota = (
    serviceName: string,
    featureName: string,
    currentLimit: number,
    unlimited: boolean
  ) => {
    setEditingQuota(`${serviceName}.${featureName}`);
    // Convert -1 from database to 0 for the form (0 = infinite)
    setNewLimit(currentLimit === -1 ? 0 : currentLimit);
    setIsUnlimited(unlimited);
    setReason('');
  };

  const handleSaveQuota = async () => {
    if (!editingQuota) return;

    const [serviceName, featureName] = editingQuota.split('.');

    try {
      const response = await fetch(`/api/admin/users/${user.id}/quotas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          service_name: serviceName,
          feature_name: featureName,
          quota_limit: isUnlimited ? 0 : newLimit,
          is_unlimited: isUnlimited,
          reason: reason
        })
      });

      if (response.ok) {
        await loadUserQuotas();
        setEditingQuota(null);
        onUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update quota');
      }
    } catch (err) {
      setError('Error updating quota');
      console.error('Error updating quota:', err);
    }
  };

  const handleResetQuota = async (serviceName: string, featureName: string) => {
    if (
      !confirm(
        `Reset usage for ${serviceName}? This will set current usage to 0.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}/quotas/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          service_name: serviceName,
          feature_name: featureName,
          reason: `Usage reset by admin for ${user.name || user.email}`
        })
      });

      if (response.ok) {
        await loadUserQuotas();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reset quota');
      }
    } catch (err) {
      setError('Error resetting quota');
      console.error('Error resetting quota:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'var(--glass-overlay-medium, var(--glass-bg-medium))',
          border:
            '1px solid var(--glass-border-overlay-medium, var(--glass-border-medium))',
          borderRadius: '16px',
          backdropFilter: 'var(--glass-blur-medium)',
          WebkitBackdropFilter: 'var(--glass-blur-medium)',
          boxShadow: 'var(--glass-shadow-medium)',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 32px',
            borderBottom:
              '1px solid var(--glass-border-overlay-light, var(--glass-border-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: 'var(--dark-bg__text-color--primary)',
                fontSize: '20px',
                fontWeight: '600'
              }}
            >
              🎯 Quota Management
            </h3>
            <p
              style={{
                margin: '4px 0 0 0',
                color: 'var(--dark-bg__text-color--secondary)',
                fontSize: '14px'
              }}
            >
              {user.name || user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--dark-bg__text-color--secondary)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'var(--glass-overlay-light, var(--glass-bg-light))';
              e.currentTarget.style.color =
                'var(--dark-bg__text-color--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color =
                'var(--dark-bg__text-color--secondary)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '24px 32px',
            flex: 1,
            overflow: 'auto'
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: 'var(--dark-bg__text-color--secondary)'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
              <p>Loading quotas...</p>
            </div>
          ) : error ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: '#ef4444', margin: '0 0 16px 0' }}>
                Error: {error}
              </p>
              <button
                onClick={loadUserQuotas}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Retry
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {quotas.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--dark-bg__text-color--secondary)',
                    background:
                      'var(--glass-overlay-light, var(--glass-bg-light))',
                    borderRadius: '12px',
                    border:
                      '1px solid var(--glass-border-overlay-light, var(--glass-border-light))'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>
                    📊
                  </div>
                  <p>No quota data found for this user.</p>
                </div>
              ) : (
                quotas.map((quota) => (
                  <div
                    key={`${quota.service_name}-${quota.feature_name}`}
                    style={{
                      background:
                        'var(--glass-overlay-light, var(--glass-bg-light))',
                      border:
                        '1px solid var(--glass-border-overlay-light, var(--glass-border-light))',
                      borderRadius: '12px',
                      padding: '20px',
                      backdropFilter: 'var(--glass-blur-light)',
                      WebkitBackdropFilter: 'var(--glass-blur-light)'
                    }}
                  >
                    {/* Quota Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px'
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          color: 'var(--dark-bg__text-color--primary)',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}
                      >
                        {quota.display_name}
                      </h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {quota.is_unlimited && (
                          <span
                            style={{
                              background:
                                'linear-gradient(135deg, #10b981, #059669)',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            ♾️ Unlimited
                          </span>
                        )}
                        {quota.is_custom && (
                          <span
                            style={{
                              background:
                                'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            ⚙️ Custom
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Usage Display */}
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--dark-bg__text-color--secondary)',
                            fontSize: '14px'
                          }}
                        >
                          Usage:
                        </span>
                        <span
                          style={{
                            color: 'var(--dark-bg__text-color--primary)',
                            fontSize: '16px',
                            fontWeight: '600'
                          }}
                        >
                          {quota.current_usage}
                          {!quota.is_unlimited && ` / ${quota.quota_limit}`}
                        </span>
                      </div>
                      {!quota.is_unlimited && (
                        <div
                          style={{
                            background:
                              'var(--glass-overlay-dark, var(--glass-bg-dark))',
                            borderRadius: '8px',
                            height: '8px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              background:
                                quota.current_usage >= quota.quota_limit
                                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                  : quota.current_usage / quota.quota_limit >
                                      0.8
                                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                    : 'linear-gradient(90deg, #10b981, #059669)',
                              height: '100%',
                              width: `${Math.min((quota.current_usage / quota.quota_limit) * 100, 100)}%`,
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Reset Info */}
                    <div style={{ marginBottom: '16px' }}>
                      <span
                        style={{
                          color: 'var(--dark-bg__text-color--secondary)',
                          fontSize: '13px'
                        }}
                      >
                        🔄 Resets:{' '}
                        <TimestampWithTooltip
                          date={quota.reset_date}
                          abbreviated={false}
                          showSeconds={true}
                        />
                      </span>
                    </div>

                    {/* Actions */}
                    <div>
                      {editingQuota ===
                      `${quota.service_name}.${quota.feature_name}` ? (
                        <div
                          style={{
                            background:
                              'var(--glass-overlay-medium, var(--glass-bg-medium))',
                            border:
                              '1px solid var(--glass-border-overlay-medium, var(--glass-border-medium))',
                            borderRadius: '8px',
                            padding: '16px'
                          }}
                        >
                          <div style={{ marginBottom: '16px' }}>
                            <label
                              style={{
                                display: 'block',
                                color: 'var(--dark-bg__text-color--primary)',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px'
                              }}
                            >
                              Quota Limit:
                            </label>
                            <input
                              type="number"
                              value={newLimit}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setNewLimit(value);
                                setIsUnlimited(value === 0);
                              }}
                              min="0"
                              placeholder="Enter 0 for unlimited"
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border:
                                  '1px solid var(--glass-border-overlay-light, var(--glass-border-light))',
                                background:
                                  'var(--glass-overlay-light, var(--glass-bg-light))',
                                color: 'var(--dark-bg__text-color--primary)',
                                fontSize: '14px'
                              }}
                            />
                            <small
                              style={{
                                color: 'var(--dark-bg__text-color--secondary)',
                                fontSize: '12px',
                                display: 'block',
                                marginTop: '4px'
                              }}
                            >
                              💡 Enter 0 for unlimited quota
                            </small>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <label
                              style={{
                                display: 'block',
                                color: 'var(--dark-bg__text-color--primary)',
                                fontSize: '14px',
                                fontWeight: '500',
                                marginBottom: '8px'
                              }}
                            >
                              Reason:
                            </label>
                            <input
                              type="text"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Reason for quota change..."
                              required
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border:
                                  '1px solid var(--glass-border-overlay-light, var(--glass-border-light))',
                                background:
                                  'var(--glass-overlay-light, var(--glass-bg-light))',
                                color: 'var(--dark-bg__text-color--primary)',
                                fontSize: '14px'
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={handleSaveQuota}
                              disabled={!reason.trim()}
                              style={{
                                background: reason.trim()
                                  ? 'linear-gradient(135deg, #10b981, #059669)'
                                  : '#6b7280',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: reason.trim()
                                  ? 'pointer'
                                  : 'not-allowed',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              ✅ Save
                            </button>
                            <button
                              onClick={() => setEditingQuota(null)}
                              style={{
                                background:
                                  'var(--glass-overlay-light, var(--glass-bg-light))',
                                color: 'var(--dark-bg__text-color--primary)',
                                border:
                                  '1px solid var(--glass-border-overlay-light, var(--glass-border-light))',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() =>
                              handleEditQuota(
                                quota.service_name,
                                quota.feature_name,
                                quota.quota_limit,
                                quota.is_unlimited
                              )
                            }
                            style={{
                              background:
                                'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            ✏️ Edit Limit
                          </button>
                          {quota.current_usage > 0 && (
                            <button
                              onClick={() =>
                                handleResetQuota(
                                  quota.service_name,
                                  quota.feature_name
                                )
                              }
                              style={{
                                background:
                                  'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              🔄 Reset Usage
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 32px',
            borderTop:
              '1px solid var(--glass-border-overlay-light, var(--glass-border-light))',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'var(--glass-overlay-light, var(--glass-bg-light))',
              color: 'var(--dark-bg__text-color--primary)',
              border:
                '1px solid var(--glass-border-overlay-light, var(--glass-border-light))',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                'var(--glass-overlay-medium, var(--glass-bg-medium))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'var(--glass-overlay-light, var(--glass-bg-light))';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
