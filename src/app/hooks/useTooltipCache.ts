import { useCallback, useState } from 'react';

interface CachedData {
  data: any;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'link_tooltip_cache_';
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const useTooltipCache = (
  url: string,
  cacheDuration = DEFAULT_CACHE_DURATION
) => {
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getCacheKey = (url: string) => `${CACHE_KEY_PREFIX}${url}`;

  const getCachedData = useCallback(
    (url: string): CachedData | null => {
      const cacheKey = getCacheKey(url);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > cacheDuration) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return { data, timestamp };
    },
    [cacheDuration]
  );

  const setCachedData = useCallback((url: string, data: any) => {
    const cacheKey = getCacheKey(url);
    const cacheData: CachedData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    setIsCached(true);
    setLastUpdated(new Date());
  }, []);

  return {
    isCached,
    lastUpdated,
    setIsCached,
    setLastUpdated,
    getCachedData,
    setCachedData
  };
};
