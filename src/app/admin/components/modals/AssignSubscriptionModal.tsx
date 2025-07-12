'use client';

import React, { useCallback, useEffect, useState } from 'react';
import './AssignSubscriptionModal.css';

// ================================
// TYPES & INTERFACES
// ================================

interface SubscriptionPlan {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  plan_type: 'tier' | 'addon' | 'bundle';
  price_monthly_cents: number | null;
  price_yearly_cents: number | null;
  price_lifetime_cents: number | null;
  is_active: boolean;
}

interface AssignSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (
    planId: string,
    billingCycle: string,
    expiresAt?: string,
    reason?: string,
    priceOverrideCents?: number,
    priceOverrideReason?: string
  ) => Promise<void>;
  userName: string;
  userId: string;
}

export const AssignSubscriptionModal: React.FC<
  AssignSubscriptionModalProps
> = ({ isOpen, onClose, onAssign, userName, userId }) => {
  // ================================
  // STATE MANAGEMENT
  // ================================

  const [subscriptionPlans, setSubscriptionPlans] = useState<
    SubscriptionPlan[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<string>('monthly');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [hasExpiration, setHasExpiration] = useState<boolean>(false);
  const [hasPriceOverride, setHasPriceOverride] = useState<boolean>(false);
  const [priceOverrideDollars, setPriceOverrideDollars] = useState<string>('');
  const [priceOverrideReason, setPriceOverrideReason] = useState<string>('');

  // ================================
  // DATA FETCHING
  // ================================

  const fetchSubscriptionPlans = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/subscription-plans');

      if (!response.ok) {
        throw new Error(
          `Failed to fetch subscription plans: ${response.status}`
        );
      }

      const plans = await response.json();
      setSubscriptionPlans(
        plans.filter((plan: SubscriptionPlan) => plan.is_active)
      );
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch subscription plans'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionPlans();
    }
  }, [isOpen, fetchSubscriptionPlans]);

  // ================================
  // FORM VALIDATION
  // ================================

  const validateForm = (): string | null => {
    if (!selectedPlanId) {
      return 'Please select a subscription plan';
    }

    if (!billingCycle) {
      return 'Please select a billing cycle';
    }

    if (hasExpiration && !expiresAt) {
      return 'Please set an expiration date';
    }

    if (hasExpiration && expiresAt) {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      if (expirationDate <= now) {
        return 'Expiration date must be in the future';
      }
    }

    if (hasPriceOverride) {
      if (!priceOverrideDollars) {
        return 'Please enter a price override amount';
      }

      const priceValue = parseFloat(priceOverrideDollars);
      if (isNaN(priceValue) || priceValue < 0) {
        return 'Price override must be a valid amount (0 or greater)';
      }

      if (!priceOverrideReason.trim()) {
        return 'Please provide a reason for the price override';
      }
    }

    return null;
  };

  // ================================
  // EVENT HANDLERS
  // ================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      const priceOverrideCents = hasPriceOverride
        ? Math.round(parseFloat(priceOverrideDollars) * 100)
        : undefined;

      await onAssign(
        selectedPlanId,
        billingCycle,
        hasExpiration ? expiresAt : undefined,
        reason || undefined,
        priceOverrideCents,
        hasPriceOverride ? priceOverrideReason : undefined
      );

      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error assigning subscription:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to assign subscription'
      );
    } finally {
      setAssigning(false);
    }
  };

  const resetForm = () => {
    setSelectedPlanId('');
    setBillingCycle('monthly');
    setExpiresAt('');
    setReason('');
    setHasExpiration(false);
    setHasPriceOverride(false);
    setPriceOverrideDollars('');
    setPriceOverrideReason('');
    setError(null);
  };

  const handleClose = () => {
    if (!assigning) {
      resetForm();
      onClose();
    }
  };

  // ================================
  // HELPER FUNCTIONS
  // ================================

  const formatPrice = (cents?: number) => {
    if (!cents || cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getSelectedPlan = () => {
    return subscriptionPlans.find(
      (plan) => plan.id === parseInt(selectedPlanId)
    );
  };

  const getBillingCycleOptions = (): Array<{
    value: string;
    label: string;
  }> => {
    const selectedPlan = getSelectedPlan();
    if (!selectedPlan) return [];

    const options: Array<{ value: string; label: string }> = [];

    if (selectedPlan.price_monthly_cents) {
      options.push({
        value: 'monthly',
        label: `Monthly - ${formatPrice(selectedPlan.price_monthly_cents)}/month`
      });
    }

    if (selectedPlan.price_yearly_cents) {
      options.push({
        value: 'yearly',
        label: `Yearly - ${formatPrice(selectedPlan.price_yearly_cents)}/year`
      });
    }

    if (selectedPlan.price_lifetime_cents) {
      options.push({
        value: 'lifetime',
        label: `Lifetime - ${formatPrice(selectedPlan.price_lifetime_cents)} once`
      });
    }

    if (options.length === 0 && selectedPlan.name === 'free') {
      options.push({
        value: 'free',
        label: 'Free Plan'
      });
    }

    return options;
  };

  // ================================
  // RENDER HELPERS
  // ================================

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Subscription</h3>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={assigning}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading subscription plans...</p>
            </div>
          ) : (
            <>
              <div className="user-info">
                <h4>👤 Assigning to:</h4>
                <p>
                  <strong>{userName}</strong>
                </p>
                <p className="user-id">User ID: {userId}</p>
              </div>

              {error && (
                <div className="error-message">
                  <span>❌ {error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="subscription-plan">
                    📋 Subscription Plan <span className="required">*</span>
                  </label>
                  <select
                    id="subscription-plan"
                    value={selectedPlanId}
                    onChange={(e) => {
                      setSelectedPlanId(e.target.value);
                      setBillingCycle(''); // Reset billing cycle when plan changes
                    }}
                    required
                    disabled={assigning}
                  >
                    <option value="">Select a plan...</option>
                    {subscriptionPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.display_name} ({plan.plan_type})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlanId && (
                  <div className="form-group">
                    <label htmlFor="billing-cycle">
                      💳 Billing Cycle <span className="required">*</span>
                    </label>
                    <select
                      id="billing-cycle"
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value)}
                      required
                      disabled={assigning}
                    >
                      <option value="">Select billing cycle...</option>
                      {getBillingCycleOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={hasExpiration}
                      onChange={(e) => setHasExpiration(e.target.checked)}
                      disabled={assigning}
                    />
                    📅 Set expiration date
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={hasPriceOverride}
                      onChange={(e) => setHasPriceOverride(e.target.checked)}
                      disabled={assigning}
                    />
                    💰 Override plan pricing
                  </label>
                </div>

                {hasExpiration && (
                  <div className="form-group">
                    <label htmlFor="expires-at">
                      Expires At <span className="required">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="expires-at"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      required={hasExpiration}
                      disabled={assigning}
                    />
                  </div>
                )}

                {hasPriceOverride && (
                  <>
                    <div className="form-group">
                      <label htmlFor="price-override">
                        💰 Custom Price (USD){' '}
                        <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="price-override"
                        value={priceOverrideDollars}
                        onChange={(e) =>
                          setPriceOverrideDollars(e.target.value)
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required={hasPriceOverride}
                        disabled={assigning}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="price-override-reason">
                        💡 Price Override Reason{' '}
                        <span className="required">*</span>
                      </label>
                      <textarea
                        id="price-override-reason"
                        value={priceOverrideReason}
                        onChange={(e) => setPriceOverrideReason(e.target.value)}
                        placeholder="e.g., Trial period, Special discount, Promotional pricing..."
                        rows={2}
                        required={hasPriceOverride}
                        disabled={assigning}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="reason">📝 Assignment Reason</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional reason for this assignment..."
                    rows={3}
                    disabled={assigning}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClose}
                    disabled={assigning}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={assigning || !selectedPlanId}
                  >
                    {assigning ? '🔄 Assigning...' : '✅ Assign Subscription'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
