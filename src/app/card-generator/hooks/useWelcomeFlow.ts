import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function useWelcomeFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [loadGenerationId, setLoadGenerationId] = useState<string>('');

  // Check if we should skip welcome (URL has generation ID)
  useEffect(() => {
    const generationIdFromUrl = searchParams.get('id');
    if (generationIdFromUrl) {
      setShowWelcome(false);
    }
  }, [searchParams]);

  const handleLoadGeneration = () => {
    if (loadGenerationId.trim()) {
      setShowWelcome(false);
      // Use Next.js router for smooth client-side navigation instead of full page reload
      router.push(`/card-generator?id=${loadGenerationId.trim()}`);
    }
  };

  const handleNewGeneration = () => {
    setShowWelcome(false);
  };

  const returnToWelcome = () => {
    setShowWelcome(true);
    setLoadGenerationId('');
    // Clear URL parameters by navigating to clean route
    router.replace('/card-generator');
  };

  // Clear welcome flow state
  const clearWelcomeFlow = useCallback(() => {
    setShowWelcome(true);
    setLoadGenerationId('');
  }, []);

  return {
    showWelcome,
    loadGenerationId,
    setLoadGenerationId,
    handleLoadGeneration,
    handleNewGeneration,
    returnToWelcome,
    clearWelcomeFlow
  };
} 