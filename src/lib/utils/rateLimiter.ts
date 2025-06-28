/**
 * Rate Limiter with Exponential Backoff and Attack Prevention
 * 
 * Features:
 * - Multiple rate limiting tiers (per IP, per user, per endpoint)
 * - Exponential backoff for repeated violations
 * - Sliding window algorithm for accurate rate limiting
 * - Memory-efficient with automatic cleanup
 * - Attack detection and progressive penalties
 */

interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  requests: number[];      // Timestamps of requests
  violations: number;      // Number of violations
  lastViolation: number;   // Timestamp of last violation
  backoffUntil: number;    // Timestamp when backoff expires
  penaltyLevel: number;    // Current penalty level (0-5)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  penaltyLevel: number;
  isAttack: boolean;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;
  
  // Rate limiting configurations for different scenarios
  private static readonly CONFIGS = {
    // Standard API requests (per IP)
    api: {
      windowMs: 60 * 1000,     // 1 minute
      maxRequests: 100,        // 100 requests per minute
    },
    
    // Authentication endpoints (per IP)
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,          // 10 auth attempts per 15 minutes
    },
    
    // Upload endpoints (per user)
    upload: {
      windowMs: 60 * 1000,     // 1 minute
      maxRequests: 5,          // 5 uploads per minute
    },
    
    // Search/filter endpoints (per IP)
    search: {
      windowMs: 60 * 1000,     // 1 minute
      maxRequests: 200,        // 200 searches per minute
    },
    
    // Admin endpoints (per user)
    admin: {
      windowMs: 60 * 1000,     // 1 minute
      maxRequests: 50,         // 50 admin actions per minute
    },
    
    // Aggressive rate limiting for detected attacks
    attack: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1,           // 1 request per hour
    }
  } as const;

  constructor() {
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   */
  public checkRateLimit(
    identifier: string,
    configType: keyof typeof RateLimiter.CONFIGS = 'api'
  ): RateLimitResult {
    const config = RateLimiter.CONFIGS[configType];
    const key = this.generateKey(identifier, configType);
    const now = Date.now();
    
    let entry = this.store.get(key);
    if (!entry) {
      entry = {
        requests: [],
        violations: 0,
        lastViolation: 0,
        backoffUntil: 0,
        penaltyLevel: 0
      };
      this.store.set(key, entry);
    }

    // Check if currently in backoff period
    if (entry.backoffUntil > now) {
      const isAttack = entry.penaltyLevel >= 3;
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.backoffUntil,
        retryAfter: Math.ceil((entry.backoffUntil - now) / 1000),
        penaltyLevel: entry.penaltyLevel,
        isAttack
      };
    }

    // Clean old requests outside the window
    const windowStart = now - config.windowMs;
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

    // Check if request is allowed
    const remaining = Math.max(0, config.maxRequests - entry.requests.length);
    const allowed = entry.requests.length < config.maxRequests;

    if (allowed) {
      // Add current request
      entry.requests.push(now);
      
      // Gradually reduce penalty level for good behavior
      if (entry.penaltyLevel > 0 && now - entry.lastViolation > config.windowMs * 2) {
        entry.penaltyLevel = Math.max(0, entry.penaltyLevel - 1);
      }
    } else {
      // Rate limit exceeded - apply backoff
      entry.violations++;
      entry.lastViolation = now;
      entry.penaltyLevel = Math.min(5, entry.penaltyLevel + 1);
      
      // Calculate exponential backoff
      const baseBackoff = this.calculateBackoff(entry.penaltyLevel, config.windowMs);
      entry.backoffUntil = now + baseBackoff;
    }

    const isAttack = entry.penaltyLevel >= 3 || entry.violations >= 10;
    
    return {
      allowed,
      remaining: allowed ? remaining - 1 : 0,
      resetTime: windowStart + config.windowMs,
      retryAfter: allowed ? undefined : Math.ceil((entry.backoffUntil - now) / 1000),
      penaltyLevel: entry.penaltyLevel,
      isAttack
    };
  }

  /**
   * Calculate exponential backoff time
   */
  private calculateBackoff(penaltyLevel: number, baseWindow: number): number {
    // Exponential backoff: 2^level * baseWindow, with jitter
    const backoffMs = Math.pow(2, penaltyLevel) * baseWindow;
    const jitter = Math.random() * 0.1 * backoffMs; // Add 10% jitter
    const maxBackoff = 60 * 60 * 1000; // Cap at 1 hour
    
    return Math.min(backoffMs + jitter, maxBackoff);
  }

  /**
   * Generate a unique key for rate limiting
   */
  private generateKey(identifier: string, configType: string): string {
    return `${configType}:${identifier}`;
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, entry] of this.store.entries()) {
      // Remove entries that haven't been used recently and are not in backoff
      const lastActivity = Math.max(
        entry.requests[entry.requests.length - 1] || 0,
        entry.lastViolation,
        entry.backoffUntil
      );
      
      if (now - lastActivity > maxAge) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current stats for monitoring
   */
  public getStats(): {
    totalEntries: number;
    activeBackoffs: number;
    highPenaltyEntries: number;
  } {
    const now = Date.now();
    let activeBackoffs = 0;
    let highPenaltyEntries = 0;
    
    for (const entry of this.store.values()) {
      if (entry.backoffUntil > now) {
        activeBackoffs++;
      }
      if (entry.penaltyLevel >= 3) {
        highPenaltyEntries++;
      }
    }
    
    return {
      totalEntries: this.store.size,
      activeBackoffs,
      highPenaltyEntries
    };
  }

  /**
   * Reset rate limit for a specific identifier (admin use)
   */
  public resetRateLimit(identifier: string, configType: keyof typeof RateLimiter.CONFIGS = 'api'): void {
    const key = this.generateKey(identifier, configType);
    this.store.delete(key);
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter, type RateLimitConfig, type RateLimitResult };
export default rateLimiter; 