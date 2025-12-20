/**
 * Microsoft Clarity Integration
 * Free unlimited heatmaps, session recordings, and user behavior analytics
 * 
 * @see https://clarity.microsoft.com
 * @author System Wizard 🧙‍♂️
 */

'use client';

import Script from 'next/script';

export interface MicrosoftClarityProps {
  /** Your Clarity project ID from https://clarity.microsoft.com */
  projectId?: string;
  /** Enable debug mode for development */
  debug?: boolean;
}

/**
 * Microsoft Clarity script component
 * Provides: Heatmaps, Session Recordings, Click Maps, Scroll Maps, Rage Click Detection
 * 
 * Add to your root layout to enable tracking across all pages.
 * 
 * @example
 * ```tsx
 * // In layout.tsx
 * import { MicrosoftClarity } from '@lib/observability/MicrosoftClarity';
 * 
 * <MicrosoftClarity projectId="your-project-id" />
 * ```
 */
export function MicrosoftClarity({ 
  projectId, 
  debug = false 
}: MicrosoftClarityProps) {
  // Use environment variable if no projectId provided
  const clarityId = projectId || process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  // Don't render if no project ID is configured
  if (!clarityId) {
    if (debug) {
      console.warn('🧙‍♂️ Microsoft Clarity: No project ID configured. Set NEXT_PUBLIC_CLARITY_PROJECT_ID or pass projectId prop.');
    }
    return null;
  }

  // Don't load in development unless explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  const enableInDev = process.env.NEXT_PUBLIC_CLARITY_ENABLE_DEV === 'true';
  
  if (isDevelopment && !enableInDev) {
    if (debug) {
      console.log('🧙‍♂️ Microsoft Clarity: Disabled in development. Set NEXT_PUBLIC_CLARITY_ENABLE_DEV=true to enable.');
    }
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
          ${debug ? 'console.log("🧙‍♂️ Microsoft Clarity loaded with project ID: ' + clarityId + '");' : ''}
        `,
      }}
    />
  );
}

// ================================
// CLARITY API HELPERS
// ================================

/**
 * Type declarations for the Clarity global object
 */
declare global {
  interface Window {
    clarity?: ClarityFunction;
  }
}

type ClarityFunction = {
  (action: 'set', key: string, value: string | number | boolean): void;
  (action: 'identify', customUserId: string, customSessionId?: string, customPageId?: string, friendlyName?: string): void;
  (action: 'consent'): void;
  (action: 'upgrade', reason: string): void;
  (action: 'event', eventName: string): void;
  q?: unknown[];
};

/**
 * Set a custom tag on the current session
 * Useful for segmenting sessions by user type, subscription, etc.
 * 
 * @example
 * ```ts
 * claritySetTag('userType', 'premium');
 * claritySetTag('subscriptionTier', 'pro');
 * ```
 */
export function claritySetTag(key: string, value: string | number | boolean): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('set', key, value);
  }
}

/**
 * Identify a user in Clarity for cross-session tracking
 * 
 * @example
 * ```ts
 * clarityIdentify('user-123', undefined, undefined, 'John Doe');
 * ```
 */
export function clarityIdentify(
  customUserId: string, 
  customSessionId?: string, 
  customPageId?: string, 
  friendlyName?: string
): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('identify', customUserId, customSessionId, customPageId, friendlyName);
  }
}

/**
 * Record user consent for Clarity tracking
 * Call this after user accepts cookies/tracking
 */
export function clarityConsent(): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('consent');
  }
}

/**
 * Upgrade the current session to be prioritized for recording
 * Useful for capturing important user journeys
 * 
 * @example
 * ```ts
 * clarityUpgrade('checkout-started');
 * clarityUpgrade('error-occurred');
 * ```
 */
export function clarityUpgrade(reason: string): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('upgrade', reason);
  }
}

/**
 * Track a custom event in Clarity
 * 
 * @example
 * ```ts
 * clarityEvent('button-clicked');
 * clarityEvent('form-submitted');
 * ```
 */
export function clarityEvent(eventName: string): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('event', eventName);
  }
}

export default MicrosoftClarity;

