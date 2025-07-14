import { useEffect, useState } from 'react';
import {
  getAspectRatios,
  type AspectRatioOption
} from '../../actions/form-options';

interface UseFormOptionsReturn {
  data: { aspect_ratios: AspectRatioOption[] } | null;
  isLoading: boolean;
  error: string | null;
  fetchIfNeeded: () => Promise<void>;
}

export const useAspectRatios = (autoFetch = true): UseFormOptionsReturn => {
  const [data, setData] = useState<{
    aspect_ratios: AspectRatioOption[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIfNeeded = async () => {
    // Don't fetch if already loading or already have data
    if (isLoading || data) return;

    setIsLoading(true);
    setError(null);

    try {
      const aspectRatios = await getAspectRatios();
      setData({ aspect_ratios: aspectRatios });
    } catch (err) {
      console.error('Error fetching aspect ratios:', err);
      setError('Failed to fetch aspect ratios');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on mount if requested
  useEffect(() => {
    if (autoFetch && !data && !isLoading) {
      fetchIfNeeded();
    }
  }, [autoFetch, data, isLoading]);

  return {
    data,
    isLoading,
    error,
    fetchIfNeeded
  };
};
