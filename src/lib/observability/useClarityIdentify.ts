/**
 * React hook to automatically identify users in Microsoft Clarity
 * Uses the existing NextAuth session to link user data
 *
 * @author System Wizard 🧙‍♂️
 */

'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { clarityIdentify, claritySetTag } from './MicrosoftClarity';

export interface UseClarityIdentifyOptions {
  /** Whether to enable identification (default: true) */
  enabled?: boolean;
  /** Additional custom tags to set on the session */
  customTags?: Record<string, string | number | boolean>;
}

/**
 * Automatically identifies the current user in Microsoft Clarity
 * Call this hook in your root layout or a client component that has access to the session
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useClarityIdentify } from '@lib/observability/useClarityIdentify';
 *
 * export function ClarityIdentifier() {
 *   useClarityIdentify({
 *     customTags: {
 *       subscriptionTier: 'pro',
 *       featureFlags: 'darkMode,betaFeatures'
 *     }
 *   });
 *   return null;
 * }
 * ```
 */
export function useClarityIdentify(options: UseClarityIdentifyOptions = {}) {
  const { enabled = true, customTags } = options;
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!enabled || status !== 'authenticated' || !session?.user) {
      return;
    }

    // Identify the user in Clarity
    const userId = session.user.id || session.user.email || 'anonymous';
    const friendlyName = session.user.name || undefined;

    clarityIdentify(userId, undefined, undefined, friendlyName);

    // Set default tags based on session
    if (session.user.email) {
      // Don't send full email for privacy - just the domain
      const emailDomain = session.user.email.split('@')[1];
      if (emailDomain) {
        claritySetTag('emailDomain', emailDomain);
      }
    }

    // Set authenticated tag
    claritySetTag('isAuthenticated', true);

    // Set any custom tags
    if (customTags) {
      Object.entries(customTags).forEach(([key, value]) => {
        claritySetTag(key, value);
      });
    }
  }, [enabled, session, status, customTags]);
}

export default useClarityIdentify;
