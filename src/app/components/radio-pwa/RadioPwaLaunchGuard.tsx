'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isStandalonePwa } from './radioPwaAccess';

/**
 * Manifest-only launch URL: regular browser tabs are sent back to the main site.
 * Installed radio PWA opens here in standalone display mode.
 */
export function RadioPwaLaunchGuard() {
  const router = useRouter();

  useEffect(() => {
    if (!isStandalonePwa()) {
      router.replace('/');
    }
  }, [router]);

  return null;
}
