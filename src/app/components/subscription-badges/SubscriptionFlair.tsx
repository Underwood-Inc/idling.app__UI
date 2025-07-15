'use client';

import { SubscriptionBadgeData } from './SubscriptionBadge';
import './SubscriptionFlair.css';

export interface SubscriptionFlairProps {
  subscription: SubscriptionBadgeData;
  size?: 'sm' | 'md';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function SubscriptionFlair({
  subscription,
  size = 'sm',
  position = 'top-right'
}: SubscriptionFlairProps) {
  const getPlanTypeIcon = (planType: string) => {
    switch (planType?.toLowerCase()) {
      case 'tier':
        return '👑';
      case 'addon':
        return '🔧';
      case 'bundle':
        return '📦';
      default:
        return '⭐';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '✅';
      case 'trialing':
        return '🔄';
      case 'cancelled':
        return '❌';
      case 'expired':
        return '⏰';
      case 'suspended':
        return '⏸️';
      case 'pending':
        return '⏳';
      default:
        return '✅';
    }
  };

  const planIcon = getPlanTypeIcon(subscription.plan_type);
  const statusIcon = getStatusIcon(subscription.status);

  const flairClassName = [
    'subscription-flair',
    `subscription-flair--${size}`,
    `subscription-flair--${position}`,
    `subscription-flair--${subscription.plan_type?.toLowerCase() || 'tier'}`,
    `subscription-flair--${subscription.status?.toLowerCase() || 'active'}`
  ].join(' ');

  return (
    <div
      className={flairClassName}
      title={`${subscription.name} - ${subscription.status}`}
    >
      <div className="subscription-flair__icon">{planIcon}</div>
      {size === 'md' && (
        <div className="subscription-flair__status">{statusIcon}</div>
      )}
    </div>
  );
}
