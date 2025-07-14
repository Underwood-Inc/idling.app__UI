'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { LoadingButton } from '../../../components/ui/LoadingButton';
import './UserSubscriptionManagementModal.css';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  plan_type: 'tier' | 'addon' | 'bundle';
  price_monthly_cents?: number;
  price_yearly_cents?: number;
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status:
    | 'active'
    | 'cancelled'
    | 'expired'
    | 'suspended'
    | 'pending'
    | 'trialing';
  billing_cycle?: string;
  expires_at?: string;
  trial_ends_at?: string;
  assignment_reason?: string;
  created_at: string;
  updated_at: string;
  plan_name: string;
  plan_display_name: string;
  assigned_by_name?: string;
}

interface UserSubscriptionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userId: string;
  onUpdate?: () => void;
}

interface QuickActionButtonProps {
  subscription: UserSubscription;
  action: 'suspend' | 'cancel' | 'reactivate';
  onAction: (subscription: UserSubscription, action: string) => void;
  isLoading: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  subscription,
  action,
  onAction,
  isLoading
}) => {
  const actionConfig = {
    suspend: {
      label: 'Suspend',
      icon: '⏸️',
      className: 'btn-warning',
      confirmText: 'suspend'
    },
    cancel: {
      label: 'Cancel',
      icon: '❌',
      className: 'btn-danger',
      confirmText: 'cancel'
    },
    reactivate: {
      label: 'Reactivate',
      icon: '✅',
      className: 'btn-success',
      confirmText: 'reactivate'
    }
  };

  const config = actionConfig[action];
  const isDisabled =
    isLoading ||
    (action === 'suspend' && subscription.status !== 'active') ||
    (action === 'cancel' &&
      ['cancelled', 'expired'].includes(subscription.status)) ||
    (action === 'reactivate' && subscription.status === 'active');

  return (
    <button
      className={`btn btn-sm ${config.className}`}
      onClick={() => onAction(subscription, action)}
      disabled={isDisabled}
      title={`${config.label} subscription`}
    >
      {config.icon} {config.label}
    </button>
  );
};

const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { class: 'status-active', label: 'Active' },
    trialing: { class: 'status-trialing', label: 'Trial' },
    cancelled: { class: 'status-cancelled', label: 'Cancelled' },
    expired: { class: 'status-expired', label: 'Expired' },
    suspended: { class: 'status-suspended', label: 'Suspended' },
    pending: { class: 'status-pending', label: 'Pending' }
  };

  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return (
    <span className={`subscription-status ${config.class}`}>
      {config.label}
    </span>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const UserSubscriptionManagementModal: React.FC<
  UserSubscriptionManagementModalProps
> = ({ isOpen, onClose, userName, userId, onUpdate }) => {
  const [currentSubscriptions, setCurrentSubscriptions] = useState<
    UserSubscription[]
  >([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);

  // Add new subscription form state
  const [newSubscription, setNewSubscription] = useState({
    planId: '',
    billingCycle: 'monthly',
    expiresAt: '',
    reason: '',
    hasExpiration: false,
    hasPriceOverride: false,
    priceOverrideDollars: '',
    priceOverrideReason: ''
  });

  // Edit subscription form state
  const [editSubscription, setEditSubscription] = useState({
    status: 'active' as UserSubscription['status'],
    billing_cycle: '',
    expires_at: '',
    assignment_reason: ''
  });

  // Fetch current subscriptions for the user
  const fetchCurrentSubscriptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/subscriptions`);
      if (!response.ok) {
        throw new Error('Failed to fetch user subscriptions');
      }
      const data = await response.json();
      setCurrentSubscriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setCurrentSubscriptions([]);
    }
  }, [userId]);

  // Fetch available subscription plans
  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      const data = await response.json();
      setSubscriptionPlans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setSubscriptionPlans([]);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
          await Promise.all([
            fetchCurrentSubscriptions(),
            fetchSubscriptionPlans()
          ]);
        } catch (error) {
          setError(
            error instanceof Error ? error.message : 'Failed to load data'
          );
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen, fetchCurrentSubscriptions, fetchSubscriptionPlans]);

  // Handle quick actions (suspend, cancel, reactivate)
  const handleQuickAction = async (
    subscription: UserSubscription,
    action: string
  ) => {
    const actionLabels = {
      suspend: 'suspend',
      cancel: 'cancel',
      reactivate: 'reactivate'
    };

    const actionLabel = actionLabels[action as keyof typeof actionLabels];
    if (
      !confirm(`Are you sure you want to ${actionLabel} this subscription?`)
    ) {
      return;
    }

    setActionLoading(true);
    try {
      const statusMap = {
        suspend: 'suspended',
        cancel: 'cancelled',
        reactivate: 'active'
      };

      const response = await fetch(
        `/api/admin/user-subscriptions/${subscription.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: statusMap[action as keyof typeof statusMap],
            assignment_reason: `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}ed by administrator`
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to ${actionLabel} subscription`
        );
      }

      await fetchCurrentSubscriptions();
      onUpdate?.();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${actionLabel} subscription`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle adding new subscription
  const handleAddSubscription = async () => {
    if (!newSubscription.planId) {
      setError('Please select a subscription plan');
      return;
    }

    setActionLoading(true);
    try {
      const body = {
        planId: parseInt(newSubscription.planId),
        billingCycle: newSubscription.billingCycle,
        expiresAt: newSubscription.hasExpiration
          ? newSubscription.expiresAt
          : undefined,
        reason: newSubscription.reason,
        priceOverrideCents: newSubscription.hasPriceOverride
          ? Math.round(parseFloat(newSubscription.priceOverrideDollars) * 100)
          : undefined,
        priceOverrideReason: newSubscription.hasPriceOverride
          ? newSubscription.priceOverrideReason
          : undefined
      };

      const response = await fetch(
        `/api/admin/users/${userId}/assign-subscription`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign subscription');
      }

      // Reset form and refresh data
      setNewSubscription({
        planId: '',
        billingCycle: 'monthly',
        expiresAt: '',
        reason: '',
        hasExpiration: false,
        hasPriceOverride: false,
        priceOverrideDollars: '',
        priceOverrideReason: ''
      });
      setShowAddForm(false);
      await fetchCurrentSubscriptions();
      onUpdate?.();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to assign subscription'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle editing existing subscription
  const handleEditSubscription = async (subscriptionId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/user-subscriptions/${subscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editSubscription)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription');
      }

      setShowEditForm(null);
      await fetchCurrentSubscriptions();
      onUpdate?.();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update subscription'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Start editing a subscription
  const startEditSubscription = (subscription: UserSubscription) => {
    setEditSubscription({
      status: subscription.status,
      billing_cycle: subscription.billing_cycle || '',
      expires_at: subscription.expires_at
        ? subscription.expires_at.split('T')[0]
        : '',
      assignment_reason: subscription.assignment_reason || ''
    });
    setShowEditForm(subscription.id);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="user-subscription-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>💎 Manage Subscriptions</h3>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={actionLoading}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading subscription data...</p>
            </div>
          ) : (
            <>
              <div className="user-info">
                <h4>👤 Managing subscriptions for:</h4>
                <p>
                  <strong>{userName}</strong>
                </p>
                <p className="user-id">User ID: {userId}</p>
              </div>

              {error && (
                <div className="error-message">
                  <span>❌ {error}</span>
                  <button onClick={() => setError(null)}>✕</button>
                </div>
              )}

              {/* Current Subscriptions */}
              <div className="current-subscriptions">
                <div className="section-header">
                  <h4>📋 Current Subscriptions</h4>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddForm(true)}
                    disabled={actionLoading}
                  >
                    ➕ Add New
                  </button>
                </div>

                {currentSubscriptions.length === 0 ? (
                  <div className="no-subscriptions">
                    <p>No subscriptions found for this user.</p>
                  </div>
                ) : (
                  <div className="subscriptions-list">
                    {currentSubscriptions.map((subscription) => {
                      return (
                        <div
                          key={subscription.id}
                          className="subscription-item"
                        >
                          <div className="subscription-info">
                            <div className="subscription-plan">
                              <strong>
                                {subscription.plan_display_name ||
                                  'No Plan Name'}
                              </strong>
                              <span className="plan-type">
                                ({subscription.plan_name || 'no_plan_name'})
                              </span>
                              {getStatusBadge(subscription.status)}
                            </div>
                            <div className="subscription-meta">
                              <span>
                                Billing: {subscription.billing_cycle || 'N/A'}
                              </span>
                              {subscription.expires_at && (
                                <span>
                                  Expires: {formatDate(subscription.expires_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="subscription-actions">
                            <QuickActionButton
                              subscription={subscription}
                              action="suspend"
                              onAction={handleQuickAction}
                              isLoading={actionLoading}
                            />
                            <QuickActionButton
                              subscription={subscription}
                              action="cancel"
                              onAction={handleQuickAction}
                              isLoading={actionLoading}
                            />
                            <QuickActionButton
                              subscription={subscription}
                              action="reactivate"
                              onAction={handleQuickAction}
                              isLoading={actionLoading}
                            />
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                startEditSubscription(subscription)
                              }
                              disabled={actionLoading}
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add New Subscription Form */}
              {showAddForm && (
                <div className="add-subscription-form">
                  <div className="form-header">
                    <h4>➕ Add New Subscription</h4>
                    <button
                      className="btn btn-text btn-sm"
                      onClick={() => setShowAddForm(false)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Subscription Plan</label>
                      <select
                        value={newSubscription.planId}
                        onChange={(e) =>
                          setNewSubscription({
                            ...newSubscription,
                            planId: e.target.value
                          })
                        }
                        disabled={actionLoading}
                      >
                        <option value="">Select a plan...</option>
                        {subscriptionPlans
                          .filter((p) => p.is_active)
                          .map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.display_name} ({plan.plan_type})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Billing Cycle</label>
                      <select
                        value={newSubscription.billingCycle}
                        onChange={(e) =>
                          setNewSubscription({
                            ...newSubscription,
                            billingCycle: e.target.value
                          })
                        }
                        disabled={actionLoading}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="lifetime">Lifetime</option>
                        <option value="trial">Trial</option>
                      </select>
                    </div>

                    <div className="form-group form-group--full">
                      <label>
                        <input
                          type="checkbox"
                          checked={newSubscription.hasExpiration}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              hasExpiration: e.target.checked
                            })
                          }
                          disabled={actionLoading}
                        />
                        Set expiration date
                      </label>
                      {newSubscription.hasExpiration && (
                        <input
                          type="date"
                          value={newSubscription.expiresAt}
                          onChange={(e) =>
                            setNewSubscription({
                              ...newSubscription,
                              expiresAt: e.target.value
                            })
                          }
                          disabled={actionLoading}
                        />
                      )}
                    </div>

                    <div className="form-group form-group--full">
                      <label>Assignment Reason</label>
                      <textarea
                        value={newSubscription.reason}
                        onChange={(e) =>
                          setNewSubscription({
                            ...newSubscription,
                            reason: e.target.value
                          })
                        }
                        placeholder="Why is this subscription being assigned?"
                        disabled={actionLoading}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <LoadingButton
                      onClick={handleAddSubscription}
                      disabled={!newSubscription.planId || actionLoading}
                      className="btn btn-primary"
                    >
                      Add Subscription
                    </LoadingButton>
                  </div>
                </div>
              )}

              {/* Edit Subscription Form */}
              {showEditForm && (
                <div className="edit-subscription-form">
                  <div className="form-header">
                    <h4>✏️ Edit Subscription</h4>
                    <button
                      className="btn btn-text btn-sm"
                      onClick={() => setShowEditForm(null)}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={editSubscription.status}
                        onChange={(e) =>
                          setEditSubscription({
                            ...editSubscription,
                            status: e.target.value as UserSubscription['status']
                          })
                        }
                        disabled={actionLoading}
                      >
                        <option value="active">Active</option>
                        <option value="trialing">Trialing</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                        <option value="suspended">Suspended</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Billing Cycle</label>
                      <select
                        value={editSubscription.billing_cycle}
                        onChange={(e) =>
                          setEditSubscription({
                            ...editSubscription,
                            billing_cycle: e.target.value
                          })
                        }
                        disabled={actionLoading}
                      >
                        <option value="">Select cycle...</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="lifetime">Lifetime</option>
                        <option value="trial">Trial</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Expires At</label>
                      <input
                        type="date"
                        value={editSubscription.expires_at}
                        onChange={(e) =>
                          setEditSubscription({
                            ...editSubscription,
                            expires_at: e.target.value
                          })
                        }
                        disabled={actionLoading}
                      />
                    </div>

                    <div className="form-group form-group--full">
                      <label>Assignment Reason</label>
                      <textarea
                        value={editSubscription.assignment_reason}
                        onChange={(e) =>
                          setEditSubscription({
                            ...editSubscription,
                            assignment_reason: e.target.value
                          })
                        }
                        placeholder="Reason for this change..."
                        disabled={actionLoading}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <LoadingButton
                      onClick={() => handleEditSubscription(showEditForm)}
                      disabled={actionLoading}
                      className="btn btn-primary"
                    >
                      Update Subscription
                    </LoadingButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
