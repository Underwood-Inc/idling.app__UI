'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { isStandalonePwa } from './radioPwaAccess';

/**
 * Manifest-only launch URL: regular browser tabs are sent back to the main site.
 * Installed radio PWA opens here in standalone display mode.
 */
export function RadioPwaLaunchGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isStandalonePwa()) {
      router.replace('/');
    }
  }, [router]);

  if (!isStandalonePwa()) {
    return null;
  }

  return children;
}
