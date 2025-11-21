/**
 * Request Deduplication Utility
 * Prevents duplicate server action calls by caching in-flight requests
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds cache
  private readonly PENDING_TTL = 30000; // 30 seconds for pending requests

  /**
   * Generate a cache key from function name and arguments
   */
  private generateKey(fnName: string, args: any[]): string {
    return `${fnName}:${JSON.stringify(args)}`;
  }

  /**
   * Clean up expired pending requests and cache entries
   */
  private cleanup() {
    const now = Date.now();

    // Clean up stale pending requests
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.PENDING_TTL) {
        this.pendingRequests.delete(key);
      }
    }

    // Clean up expired cache entries
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Deduplicate a server action call
   * If the same call is in-flight, return the existing promise
   * If cached and fresh, return cached data
   * Otherwise, execute the function and cache the promise
   */
  async deduplicate<T>(
    fnName: string,
    fn: () => Promise<T>,
    args: any[]
  ): Promise<T> {
    const key = this.generateKey(fnName, args);
    const now = Date.now();

    // Check cache first
    const cached = this.cache.get(key);
    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      // console.log(`[Dedup] Cache HIT for ${key}`);
      return cached.data;
    }

    // Check if request is already in-flight
    const pending = this.pendingRequests.get(key);
    if (pending) {
      // console.log(`[Dedup] Reusing in-flight request for ${key}`);
      return pending.promise;
    }

    // Execute new request
    // console.log(`[Dedup] New request for ${key}`);
    const promise = fn()
      .then((data) => {
        // Cache the result
        this.cache.set(key, { data, timestamp: Date.now() });
        // Remove from pending
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store pending request
    this.pendingRequests.set(key, { promise, timestamp: now });

    // Periodic cleanup
    if (Math.random() < 0.1) {
      // 10% chance to trigger cleanup
      this.cleanup();
    }

    return promise;
  }

  /**
   * Clear all cache and pending requests
   */
  clear() {
    this.pendingRequests.clear();
    this.cache.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      cachedItems: this.cache.size
    };
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Debug helper (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugDedup = {
    getStats: () => requestDeduplicator.getStats(),
    clear: () => requestDeduplicator.clear()
  };
}

