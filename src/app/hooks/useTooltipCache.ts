import { useCallback, useState } from 'react';

interface CachedData {
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheEntry {
  key: string;
  data: CachedData;
}

const CACHE_KEY_PREFIX = 'link_tooltip_cache_';
const CACHE_METADATA_KEY = 'link_tooltip_cache_metadata';
const DEFAULT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 50; // Maximum number of cached items
const MAX_CACHE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB total cache size limit

export const useTooltipCache = (
  url: string,
  cacheDuration = DEFAULT_CACHE_DURATION
) => {
  const [isCached, setIsCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getCacheKey = (url: string) => `${CACHE_KEY_PREFIX}${url}`;

  // Get cache metadata (list of all cached keys with their access info)
  const getCacheMetadata = (): CacheEntry[] => {
    try {
      const metadata = localStorage.getItem(CACHE_METADATA_KEY);
      return metadata ? JSON.parse(metadata) : [];
    } catch (error) {
      console.warn('Failed to get cache metadata:', error);
      return [];
    }
  };

  // Update cache metadata
  const updateCacheMetadata = (entries: CacheEntry[]) => {
    try {
      localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to update cache metadata:', error);
    }
  };

  // Calculate approximate size of cached data
  const getCacheSizeBytes = (data: any): number => {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      return 0;
    }
  };

  // Get total cache size in bytes
  const getTotalCacheSize = (): number => {
    try {
      const metadata = getCacheMetadata();
      return metadata.reduce((total, entry) => {
        return total + getCacheSizeBytes(entry.data);
      }, 0);
    } catch (error) {
      return 0;
    }
  };

  // LRU eviction: remove oldest/least used items
  const evictOldestItems = (requiredSpace: number = 0) => {
    try {
      const metadata = getCacheMetadata();
      
      // Sort by last accessed time (oldest first)
      const sortedEntries = metadata.sort((a, b) => 
        a.data.lastAccessed - b.data.lastAccessed
      );

      let freedSpace = 0;
      const entriesToRemove: string[] = [];

      // Remove items until we have enough space
      for (const entry of sortedEntries) {
        const entrySize = getCacheSizeBytes(entry.data);
        entriesToRemove.push(entry.key);
        freedSpace += entrySize;
        
        // Remove from localStorage
        localStorage.removeItem(entry.key);
        
        if (freedSpace >= requiredSpace && metadata.length - entriesToRemove.length <= MAX_CACHE_SIZE) {
          break;
        }
      }

      // Update metadata
      const remainingEntries = metadata.filter(entry => !entriesToRemove.includes(entry.key));
      updateCacheMetadata(remainingEntries);

      // Log eviction info for debugging (removed for production)
    } catch (error) {
      console.warn('Failed to evict cache items:', error);
    }
  };

  // Check if we need to evict items before adding new data
  const ensureCacheSpace = (newDataSize: number) => {
    const currentSize = getTotalCacheSize();
    const metadata = getCacheMetadata();
    
    // Check if we're over the limit in number of items
    if (metadata.length >= MAX_CACHE_SIZE) {
      evictOldestItems();
    }
    
    // Check if we're over the size limit
    if (currentSize + newDataSize > MAX_CACHE_SIZE_BYTES) {
      evictOldestItems(newDataSize);
    }
  };

  const getCachedData = useCallback(
    (url: string): CachedData | null => {
      const cacheKey = getCacheKey(url);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      try {
        const { data, timestamp, accessCount = 0, lastAccessed = timestamp } = JSON.parse(cached);
        const now = Date.now();

        if (now - timestamp > cacheDuration) {
          localStorage.removeItem(cacheKey);
          // Remove from metadata
          const metadata = getCacheMetadata();
          const updatedMetadata = metadata.filter(entry => entry.key !== cacheKey);
          updateCacheMetadata(updatedMetadata);
          return null;
        }

        // Update access info
        const updatedData: CachedData = {
          data,
          timestamp,
          accessCount: accessCount + 1,
          lastAccessed: now
        };
        localStorage.setItem(cacheKey, JSON.stringify(updatedData));

        // Update metadata
        const metadata = getCacheMetadata();
        const existingIndex = metadata.findIndex(entry => entry.key === cacheKey);
        if (existingIndex >= 0) {
          metadata[existingIndex].data = updatedData;
        }
        updateCacheMetadata(metadata);

        return updatedData;
      } catch (error) {
        console.warn('Failed to parse cached data:', error);
        localStorage.removeItem(cacheKey);
        return null;
      }
    },
    [cacheDuration]
  );

  const setCachedData = useCallback((url: string, data: any) => {
    const cacheKey = getCacheKey(url);
    const newDataSize = getCacheSizeBytes(data);
    
    // Ensure we have space for the new data
    ensureCacheSpace(newDataSize);

    const now = Date.now();
    const cacheData: CachedData = {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Update metadata
      const metadata = getCacheMetadata();
      const existingIndex = metadata.findIndex(entry => entry.key === cacheKey);
      
      if (existingIndex >= 0) {
        metadata[existingIndex].data = cacheData;
      } else {
        metadata.push({ key: cacheKey, data: cacheData });
      }
      
      updateCacheMetadata(metadata);
      setIsCached(true);
      setLastUpdated(new Date());
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // If we can't store the data, try to clear some space and retry
      evictOldestItems(newDataSize);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        setIsCached(true);
        setLastUpdated(new Date());
      } catch (retryError) {
        console.error('Failed to cache data after eviction:', retryError);
      }
    }
  }, []);

  // Clear all cache entries
  const clearAllCache = useCallback(() => {
    try {
      const metadata = getCacheMetadata();
      
      // Remove all cached items
      metadata.forEach(entry => {
        localStorage.removeItem(entry.key);
      });
      
      // Clear metadata
      localStorage.removeItem(CACHE_METADATA_KEY);
      
      setIsCached(false);
      setLastUpdated(null);
      
      // Log cache clearing info for debugging (removed for production)
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    try {
      const metadata = getCacheMetadata();
      const totalSize = getTotalCacheSize();
      
      return {
        entryCount: metadata.length,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        maxEntries: MAX_CACHE_SIZE,
        maxSizeMB: (MAX_CACHE_SIZE_BYTES / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return null;
    }
  }, []);

  return {
    isCached,
    lastUpdated,
    setIsCached,
    setLastUpdated,
    getCachedData,
    setCachedData,
    clearAllCache,
    getCacheStats
  };
};
