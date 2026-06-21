'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import './SubscriptionBadge.css';

export interface SubscriptionBadgeData {
  id: string;
  name: string;
  display_name: string;
  plan_type: 'tier' | 'addon' | 'bundle';
  status:
    | 'active'
    | 'trialing'
    | 'cancelled'
    | 'expired'
    | 'suspended'
    | 'pending';
  billing_cycle?: 'monthly' | 'yearly' | 'lifetime' | 'trial';
  expires_at?: string;
  trial_ends_at?: string;
  has_price_override?: boolean;
}

export interface SubscriptionBadgeProps {
  subscription: SubscriptionBadgeData;
  variant?: 'default' | 'compact' | 'detailed';
  showStatus?: boolean;
  showBillingCycle?: boolean;
  className?: string;
}

export function SubscriptionBadge({
  subscription,
  variant = 'default',
  showStatus = true,
  showBillingCycle = true,
  className = ''
}: SubscriptionBadgeProps) {
  const {
    name,
    display_name,
    plan_type,
    status,
    billing_cycle,
    expires_at,
    trial_ends_at,
    has_price_override
  } = subscription;

  // Determine badge styling based on plan type and status
  const getBadgeStyle = () => {
    const baseClasses = ['subscription-badge'];

    // Plan type styling
    baseClasses.push(`subscription-badge--${plan_type}`);

    // Status styling
    baseClasses.push(`subscription-badge--${status}`);

    // Variant styling
    baseClasses.push(`subscription-badge--${variant}`);

    // Special indicators
    if (has_price_override) {
      baseClasses.push('subscription-badge--override');
    }

    if (trial_ends_at && status === 'trialing') {
      baseClasses.push('subscription-badge--trial');
    }

    return baseClasses.join(' ');
  };

  const getPlanTypeIcon = (): SiteIconId => {
    switch (plan_type) {
      case 'tier':
        return 'crown';
      case 'addon':
        return 'wrench';
      case 'bundle':
        return 'package';
      default:
        return 'star';
    }
  };

  const getStatusIcon = (): SiteIconId => {
    switch (status) {
      case 'active':
        return 'check';
      case 'trialing':
        return 'refresh';
      case 'cancelled':
        return 'circleX';
      case 'expired':
        return 'clock';
      case 'suspended':
        return 'pause';
      case 'pending':
        return 'loader';
      default:
        return 'circleHelp';
    }
  };

  // Get billing cycle display
  const getBillingCycleDisplay = () => {
    switch (billing_cycle) {
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'lifetime':
        return 'Lifetime';
      case 'trial':
        return 'Trial';
      default:
        return '';
    }
  };

  // Format expiration date
  const getExpirationText = () => {
    if (trial_ends_at && status === 'trialing') {
      const trialEnd = new Date(trial_ends_at);
      return `Trial ends ${trialEnd.toLocaleDateString()}`;
    }

    if (expires_at) {
      const expiration = new Date(expires_at);
      return `Expires ${expiration.toLocaleDateString()}`;
    }

    return '';
  };

  if (variant === 'compact') {
    return (
      <div className={`${getBadgeStyle()} ${className}`}>
        <span className="subscription-badge__icon">
          <SiteIcon id={getPlanTypeIcon()} sizeRem={0.875} />
        </span>
        <span className="subscription-badge__name">{display_name}</span>
        {showStatus && (
          <span className="subscription-badge__status-icon">
            <SiteIcon id={getStatusIcon()} sizeRem={0.75} />
          </span>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`${getBadgeStyle()} ${className}`}>
        <div className="subscription-badge__header">
          <span className="subscription-badge__icon">
          <SiteIcon id={getPlanTypeIcon()} sizeRem={0.875} />
        </span>
          <div className="subscription-badge__title-section">
            <span className="subscription-badge__name">{display_name}</span>
            <span className="subscription-badge__type">
              {plan_type.charAt(0).toUpperCase() + plan_type.slice(1)}
            </span>
          </div>
          {showStatus && (
            <span className="subscription-badge__status-icon">
              <SiteIcon id={getStatusIcon()} sizeRem={0.75} />
            </span>
          )}
        </div>

        <div className="subscription-badge__details">
          {showStatus && (
            <div className="subscription-badge__detail-item">
              <span className="subscription-badge__detail-label">Status:</span>
              <span className="subscription-badge__detail-value">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          )}

          {showBillingCycle && billing_cycle && (
            <div className="subscription-badge__detail-item">
              <span className="subscription-badge__detail-label">Billing:</span>
              <span className="subscription-badge__detail-value">
                {getBillingCycleDisplay()}
              </span>
            </div>
          )}

          {getExpirationText() && (
            <div className="subscription-badge__detail-item">
              <span className="subscription-badge__expiration">
                {getExpirationText()}
              </span>
            </div>
          )}

          {has_price_override && (
            <div className="subscription-badge__detail-item">
              <span className="subscription-badge__override-notice">
                <SiteIcon id="gift" sizeRem={0.75} />
                Special Pricing
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`${getBadgeStyle()} ${className}`}>
      <span className="subscription-badge__icon">
        <SiteIcon id={getPlanTypeIcon()} sizeRem={0.875} />
      </span>
      <div className="subscription-badge__content">
        <span className="subscription-badge__name">{display_name}</span>
        <div className="subscription-badge__meta">
          {showStatus && (
            <span className="subscription-badge__status">
              <SiteIcon id={getStatusIcon()} sizeRem={0.75} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
          {showBillingCycle && billing_cycle && (
            <span className="subscription-badge__billing">
              {getBillingCycleDisplay()}
            </span>
          )}
        </div>
      </div>

      {getExpirationText() && (
        <div className="subscription-badge__expiration">
          {getExpirationText()}
        </div>
      )}

      {has_price_override && (
        <div className="subscription-badge__override-indicator">
          <SiteIcon id="gift" sizeRem={0.75} />
        </div>
      )}
    </div>
  );
}
