'use client';

import { FlairPreference } from '@lib/actions/subscription.actions';
import { useFlairPreference } from '@lib/context/UserPreferencesContext';
import { useEffect, useState } from 'react';
import { SubscriptionBadgeData } from './SubscriptionBadge';
import './SubscriptionFlairToggle.css';

export interface SubscriptionFlairToggleProps {
  userId: string;
  className?: string;
}

// Map subscription names to flair types
const getFlairForSubscription = (
  subscription: SubscriptionBadgeData
): string | null => {
  const name = subscription.name.toLowerCase();

  if (name.includes('enterprise')) return 'enterprise-crown';
  if (subscription.plan_type === 'bundle' && name.includes('premium'))
    return 'premium-galaxy';
  if (subscription.plan_type === 'tier' && name.includes('pro'))
    return 'pro-plasma';
  if (subscription.plan_type === 'addon') return 'active-glow';
  if (subscription.status === 'trialing') return 'trial-pulse';

  return null;
};

const getFlairDisplay = (
  flairType: string
): { icon: string; label: string } => {
  switch (flairType) {
    case 'enterprise-crown':
      return { icon: '👑', label: 'Enterprise Crown' };
    case 'premium-galaxy':
      return { icon: '🌌', label: 'Premium Galaxy' };
    case 'pro-plasma':
      return { icon: '⚡', label: 'Pro Plasma' };
    case 'active-glow':
      return { icon: '✨', label: 'Active Glow' };
    case 'trial-pulse':
      return { icon: '🔄', label: 'Trial Pulse' };
    default:
      return { icon: '✨', label: 'Unknown' };
  }
};

export function SubscriptionFlairToggle({
  userId,
  className = ''
}: SubscriptionFlairToggleProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionBadgeData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [availableFlairs, setAvailableFlairs] = useState<string[]>([]);

  const {
    preference: flairPreference,
    setPreference: setFlairPreference,
    isUpdating: isUpdatingFlairPreference
  } = useFlairPreference();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/user-subscriptions?userId=${userId}&t=${Date.now()}`
        );
        if (response.ok) {
          const data = await response.json();
          const activeSubscriptions = (data.subscriptions || []).filter(
            (sub: SubscriptionBadgeData) =>
              sub.status === 'active' || sub.status === 'trialing'
          );

          setSubscriptions(activeSubscriptions);

          // Extract available flair types
          const flairs: string[] = activeSubscriptions
            .map(getFlairForSubscription)
            .filter((flair: string | null): flair is string => flair !== null);

          // Remove duplicates
          const uniqueFlairs: string[] = Array.from(new Set(flairs));
          setAvailableFlairs(uniqueFlairs);
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions for flair toggle:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [userId]);

  // Don't show if no subscriptions available
  if (loading || availableFlairs.length === 0) {
    return null;
  }

  const handleFlairChange = async (newFlair: FlairPreference) => {
    try {
      await setFlairPreference(newFlair);
    } catch (error) {
      console.error('Failed to update flair preference:', error);
    }
  };

  const containerClassName = ['subscription-flair-toggle', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName}>
      <div className="subscription-flair-toggle__header">
        <h4 className="subscription-flair-toggle__title">✨ Username Flair</h4>
        <p className="subscription-flair-toggle__description">
          Choose which subscription flair to display on your username
        </p>
      </div>

      <div className="subscription-flair-toggle__options">
        {/* Auto option */}
        <button
          className={`subscription-flair-toggle__option ${
            flairPreference === 'auto'
              ? 'subscription-flair-toggle__option--active'
              : ''
          }`}
          onClick={() => handleFlairChange('auto')}
          disabled={isUpdatingFlairPreference}
          aria-pressed={flairPreference === 'auto'}
        >
          <span className="subscription-flair-toggle__icon">✨</span>
          <div className="subscription-flair-toggle__content">
            <span className="subscription-flair-toggle__label">Auto</span>
            <span className="subscription-flair-toggle__desc">
              Show highest tier subscription flair
            </span>
          </div>
          {flairPreference === 'auto' && (
            <span className="subscription-flair-toggle__check">✓</span>
          )}
        </button>

        {/* Available flair options */}
        {availableFlairs.map((flairType) => {
          const display = getFlairDisplay(flairType);
          return (
            <button
              key={flairType}
              className={`subscription-flair-toggle__option ${
                flairPreference === flairType
                  ? 'subscription-flair-toggle__option--active'
                  : ''
              }`}
              onClick={() => handleFlairChange(flairType as FlairPreference)}
              disabled={isUpdatingFlairPreference}
              aria-pressed={flairPreference === flairType}
            >
              <span className="subscription-flair-toggle__icon">
                {display.icon}
              </span>
              <div className="subscription-flair-toggle__content">
                <span className="subscription-flair-toggle__label">
                  {display.label}
                </span>
                <span className="subscription-flair-toggle__desc">
                  From your{' '}
                  {
                    subscriptions.find(
                      (sub) => getFlairForSubscription(sub) === flairType
                    )?.display_name
                  }{' '}
                  subscription
                </span>
              </div>
              {flairPreference === flairType && (
                <span className="subscription-flair-toggle__check">✓</span>
              )}
            </button>
          );
        })}

        {/* None option */}
        <button
          className={`subscription-flair-toggle__option ${
            flairPreference === 'none'
              ? 'subscription-flair-toggle__option--active'
              : ''
          }`}
          onClick={() => handleFlairChange('none')}
          disabled={isUpdatingFlairPreference}
          aria-pressed={flairPreference === 'none'}
        >
          <span className="subscription-flair-toggle__icon">🚫</span>
          <div className="subscription-flair-toggle__content">
            <span className="subscription-flair-toggle__label">None</span>
            <span className="subscription-flair-toggle__desc">
              Hide all subscription flair
            </span>
          </div>
          {flairPreference === 'none' && (
            <span className="subscription-flair-toggle__check">✓</span>
          )}
        </button>
      </div>

      {isUpdatingFlairPreference && (
        <div className="subscription-flair-toggle__loading">
          Updating flair preference...
        </div>
      )}
    </div>
  );
}
