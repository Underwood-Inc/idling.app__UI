'use client';

import { useOverlay } from '@lib/context/OverlayContext';
import React, { useState } from 'react';
import './EditSubscriptionModal.css';

interface Subscription {
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
  user_name?: string;
  user_email?: string;
  plan_display_name: string;
}

interface EditSubscriptionModalProps {
  onSave: (
    subscriptionId: string,
    updates: Partial<Subscription>
  ) => Promise<void>;
  subscription: Subscription;
}

export function EditSubscriptionModal({
  onSave,
  subscription
}: EditSubscriptionModalProps) {
  const { closeOverlay } = useOverlay();
  const [formData, setFormData] = useState({
    status: subscription.status,
    billing_cycle: subscription.billing_cycle || '',
    expires_at: subscription.expires_at
      ? subscription.expires_at.split('T')[0]
      : '',
    trial_ends_at: subscription.trial_ends_at
      ? subscription.trial_ends_at.split('T')[0]
      : '',
    assignment_reason: subscription.assignment_reason || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updates: Partial<Subscription> = {
        status: formData.status,
        billing_cycle: formData.billing_cycle || undefined,
        expires_at: formData.expires_at
          ? `${formData.expires_at}T23:59:59Z`
          : undefined,
        trial_ends_at: formData.trial_ends_at
          ? `${formData.trial_ends_at}T23:59:59Z`
          : undefined,
        assignment_reason: formData.assignment_reason || undefined
      };

      await onSave(subscription.id, updates);
      closeOverlay(`edit-subscription-modal-${subscription.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update subscription'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-subscription-modal">
      <div className="edit-subscription-modal__header">
        <h2>✏️ Edit Subscription</h2>
      </div>

      <div className="edit-subscription-modal__user-info">
        <h3>👤 {subscription.user_name || 'Unknown User'}</h3>
        <p>{subscription.user_email}</p>
        <p>
          <strong>Plan:</strong> {subscription.plan_display_name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="edit-subscription-modal__form">
        <div className="edit-subscription-modal__form-grid">
          <div className="edit-subscription-modal__form-group">
            <label htmlFor="status" className="edit-subscription-modal__label">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as Subscription['status']
                })
              }
              className="edit-subscription-modal__select"
              required
            >
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="edit-subscription-modal__form-group">
            <label
              htmlFor="billing_cycle"
              className="edit-subscription-modal__label"
            >
              Billing Cycle
            </label>
            <select
              id="billing_cycle"
              value={formData.billing_cycle}
              onChange={(e) =>
                setFormData({ ...formData, billing_cycle: e.target.value })
              }
              className="edit-subscription-modal__select"
            >
              <option value="">No billing cycle</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>

          <div className="edit-subscription-modal__form-group">
            <label
              htmlFor="expires_at"
              className="edit-subscription-modal__label"
            >
              Expires At
            </label>
            <input
              type="date"
              id="expires_at"
              value={formData.expires_at}
              onChange={(e) =>
                setFormData({ ...formData, expires_at: e.target.value })
              }
              className="edit-subscription-modal__input"
            />
            <small className="edit-subscription-modal__help">
              Leave empty for no expiration
            </small>
          </div>

          <div className="edit-subscription-modal__form-group">
            <label
              htmlFor="trial_ends_at"
              className="edit-subscription-modal__label"
            >
              Trial Ends At
            </label>
            <input
              type="date"
              id="trial_ends_at"
              value={formData.trial_ends_at}
              onChange={(e) =>
                setFormData({ ...formData, trial_ends_at: e.target.value })
              }
              className="edit-subscription-modal__input"
            />
            <small className="edit-subscription-modal__help">
              Only for trialing subscriptions
            </small>
          </div>

          <div className="edit-subscription-modal__form-group edit-subscription-modal__form-group--full-width">
            <label
              htmlFor="assignment_reason"
              className="edit-subscription-modal__label"
            >
              Assignment Reason
            </label>
            <textarea
              id="assignment_reason"
              value={formData.assignment_reason}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  assignment_reason: e.target.value
                })
              }
              className="edit-subscription-modal__textarea"
              placeholder="Reason for this subscription assignment..."
              rows={3}
            />
          </div>
        </div>

        {error && (
          <div className="edit-subscription-modal__error">
            <span>❌ {error}</span>
          </div>
        )}

        <div className="edit-subscription-modal__actions">
          <button
            type="submit"
            className="edit-subscription-modal__btn edit-subscription-modal__btn--primary"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
