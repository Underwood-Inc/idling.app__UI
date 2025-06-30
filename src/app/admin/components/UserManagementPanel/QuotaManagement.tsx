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
    setNewLimit(currentLimit);
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
          quota_limit: isUnlimited ? -1 : newLimit,
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
    <div className="modal-overlay">
      <div className="modal-content quota-management-modal">
        <div className="modal-header">
          <h3>Quota Management - {user.name || user.email}</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">Loading quotas...</div>
          ) : error ? (
            <div className="error-state">
              <p>Error: {error}</p>
              <button onClick={loadUserQuotas}>Retry</button>
            </div>
          ) : (
            <div className="quotas-list">
              {quotas.length === 0 ? (
                <p>No quota data found for this user.</p>
              ) : (
                quotas.map((quota) => (
                  <div
                    key={`${quota.service_name}-${quota.feature_name}`}
                    className="quota-item"
                  >
                    <div className="quota-header">
                      <h4>{quota.display_name}</h4>
                      <div className="quota-badges">
                        {quota.is_unlimited && (
                          <span className="badge unlimited">Unlimited</span>
                        )}
                        {quota.is_custom && (
                          <span className="badge custom">Custom</span>
                        )}
                      </div>
                    </div>

                    <div className="quota-details">
                      <div className="quota-usage">
                        <span className="usage-label">Usage:</span>
                        <span className="usage-value">
                          {quota.current_usage}
                          {!quota.is_unlimited && ` / ${quota.quota_limit}`}
                        </span>
                        <div className="usage-bar">
                          <div
                            className="usage-fill"
                            style={{
                              width: quota.is_unlimited
                                ? '0%'
                                : `${Math.min((quota.current_usage / quota.quota_limit) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      <div className="quota-info">
                        <span>
                          Resets:{' '}
                          <TimestampWithTooltip
                            date={quota.reset_date}
                            abbreviated={false}
                            showSeconds={true}
                          />
                        </span>
                      </div>
                    </div>

                    <div className="quota-actions">
                      {editingQuota ===
                      `${quota.service_name}.${quota.feature_name}` ? (
                        <div className="edit-form">
                          <div className="form-row">
                            <label>
                              <input
                                type="checkbox"
                                checked={isUnlimited}
                                onChange={(e) =>
                                  setIsUnlimited(e.target.checked)
                                }
                              />
                              Unlimited
                            </label>
                          </div>

                          {!isUnlimited && (
                            <div className="form-row">
                              <label>Limit:</label>
                              <input
                                type="number"
                                value={newLimit}
                                onChange={(e) =>
                                  setNewLimit(parseInt(e.target.value) || 0)
                                }
                                min="0"
                              />
                            </div>
                          )}

                          <div className="form-row">
                            <label>Reason:</label>
                            <input
                              type="text"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Reason for quota change..."
                              required
                            />
                          </div>

                          <div className="form-actions">
                            <button
                              onClick={handleSaveQuota}
                              disabled={!reason.trim()}
                              className="btn btn--primary"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingQuota(null)}
                              className="btn btn--secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            onClick={() =>
                              handleEditQuota(
                                quota.service_name,
                                quota.feature_name,
                                quota.quota_limit,
                                quota.is_unlimited
                              )
                            }
                            className="btn btn--small"
                          >
                            Edit Limit
                          </button>
                          {quota.current_usage > 0 && (
                            <button
                              onClick={() =>
                                handleResetQuota(
                                  quota.service_name,
                                  quota.feature_name
                                )
                              }
                              className="btn btn--small btn--warning"
                            >
                              Reset Usage
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

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn--secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
