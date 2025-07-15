'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { SubscriptionBadge, SubscriptionBadgeData } from './SubscriptionBadge';
import './SubscriptionBadgesList.css';

export interface SubscriptionBadgesListProps {
  userId: string;
  variant?: 'default' | 'compact' | 'detailed';
  maxDisplay?: number;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

// Mock data for admin testing
const mockSubscriptions: SubscriptionBadgeData[] = [
  {
    id: 'test-tier-1',
    name: 'pro',
    display_name: 'Pro',
    plan_type: 'tier',
    status: 'active',
    billing_cycle: 'monthly'
  },
  {
    id: 'test-addon-1',
    name: 'active-lifetime',
    display_name: 'Active Lifetime',
    plan_type: 'addon',
    status: 'active',
    billing_cycle: 'lifetime'
  },
  {
    id: 'test-bundle-1',
    name: 'premium-bundle',
    display_name: 'Premium Bundle',
    plan_type: 'bundle',
    status: 'trialing',
    billing_cycle: 'yearly',
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'test-tier-2',
    name: 'enterprise',
    display_name: 'Enterprise',
    plan_type: 'tier',
    status: 'pending',
    billing_cycle: 'yearly'
  },
  {
    id: 'test-addon-2',
    name: 'extra-storage',
    display_name: 'Extra Storage',
    plan_type: 'addon',
    status: 'cancelled',
    billing_cycle: 'monthly',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export function SubscriptionBadgesList({
  userId,
  variant = 'default',
  maxDisplay = 10,
  title = '🎟️ Subscriptions',
  emptyMessage = 'No active subscriptions',
  className = ''
}: SubscriptionBadgesListProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionBadgeData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminTestMode, setIsAdminTestMode] = useState(false);
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  const { data: session } = useSession();

  // Check if this is the user's own profile and if they have admin access
  useEffect(() => {
    const ownProfile = session?.user?.id?.toString() === userId?.toString();
    setIsOwnProfile(ownProfile);

    if (ownProfile) {
      // Check admin access
      const checkAdminAccess = async () => {
        try {
          const response = await fetch('/api/test/admin-check');
          if (response.ok) {
            const data = await response.json();
            setHasAdminAccess(data.hasAdminAccess);
          }
        } catch (error) {
          console.error('Error checking admin access:', error);
          setHasAdminAccess(false);
        }
      };
      checkAdminAccess();
    }
  }, [session, userId]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (isAdminTestMode) {
        setLoading(false);
        setSubscriptions(mockSubscriptions);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/user-subscriptions?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch subscriptions: ${response.status}`);
        }

        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load subscriptions';
        setError(errorMessage);
        console.error('Error fetching subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSubscriptions();
    }
  }, [userId, isAdminTestMode]);

  // Filter subscriptions based on admin preferences
  const filteredSubscriptions = showAllStatuses
    ? subscriptions
    : subscriptions.filter(
        (sub) => sub.status === 'active' || sub.status === 'trialing'
      );

  const displayedSubscriptions = filteredSubscriptions.slice(0, maxDisplay);

  const containerClassName = [
    'subscription-badges-list',
    `subscription-badges-list--${variant}`,
    className
  ]
    .filter(Boolean)
    .join(' ');

  if (loading) {
    return (
      <div className={containerClassName}>
        <div className="subscription-badges-list__container">
          <h3 className="subscription-badges-list__title">{title}</h3>
          <div className="subscription-badges-list__loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="subscription-badges-list__skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClassName}>
        <div className="subscription-badges-list__container">
          <h3 className="subscription-badges-list__title">{title}</h3>
          <div className="subscription-badges-list__error">
            Failed to load subscription data
          </div>
        </div>
      </div>
    );
  }

  if (displayedSubscriptions.length === 0) {
    return (
      <div className={containerClassName}>
        <div className="subscription-badges-list__container">
          <h3 className="subscription-badges-list__title">{title}</h3>

          {/* Admin Controls */}
          {isOwnProfile && hasAdminAccess && (
            <div className="subscription-badges-list__admin-controls">
              <div className="subscription-badges-list__admin-title">
                🛠️ Admin Testing Controls
              </div>
              <div className="subscription-badges-list__admin-buttons">
                <button
                  className={`subscription-badges-list__admin-button ${
                    isAdminTestMode
                      ? 'subscription-badges-list__admin-button--active'
                      : ''
                  }`}
                  onClick={() => setIsAdminTestMode(!isAdminTestMode)}
                >
                  {isAdminTestMode ? 'Hide' : 'Show'} Test Badges
                </button>
              </div>
            </div>
          )}

          <div className="subscription-badges-list__empty">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <div className="subscription-badges-list__container">
        <h3 className="subscription-badges-list__title">{title}</h3>

        {/* Admin Controls */}
        {isOwnProfile && hasAdminAccess && (
          <div className="subscription-badges-list__admin-controls">
            <div className="subscription-badges-list__admin-title">
              🛠️ Admin Testing Controls
            </div>
            <div className="subscription-badges-list__admin-buttons">
              <button
                className={`subscription-badges-list__admin-button ${
                  isAdminTestMode
                    ? 'subscription-badges-list__admin-button--active'
                    : ''
                }`}
                onClick={() => setIsAdminTestMode(!isAdminTestMode)}
              >
                {isAdminTestMode ? 'Hide' : 'Show'} Test Badges
              </button>
              <button
                className={`subscription-badges-list__admin-button ${
                  showAllStatuses
                    ? 'subscription-badges-list__admin-button--active'
                    : ''
                }`}
                onClick={() => setShowAllStatuses(!showAllStatuses)}
              >
                {showAllStatuses ? 'Active Only' : 'All Statuses'}
              </button>
            </div>
          </div>
        )}

        <div
          className={`subscription-badges-list__grid ${
            variant === 'compact'
              ? 'subscription-badges-list__grid--compact'
              : ''
          }`}
        >
          {displayedSubscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="subscription-badges-list__item"
            >
              <SubscriptionBadge
                subscription={subscription}
                variant={variant}
                showStatus={true}
                showBillingCycle={variant !== 'compact'}
              />
            </div>
          ))}
        </div>

        {filteredSubscriptions.length > maxDisplay && (
          <div className="subscription-badges-list__overflow">
            +{filteredSubscriptions.length - maxDisplay} more subscriptions
          </div>
        )}
      </div>
    </div>
  );
}
