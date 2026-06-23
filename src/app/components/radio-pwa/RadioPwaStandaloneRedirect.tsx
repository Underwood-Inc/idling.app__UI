'use client';

import { IDLING_RADIO_PWA_START_PATH } from '@lib/radio-pwa/constants';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isStandalonePwa } from './radioPwaAccess';

/** Installed radio PWA must stay within the radio shell entry URL. */
export function RadioPwaStandaloneRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isStandalonePwa()) {
      return;
    }

    if (pathname !== IDLING_RADIO_PWA_START_PATH) {
      router.replace(IDLING_RADIO_PWA_START_PATH);
    }
  }, [pathname, router]);

  return null;
}
