'use client';

import React, { useEffect, useState } from 'react';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  plan_type: 'tier' | 'addon' | 'bundle';
  price_monthly_cents?: number;
  price_yearly_cents?: number;
  price_lifetime_cents?: number;
}

export interface AssignSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (
    planId: string,
    billingCycle: string,
    expiresAt?: string,
    reason?: string
  ) => Promise<void>;
  userName: string;
  userId: string;
  currentSubscriptions?: any[];
}

export const AssignSubscriptionModal: React.FC<
  AssignSubscriptionModalProps
> = ({
  isOpen,
  onClose,
  onAssign,
  userName,
  userId,
  currentSubscriptions = []
}) => {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [billingCycle, setBillingCycle] = useState<
    'monthly' | 'yearly' | 'lifetime'
  >('monthly');
  const [expiresAt, setExpiresAt] = useState('');
  const [reason, setReason] = useState('');
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available subscription plans
  useEffect(() => {
    if (isOpen) {
      loadAvailablePlans();
    }
  }, [isOpen]);

  const loadAvailablePlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscription-plans');
      if (response.ok) {
        const plans = await response.json();
        setAvailablePlans(plans);
      }
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !billingCycle) return;

    setIsSubmitting(true);
    try {
      await onAssign(
        selectedPlan,
        billingCycle,
        expiresAt || undefined,
        reason || undefined
      );
      handleClose();
    } catch (error) {
      console.error('Failed to assign subscription:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPlan('');
    setBillingCycle('monthly');
    setExpiresAt('');
    setReason('');
    onClose();
  };

  const formatPrice = (cents?: number) => {
    if (!cents) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const selectedPlanData = availablePlans.find((p) => p.id === selectedPlan);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content modal-content--large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3>💎 Assign Subscription to {userName}</h3>
            <p
              style={{
                margin: '4px 0 0 0',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}
            >
              ID: {userId}
            </p>
          </div>
          <button className="modal-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '2rem'
                }}
              >
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* Plan Selection */}
                <div className="form-group">
                  <label htmlFor="plan-select">Subscription Plan *</label>
                  <select
                    id="plan-select"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    required
                    className="admin-select"
                  >
                    <option value="">Select a plan...</option>
                    {availablePlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.display_name} ({plan.plan_type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plan Details */}
                {selectedPlanData && (
                  <div
                    style={{
                      padding: '12px',
                      background: 'var(--light-background--secondary)',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <strong>{selectedPlanData.display_name}</strong>
                    <br />
                    <div style={{ margin: '8px 0' }}>
                      {selectedPlanData.description ||
                        'No description available.'}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <span>
                        Monthly:{' '}
                        {formatPrice(selectedPlanData.price_monthly_cents)}
                      </span>
                      <span>
                        Yearly:{' '}
                        {formatPrice(selectedPlanData.price_yearly_cents)}
                      </span>
                      {selectedPlanData.price_lifetime_cents && (
                        <span>
                          Lifetime:{' '}
                          {formatPrice(selectedPlanData.price_lifetime_cents)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Billing Cycle */}
                <div className="form-group">
                  <label htmlFor="billing-cycle">Billing Cycle *</label>
                  <select
                    id="billing-cycle"
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    required
                    className="admin-select"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>

                {/* Status */}
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    defaultValue="active"
                    className="admin-select"
                  >
                    <option value="active">Active</option>
                    <option value="trialing">Trial</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Expiration Date */}
                <div className="form-group">
                  <label htmlFor="expires-at">Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    id="expires-at"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid var(--light-background--tertiary)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '100%'
                    }}
                  />
                  <div className="form-help">
                    Leave empty for lifetime subscriptions or auto-renewal.
                  </div>
                </div>

                {/* Reason */}
                <div className="form-group">
                  <label htmlFor="reason">Reason (Optional)</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for subscription assignment..."
                    rows={3}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid var(--light-background--tertiary)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '100%',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* Current Subscriptions Display */}
                {currentSubscriptions.length > 0 && (
                  <div>
                    <label style={{ marginBottom: '8px', display: 'block' }}>
                      Current Subscriptions:
                    </label>
                    <div
                      style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}
                    >
                      {currentSubscriptions.map((sub, index) => (
                        <span
                          key={index}
                          className={`subscription-badge subscription-badge--${sub.status}`}
                        >
                          {sub.plan_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn--accent"
                disabled={
                  !selectedPlan || !billingCycle || isSubmitting || loading
                }
              >
                {isSubmitting ? '🔄 Assigning...' : '💎 Assign Subscription'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
