/* eslint-disable no-console */
import { withRateLimit } from '@lib/middleware/withRateLimit';
import { NextRequest } from 'next/server';

// Removed Edge Runtime - using Node.js runtime for better compatibility
export const dynamic = 'force-dynamic';

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier') || 'pro';

    // This will be expanded later with actual payment processing
    const subscriptionTiers = {
      pro: {
        name: 'Pro',
        price: '$9.99/month',
        features: [
          'Unlimited OG image generations',
          'Custom dimensions',
          'Advanced shape controls',
          'Priority support'
        ],
        dailyLimit: 'unlimited'
      },
      enterprise: {
        name: 'Enterprise',
        price: '$29.99/month',
        features: [
          'Everything in Pro',
          'API access',
          'White-label options',
          'Custom integrations',
          'Dedicated support'
        ],
        dailyLimit: 'unlimited'
      }
    };

    const selectedTier =
      subscriptionTiers[tier as keyof typeof subscriptionTiers] ||
      subscriptionTiers.pro;

    return new Response(
      JSON.stringify({
        tier: selectedTier,
        message: 'Subscription tiers available',
        paymentUrl: `/subscription?tier=${tier}`, // Frontend route
        currentLimits: {
          free: {
            dailyGenerations: 1,
            advancedOptions: false
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );
  } catch (error) {
    console.error('Error in subscription API:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Apply rate limiting to handlers
export const GET = withRateLimit(getHandler);
