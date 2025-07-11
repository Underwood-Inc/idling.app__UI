'use client';

import React, { useState } from 'react';
import { useOverlay } from '../../../../lib/context/OverlayContext';
import './EditPlanModal.css';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  plan_type: 'tier' | 'addon' | 'bundle';
  price_monthly_cents?: number;
  price_yearly_cents?: number;
  price_lifetime_cents?: number;
  is_active: boolean;
  sort_order: number;
}

interface EditPlanModalProps {
  onSave: (planId: string, updates: Partial<Plan>) => Promise<void>;
  plan: Plan;
}

export function EditPlanModal({ onSave, plan }: EditPlanModalProps) {
  const { closeOverlay } = useOverlay();
  const [formData, setFormData] = useState({
    display_name: plan.display_name,
    description: plan.description || '',
    plan_type: plan.plan_type,
    price_monthly_cents: plan.price_monthly_cents || 0,
    price_yearly_cents: plan.price_yearly_cents || 0,
    price_lifetime_cents: plan.price_lifetime_cents || 0,
    is_active: plan.is_active,
    sort_order: plan.sort_order
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const updates: Partial<Plan> = {
        display_name: formData.display_name,
        description: formData.description,
        plan_type: formData.plan_type,
        price_monthly_cents: formData.price_monthly_cents,
        price_yearly_cents: formData.price_yearly_cents,
        price_lifetime_cents: formData.price_lifetime_cents,
        is_active: formData.is_active,
        sort_order: formData.sort_order
      };

      await onSave(plan.id, updates);
      closeOverlay(`edit-plan-modal-${plan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCentsTodollars = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const formatDollarsToCents = (dollars: string) => {
    return Math.round(parseFloat(dollars || '0') * 100);
  };

  return (
    <div className="edit-plan-modal">
      <div className="edit-plan-modal__header">
        <h2>✏️ Edit Plan: {plan.display_name}</h2>
      </div>

      <form onSubmit={handleSubmit} className="edit-plan-modal__form">
        <div className="edit-plan-modal__form-grid">
          <div className="edit-plan-modal__form-group">
            <label htmlFor="display_name" className="edit-plan-modal__label">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              required
              className="edit-plan-modal__input"
              placeholder="Free Tier"
            />
          </div>

          <div className="edit-plan-modal__form-group">
            <label htmlFor="plan_type" className="edit-plan-modal__label">
              Plan Type
            </label>
            <select
              id="plan_type"
              value={formData.plan_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  plan_type: e.target.value as Plan['plan_type']
                })
              }
              className="edit-plan-modal__select"
            >
              <option value="tier">Tier</option>
              <option value="addon">Add-on</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>

          <div className="edit-plan-modal__form-group edit-plan-modal__form-group--full-width">
            <label htmlFor="description" className="edit-plan-modal__label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="edit-plan-modal__textarea"
              placeholder="Plan description..."
              rows={3}
            />
          </div>

          <div className="edit-plan-modal__form-group">
            <label htmlFor="price_monthly" className="edit-plan-modal__label">
              Monthly Price ($)
            </label>
            <input
              type="number"
              id="price_monthly"
              value={formatCentsTodollars(formData.price_monthly_cents)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price_monthly_cents: formatDollarsToCents(e.target.value)
                })
              }
              step="0.01"
              min="0"
              className="edit-plan-modal__input"
              placeholder="0.00"
            />
          </div>

          <div className="edit-plan-modal__form-group">
            <label htmlFor="price_yearly" className="edit-plan-modal__label">
              Yearly Price ($)
            </label>
            <input
              type="number"
              id="price_yearly"
              value={formatCentsTodollars(formData.price_yearly_cents)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price_yearly_cents: formatDollarsToCents(e.target.value)
                })
              }
              step="0.01"
              min="0"
              className="edit-plan-modal__input"
              placeholder="0.00"
            />
          </div>

          <div className="edit-plan-modal__form-group">
            <label htmlFor="price_lifetime" className="edit-plan-modal__label">
              Lifetime Price ($)
            </label>
            <input
              type="number"
              id="price_lifetime"
              value={formatCentsTodollars(formData.price_lifetime_cents)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price_lifetime_cents: formatDollarsToCents(e.target.value)
                })
              }
              step="0.01"
              min="0"
              className="edit-plan-modal__input"
              placeholder="0.00"
            />
          </div>

          <div className="edit-plan-modal__form-group">
            <label htmlFor="sort_order" className="edit-plan-modal__label">
              Sort Order
            </label>
            <input
              type="number"
              id="sort_order"
              value={formData.sort_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sort_order: parseInt(e.target.value)
                })
              }
              min="0"
              className="edit-plan-modal__input"
              placeholder="0"
            />
          </div>

          <div className="edit-plan-modal__form-group edit-plan-modal__checkbox-group">
            <label className="edit-plan-modal__checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="edit-plan-modal__checkbox"
              />
              <span className="edit-plan-modal__checkbox-text">
                Plan is active
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="edit-plan-modal__error">
            <span>❌ {error}</span>
          </div>
        )}

        <div className="edit-plan-modal__actions">
          <button
            type="submit"
            className="edit-plan-modal__btn edit-plan-modal__btn--primary"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
