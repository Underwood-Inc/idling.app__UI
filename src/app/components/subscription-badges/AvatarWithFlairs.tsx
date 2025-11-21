'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarPropSizes } from '../avatar/Avatar';
import './AvatarWithFlairs.css';
import { SubscriptionBadgeData } from './SubscriptionBadge';
import { SubscriptionFlair } from './SubscriptionFlair';

export interface AvatarWithFlairsProps {
  seed?: string;
  size?: AvatarPropSizes;
  userId?: string;
  enableTooltip?: boolean;
  tooltipScale?: 2 | 3 | 4;
  showFlairs?: boolean;
  maxFlairs?: number;
  flairSize?: 'sm' | 'md';
}

const positions: Array<
  'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
> = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];

export function AvatarWithFlairs({
  seed,
  size = 'md',
  userId,
  enableTooltip = false,
  tooltipScale = 2,
  showFlairs = true,
  maxFlairs = 3,
  flairSize = 'sm'
}: AvatarWithFlairsProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionBadgeData[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showFlairs || !userId) return;

    const fetchSubscriptions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/user-subscriptions?userId=${userId}`,
          {
            headers: {
              'X-Background-Request': 'true' // Mark as background to skip global loader
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data.subscriptions || []);
        }
      } catch (error) {
        console.error('Failed to fetch subscription flairs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [userId, showFlairs]);

  // Filter to active subscriptions and limit by maxFlairs
  const activeSubscriptions = subscriptions
    .filter((sub) => sub.status === 'active' || sub.status === 'trialing')
    .slice(0, maxFlairs);

  return (
    <div className={`avatar-with-flairs avatar-with-flairs--${size}`}>
      <Avatar
        seed={seed}
        size={size}
        enableTooltip={enableTooltip}
        tooltipScale={tooltipScale}
      />

      {showFlairs &&
        !loading &&
        activeSubscriptions.map((subscription, index) => (
          <SubscriptionFlair
            key={subscription.id}
            subscription={subscription}
            size={flairSize}
            position={positions[index % positions.length]}
          />
        ))}

      {loading && showFlairs && (
        <div className="avatar-with-flairs__loading">
          <div className="avatar-with-flairs__skeleton-flair" />
        </div>
      )}
    </div>
  );
}
