'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import { SubscriptionBadgeData } from './SubscriptionBadge';
import './SubscriptionFlair.css';

export interface SubscriptionFlairProps {
  subscription: SubscriptionBadgeData;
  size?: 'sm' | 'md';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const getPlanTypeIcon = (planType: string): SiteIconId => {
  switch (planType?.toLowerCase()) {
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

const getStatusIcon = (status: string): SiteIconId => {
  switch (status?.toLowerCase()) {
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
      return 'check';
  }
};

export function SubscriptionFlair({
  subscription,
  size = 'sm',
  position = 'top-right'
}: SubscriptionFlairProps) {
  const planIconId = getPlanTypeIcon(subscription.plan_type);
  const statusIconId = getStatusIcon(subscription.status);

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
      <div className="subscription-flair__icon">
        <SiteIcon id={planIconId} sizeRem={0.75} />
      </div>
      {size === 'md' && (
        <div className="subscription-flair__status">
          <SiteIcon id={statusIconId} sizeRem={0.625} />
        </div>
      )}
    </div>
  );
}
