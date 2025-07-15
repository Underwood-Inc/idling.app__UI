'use client';

import React, { useEffect, useState } from 'react';
import './AvatarDecoration.css';
import { SubscriptionBadgeData } from './SubscriptionBadge';

export interface AvatarDecorationProps {
  userId?: string;
  size?: 'full' | 'lg' | 'md' | 'sm' | 'xs' | 'xxs';
  children: React.ReactNode;
  forceDecoration?: string; // For admin testing
}

const decorationHierarchy = [
  'enterprise-crown',
  'premium-galaxy',
  'pro-plasma',
  'active-glow',
  'trial-pulse'
];

export function AvatarDecoration({
  userId,
  size = 'md',
  children,
  forceDecoration
}: AvatarDecorationProps) {
  const [decoration, setDecoration] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (forceDecoration) {
      setDecoration(forceDecoration);
      return;
    }

    if (!userId) return;

    const fetchDecoration = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/user-subscriptions?userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          const subscriptions: SubscriptionBadgeData[] =
            data.subscriptions || [];

          // Determine the highest tier decoration based on active subscriptions
          const activeSubscriptions = subscriptions.filter(
            (sub) => sub.status === 'active' || sub.status === 'trialing'
          );

          let selectedDecoration = null;

          // Priority order: enterprise > premium bundles > pro tiers > addons > trial
          for (const sub of activeSubscriptions) {
            if (sub.name.toLowerCase().includes('enterprise')) {
              selectedDecoration = 'enterprise-crown';
              break;
            } else if (sub.plan_type === 'bundle' && sub.status === 'active') {
              selectedDecoration = 'premium-galaxy';
            } else if (
              sub.plan_type === 'tier' &&
              sub.status === 'active' &&
              !selectedDecoration
            ) {
              selectedDecoration = 'pro-plasma';
            } else if (
              sub.plan_type === 'addon' &&
              sub.status === 'active' &&
              !selectedDecoration
            ) {
              selectedDecoration = 'active-glow';
            } else if (sub.status === 'trialing' && !selectedDecoration) {
              selectedDecoration = 'trial-pulse';
            }
          }

          setDecoration(selectedDecoration);
        }
      } catch (error) {
        console.error('Failed to fetch subscription decoration:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDecoration();
  }, [userId, forceDecoration]);

  if (!decoration) {
    return <>{children}</>;
  }

  return (
    <div
      className={`avatar-decoration avatar-decoration--${decoration} avatar-decoration--${size}`}
    >
      {/* Animated Ring Effects */}
      {decoration === 'enterprise-crown' && (
        <>
          <div className="avatar-decoration__ring avatar-decoration__ring--enterprise-outer" />
          <div className="avatar-decoration__ring avatar-decoration__ring--enterprise-inner" />
          <div className="avatar-decoration__crown">👑</div>
        </>
      )}

      {decoration === 'premium-galaxy' && (
        <>
          <div className="avatar-decoration__ring avatar-decoration__ring--galaxy-outer" />
          <div className="avatar-decoration__ring avatar-decoration__ring--galaxy-inner" />
          <div className="avatar-decoration__particles">
            <div className="avatar-decoration__particle avatar-decoration__particle--star">
              ⭐
            </div>
            <div className="avatar-decoration__particle avatar-decoration__particle--sparkle">
              ✨
            </div>
            <div className="avatar-decoration__particle avatar-decoration__particle--diamond">
              💎
            </div>
          </div>
        </>
      )}

      {decoration === 'pro-plasma' && (
        <>
          <div className="avatar-decoration__ring avatar-decoration__ring--plasma-outer" />
          <div className="avatar-decoration__ring avatar-decoration__ring--plasma-inner" />
        </>
      )}

      {decoration === 'active-glow' && (
        <div className="avatar-decoration__glow avatar-decoration__glow--active" />
      )}

      {decoration === 'trial-pulse' && (
        <div className="avatar-decoration__pulse avatar-decoration__pulse--trial" />
      )}

      {/* Avatar Content */}
      <div className="avatar-decoration__content">{children}</div>

      {/* Loading overlay */}
      {loading && (
        <div className="avatar-decoration__loading">
          <div className="avatar-decoration__spinner" />
        </div>
      )}
    </div>
  );
}
