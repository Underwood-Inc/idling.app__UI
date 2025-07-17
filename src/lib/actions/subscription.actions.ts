'use server';

import { SubscriptionBadgeData } from '../../app/components/subscription-badges/SubscriptionBadge';
import sql from '../db';

export type DecorationTypes =
  | 'enterprise-crown'
  | 'premium-galaxy'
  | 'pro-plasma'
  | 'active-glow'
  | 'trial-pulse';

export type FlairPreference = 'auto' | DecorationTypes | 'none';

export interface UserDecorationData {
  decoration: DecorationTypes | null;
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

    // First, get the user's flair preference setting
    const userPreference = await sql<
      Array<{ flair_preference: string | null }>
    >`
      SELECT flair_preference FROM users WHERE id = ${userIdNum}
    `;

    const flairPreference = userPreference[0]?.flair_preference || 'auto';

    // If user explicitly chose 'none', return no decoration
    if (flairPreference === 'none') {
      return { decoration: null, loading: false };
    }

    // If user chose a specific flair (not 'auto'), verify they have access to it
    if (flairPreference !== 'auto') {
      // Get user's subscriptions to verify they have access to the chosen flair
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
          AND (us.status = 'active' OR us.status = 'trialing')
        ORDER BY 
          CASE us.status 
            WHEN 'active' THEN 1
            WHEN 'trialing' THEN 2
            ELSE 3
          END,
          us.created_at DESC
      `;

      // Transform to subscription data format for checking access
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

      // Check if user has access to the chosen flair
      const hasAccessToFlair = subscriptionData.some((sub) => {
        const name = sub.name.toLowerCase();
        switch (flairPreference) {
          case 'enterprise-crown':
            return name.includes('enterprise');
          case 'premium-galaxy':
            return sub.plan_type === 'bundle' && name.includes('premium');
          case 'pro-plasma':
            return sub.plan_type === 'tier' && name.includes('pro');
          case 'active-glow':
            return sub.plan_type === 'addon';
          case 'trial-pulse':
            return sub.status === 'trialing';
          default:
            return false;
        }
      });

      // If user has access to their chosen flair, return it
      if (hasAccessToFlair) {
        return {
          decoration: flairPreference as DecorationTypes,
          loading: false
        };
      }

      // If user doesn't have access to their chosen flair, fall back to auto mode
    }

    // Auto mode: Get user's subscriptions with plan details
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

    let selectedDecoration: DecorationTypes | null = null;

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

    return { decoration: selectedDecoration, loading: false };
  } catch (error) {
    console.error('Error fetching user decoration:', error);
    return {
      decoration: null,
      loading: false,
      error: 'Failed to load decoration'
    };
  }
}
