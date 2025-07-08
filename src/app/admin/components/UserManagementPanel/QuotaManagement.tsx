/**
 * Quota Management Component - Redesigned for Agnostic Quota Architecture
 *
 * This component now works with the new agnostic quota system where:
 * - Subscriptions provide base quotas
 * - Overrides are used only for exceptional cases (higher than subscription)
 * - Clear visibility into quota sources and effective limits
 * - Simplified interface focused on administrative overrides
 */

import React, { useEffect, useState } from 'react';
import { TimestampWithTooltip } from '../../../components/ui/TimestampWithTooltip';
import type { ManagementUser } from './types';

interface EffectiveQuotaData {
  service_name: string;
  feature_name: string;
  display_name: string;
  current_usage: number;
  // Subscription quota
  subscription_quota_limit: number | null;
  subscription_is_unlimited: boolean;
  subscription_plan_name?: string;
  // Override quota
  override_quota_limit: number | null;
  override_is_unlimited: boolean;
  override_reason?: string;
  // Effective (active) quota
  effective_quota_limit: number;
  effective_is_unlimited: boolean;
  effective_source: 'subscription_plan' | 'user_override' | 'none';
  reset_date: string;
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
  const [quotaData, setQuotaData] = useState<EffectiveQuotaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [newOverrideLimit, setNewOverrideLimit] = useState<number>(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [resetPeriod, setResetPeriod] = useState<
    'daily' | 'weekly' | 'monthly'
  >('daily');
  const [reason, setReason] = useState('');
  const [savingQuota, setSavingQuota] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user.id) {
      loadUserQuotaData();
    }
  }, [isOpen, user.id]);

  const loadUserQuotaData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/effective-quotas`,
        {
          credentials: 'include'
        }
      );

      if (response.ok) {
        const result = await response.json();
        setQuotaData(result.data?.quotas || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load quota data');
      }
    } catch (err) {
      setError('Error loading quota data');
      console.error('Error loading quota data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOverride = (
    serviceName: string,
    featureName: string,
    currentSubscriptionLimit: number | null
  ) => {
    setEditingQuota(`${serviceName}.${featureName}`);
    // Set minimum override to be higher than subscription limit
    const minOverride = currentSubscriptionLimit
      ? currentSubscriptionLimit + 1
      : 1;
    setNewOverrideLimit(minOverride);
    setIsUnlimited(false);
    setResetPeriod('daily');
    setReason('');
  };

  const handleEditOverride = (
    serviceName: string,
    featureName: string,
    currentOverrideLimit: number,
    unlimited: boolean,
    currentResetPeriod: string = 'daily'
  ) => {
    setEditingQuota(`${serviceName}.${featureName}`);
    setNewOverrideLimit(currentOverrideLimit === -1 ? 0 : currentOverrideLimit);
    setIsUnlimited(unlimited);
    setResetPeriod(currentResetPeriod as 'daily' | 'weekly' | 'monthly');
    setReason('');
  };

  const handleSaveOverride = async () => {
    if (!editingQuota) return;

    const [serviceName, featureName] = editingQuota.split('.');
    const quotaItem = quotaData.find(
      (q) => q.service_name === serviceName && q.feature_name === featureName
    );

    if (!quotaItem) return;

    // Validation: Override must be higher than subscription quota (unless unlimited)
    if (
      !isUnlimited &&
      quotaItem.subscription_quota_limit !== null &&
      newOverrideLimit <= quotaItem.subscription_quota_limit
    ) {
      setError(
        `Override quota must be higher than subscription quota (${quotaItem.subscription_quota_limit})`
      );
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for this quota override');
      return;
    }

    setSavingQuota(`${serviceName}.${featureName}`);

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/quota-overrides`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            service_name: serviceName,
            feature_name: featureName,
            quota_limit: isUnlimited ? null : newOverrideLimit,
            is_unlimited: isUnlimited,
            reset_period: resetPeriod,
            reason: reason.trim()
          })
        }
      );

      if (response.ok) {
        await loadUserQuotaData();
        setEditingQuota(null);
        setError(null);
        onUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save quota override');
      }
    } catch (err) {
      setError('Error saving quota override');
      console.error('Error saving quota override:', err);
    } finally {
      setSavingQuota(null);
    }
  };

  const handleRemoveOverride = async (
    serviceName: string,
    featureName: string
  ) => {
    if (
      !confirm(
        `Remove quota override for ${serviceName}? This will revert to subscription-based quota.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/quota-overrides`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            service_name: serviceName,
            feature_name: featureName
          })
        }
      );

      if (response.ok) {
        await loadUserQuotaData();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove quota override');
      }
    } catch (err) {
      setError('Error removing quota override');
      console.error('Error removing quota override:', err);
    }
  };

  const handleResetUsage = async (serviceName: string, featureName: string) => {
    if (
      !confirm(
        `Reset usage for ${serviceName}? This will set current usage to 0.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/quota-usage/reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            service_name: serviceName,
            feature_name: featureName,
            reason: `Usage reset by admin for ${user.name || user.email}`
          })
        }
      );

      if (response.ok) {
        await loadUserQuotaData();
        onUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reset usage');
      }
    } catch (err) {
      setError('Error resetting usage');
      console.error('Error resetting usage:', err);
    }
  };

  const getQuotaSourceBadge = (source: string) => {
    switch (source) {
      case 'subscription_plan':
        return (
          <span className="quota-source-badge quota-source--subscription">
            📋 Subscription
          </span>
        );
      case 'user_override':
        return (
          <span className="quota-source-badge quota-source--override">
            ⚡ Override
          </span>
        );
      default:
        return (
          <span className="quota-source-badge quota-source--none">
            ❌ No Quota
          </span>
        );
    }
  };

  const getUsagePercentage = (
    current: number,
    limit: number,
    unlimited: boolean
  ) => {
    if (unlimited) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'linear-gradient(90deg, #ef4444, #dc2626)';
    if (percentage >= 80) return 'linear-gradient(90deg, #f59e0b, #d97706)';
    return 'linear-gradient(90deg, #10b981, #059669)';
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .quota-source-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .quota-source--subscription {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .quota-source--override {
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.3);
        }
        .quota-source--none {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      `}</style>

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
            maxWidth: '900px',
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
                {user.name || user.email} - Subscription + Override Integration
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
                <p>Loading quota data...</p>
              </div>
            ) : error ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
                <p style={{ color: '#ef4444', margin: '0 0 16px 0' }}>
                  {error}
                </p>
                <button
                  onClick={() => {
                    setError(null);
                    loadUserQuotaData();
                  }}
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
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {quotaData.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: 'var(--dark-bg__text-color--secondary)'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>
                      📊
                    </div>
                    <p>No quota data available for this user.</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      User may need a subscription plan or quota override.
                    </p>
                  </div>
                ) : (
                  quotaData.map((quota) => (
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
                        <div>
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
                          <div style={{ marginTop: '4px' }}>
                            {getQuotaSourceBadge(quota.effective_source)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              color: quota.effective_is_unlimited
                                ? '#10b981'
                                : 'var(--dark-bg__text-color--primary)',
                              fontSize: '24px',
                              fontWeight: '700'
                            }}
                          >
                            {quota.effective_is_unlimited
                              ? '∞'
                              : quota.effective_quota_limit}
                          </div>
                          <div
                            style={{
                              color: 'var(--dark-bg__text-color--secondary)',
                              fontSize: '12px'
                            }}
                          >
                            {quota.reset_period} limit
                          </div>
                        </div>
                      </div>

                      {/* Quota Breakdown */}
                      <div style={{ marginBottom: '16px' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            fontSize: '14px'
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                color: 'var(--dark-bg__text-color--primary)'
                              }}
                            >
                              Subscription:
                            </strong>
                            <div
                              style={{
                                color: 'var(--dark-bg__text-color--secondary)'
                              }}
                            >
                              {quota.subscription_is_unlimited
                                ? '∞'
                                : quota.subscription_quota_limit || 'None'}
                              {quota.subscription_plan_name &&
                                ` (${quota.subscription_plan_name})`}
                            </div>
                          </div>
                          <div>
                            <strong
                              style={{
                                color: 'var(--dark-bg__text-color--primary)'
                              }}
                            >
                              Override:
                            </strong>
                            <div
                              style={{
                                color: 'var(--dark-bg__text-color--secondary)'
                              }}
                            >
                              {quota.override_is_unlimited
                                ? '∞'
                                : quota.override_quota_limit || 'None'}
                              {quota.override_reason && (
                                <div
                                  style={{
                                    fontSize: '12px',
                                    fontStyle: 'italic'
                                  }}
                                >
                                  "{quota.override_reason}"
                                </div>
                              )}
                            </div>
                          </div>
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
                            Current Usage:
                          </span>
                          <span
                            style={{
                              color: 'var(--dark-bg__text-color--primary)',
                              fontSize: '16px',
                              fontWeight: '600'
                            }}
                          >
                            {quota.current_usage}
                            {!quota.effective_is_unlimited &&
                              ` / ${quota.effective_quota_limit}`}
                          </span>
                        </div>
                        {!quota.effective_is_unlimited && (
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
                                background: getUsageColor(
                                  getUsagePercentage(
                                    quota.current_usage,
                                    quota.effective_quota_limit,
                                    quota.effective_is_unlimited
                                  )
                                ),
                                height: '100%',
                                width: `${getUsagePercentage(quota.current_usage, quota.effective_quota_limit, quota.effective_is_unlimited)}%`,
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Reset Info */}
                      <div
                        style={{
                          marginBottom: '16px',
                          fontSize: '14px',
                          color: 'var(--dark-bg__text-color--secondary)'
                        }}
                      >
                        <div>
                          Resets:{' '}
                          <TimestampWithTooltip timestamp={quota.reset_date} />
                        </div>
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
                                Override Limit:
                              </label>
                              <input
                                type="number"
                                value={newOverrideLimit}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setNewOverrideLimit(value);
                                }}
                                min={
                                  quota.subscription_quota_limit
                                    ? quota.subscription_quota_limit + 1
                                    : 1
                                }
                                disabled={isUnlimited}
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
                                  color:
                                    'var(--dark-bg__text-color--secondary)',
                                  fontSize: '12px',
                                  display: 'block',
                                  marginTop: '4px'
                                }}
                              >
                                Must be higher than subscription quota (
                                {quota.subscription_quota_limit || 'none'})
                              </small>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  color: 'var(--dark-bg__text-color--primary)',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isUnlimited}
                                  onChange={(e) =>
                                    setIsUnlimited(e.target.checked)
                                  }
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    accentColor: 'var(--brand-primary)'
                                  }}
                                />
                                Unlimited Override
                              </label>
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
                                Reset Period:
                              </label>
                              <select
                                value={resetPeriod}
                                onChange={(e) =>
                                  setResetPeriod(
                                    e.target.value as
                                      | 'daily'
                                      | 'weekly'
                                      | 'monthly'
                                  )
                                }
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
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                              </select>
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
                                Reason (Required):
                              </label>
                              <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Why is this override needed?"
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
                                onClick={handleSaveOverride}
                                disabled={
                                  savingQuota ===
                                    `${quota.service_name}.${quota.feature_name}` ||
                                  !reason.trim()
                                }
                                style={{
                                  background:
                                    'linear-gradient(135deg, #10b981, #059669)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '10px 20px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  opacity:
                                    savingQuota ===
                                      `${quota.service_name}.${quota.feature_name}` ||
                                    !reason.trim()
                                      ? 0.6
                                      : 1
                                }}
                              >
                                {savingQuota ===
                                `${quota.service_name}.${quota.feature_name}`
                                  ? '⏳ Saving...'
                                  : '✅ Save Override'}
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
                                  fontWeight: '500'
                                }}
                              >
                                ❌ Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              gap: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
                            {quota.effective_source === 'user_override' ? (
                              <button
                                onClick={() =>
                                  handleEditOverride(
                                    quota.service_name,
                                    quota.feature_name,
                                    quota.override_quota_limit!,
                                    quota.override_is_unlimited,
                                    quota.reset_period
                                  )
                                }
                                style={{
                                  background:
                                    'linear-gradient(135deg, #a855f7, #9333ea)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '500'
                                }}
                              >
                                ✏️ Edit Override
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleAddOverride(
                                    quota.service_name,
                                    quota.feature_name,
                                    quota.subscription_quota_limit
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
                                  fontWeight: '500'
                                }}
                              >
                                ⚡ Add Override
                              </button>
                            )}

                            {quota.effective_source === 'user_override' && (
                              <button
                                onClick={() =>
                                  handleRemoveOverride(
                                    quota.service_name,
                                    quota.feature_name
                                  )
                                }
                                style={{
                                  background:
                                    'linear-gradient(135deg, #ef4444, #dc2626)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  fontWeight: '500'
                                }}
                              >
                                🗑️ Remove Override
                              </button>
                            )}

                            {quota.current_usage > 0 && (
                              <button
                                onClick={() =>
                                  handleResetUsage(
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
                                  fontWeight: '500'
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
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: 'var(--dark-bg__text-color--secondary)'
              }}
            >
              💡 Overrides are only used when they provide higher quotas than
              subscriptions
            </div>
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
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
