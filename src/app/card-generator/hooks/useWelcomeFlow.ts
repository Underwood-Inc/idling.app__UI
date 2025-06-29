import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useWelcomeFlow() {
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
      window.location.href = `/card-generator?id=${loadGenerationId.trim()}`;
    }
  };

  const handleNewGeneration = () => {
    setShowWelcome(false);
  };

  const returnToWelcome = () => {
    setShowWelcome(true);
    setLoadGenerationId('');
  };

  return {
    showWelcome,
    loadGenerationId,
    setLoadGenerationId,
    handleLoadGeneration,
    handleNewGeneration,
    returnToWelcome
  };
} 