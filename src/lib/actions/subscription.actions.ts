'use server';

import { SubscriptionBadgeData } from '../../app/components/subscription-badges/SubscriptionBadge';
import sql from '../db';

export interface UserDecorationData {
  decoration: string | null;
  loading: boolean;
  error?: string;
}

/**
 * Server action to get user decoration based on their active subscriptions
 * This replaces the inline fetch in the UsernameDecoration component
 */
export async function getUserDecoration(
  userId: string
): Promise<UserDecorationData> {
  try {
    if (!userId) {
      return { decoration: null, loading: false };
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return { decoration: null, loading: false, error: 'Invalid user ID' };
    }

    // Get user's subscriptions with plan details
    const subscriptions = await sql<
      Array<{
        subscription_id: number;
        plan_id: number;
        plan_name: string;
        plan_display_name: string;
        plan_type: string;
        status: string;
        billing_cycle: string | null;
        expires_at: string | null;
        trial_ends_at: string | null;
        admin_price_override_cents: number | null;
        created_at: string;
      }>
    >`
      SELECT 
        us.id as subscription_id,
        us.plan_id,
        sp.name as plan_name,
        sp.display_name as plan_display_name,
        sp.plan_type,
        us.status,
        us.billing_cycle,
        us.expires_at,
        us.trial_ends_at,
        us.admin_price_override_cents,
        us.created_at
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = ${userIdNum}
        AND sp.is_active = true
      ORDER BY 
        CASE us.status 
          WHEN 'active' THEN 1
          WHEN 'trialing' THEN 2
          WHEN 'pending' THEN 3
          WHEN 'suspended' THEN 4
          WHEN 'cancelled' THEN 5
          WHEN 'expired' THEN 6
          ELSE 7
        END,
        us.created_at DESC
    `;

    // Transform to subscription data format
    const subscriptionData: SubscriptionBadgeData[] = subscriptions.map(
      (sub) => ({
        id: sub.subscription_id.toString(),
        name: sub.plan_name,
        display_name: sub.plan_display_name,
        plan_type: sub.plan_type as 'tier' | 'addon' | 'bundle',
        status: sub.status as
          | 'active'
          | 'trialing'
          | 'cancelled'
          | 'expired'
          | 'suspended'
          | 'pending',
        billing_cycle: sub.billing_cycle as
          | 'monthly'
          | 'yearly'
          | 'lifetime'
          | 'trial'
          | undefined,
        expires_at: sub.expires_at || undefined,
        trial_ends_at: sub.trial_ends_at || undefined,
        has_price_override: sub.admin_price_override_cents !== null
      })
    );

    // Determine the highest tier decoration based on active subscriptions
    const activeSubscriptions = subscriptionData.filter(
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

    return {
      decoration: selectedDecoration,
      loading: false
    };
  } catch (error) {
    console.error('Failed to fetch user decoration:', error);
    return {
      decoration: null,
      loading: false,
      error: 'Failed to fetch subscription data'
    };
  }
}
