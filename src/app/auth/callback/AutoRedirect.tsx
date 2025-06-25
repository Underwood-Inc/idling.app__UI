'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AutoRedirectProps {
  redirectTo: string;
  delay?: number;
}

export function AutoRedirect({ redirectTo, delay = 2000 }: AutoRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectTo);
    }, delay);

    return () => clearTimeout(timer);
  }, [redirectTo, delay, router]);

  return null;
}
