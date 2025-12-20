/**
 * Client component that automatically identifies users in Microsoft Clarity
 * Must be placed inside a SessionProvider to access the user session
 * 
 * @author System Wizard 🧙‍♂️
 */

'use client';

import { useClarityIdentify } from './useClarityIdentify';

/**
 * Invisible component that hooks into NextAuth session and identifies users in Clarity
 * Renders nothing - just runs the identification logic
 */
export function ClarityUserIdentifier() {
  useClarityIdentify();
  return null;
}

export default ClarityUserIdentifier;

