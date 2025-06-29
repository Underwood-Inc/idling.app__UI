/**
 * Unified Rate Limiting Service
 * 
 * A composable rate limiting system that handles all rate limiting needs:
 * - Per-minute API limits (sliding window)
 * - Daily quota limits (database-backed)
 * - Custom rate limiting configurations
 * - Development bypass support
 * - Attack detection and progressive penalties
 */

import { DatabaseService } from '../../app/api/og-image/services/DatabaseService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  storage?: 'memory' | 'database'; // Storage type
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyPrefix?: string;      // Custom key prefix for this limiter
}

export interface RateLimitEntry {
  requests: number[];      // Timestamps of requests (memory)
  violations: number;      // Number of violations
  lastViolation: number;   // Timestamp of last violation
  backoffUntil: number;    // Timestamp when backoff expires
  penaltyLevel: number;    // Current penalty level (0-5)
  dailyCount?: number;     // Daily count (database)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  penaltyLevel: number;
  isAttack: boolean;
  quotaType: 'per-minute' | 'daily' | 'custom';
}

export interface RateLimitOptions {
  identifier: string;
  configType: keyof typeof RateLimitService.CONFIGS | string;
  customConfig?: RateLimitConfig;
  bypassDevelopment?: boolean;
}

// ============================================================================
// UNIFIED RATE LIMIT SERVICE
// ============================================================================

export class RateLimitService {
  private memoryStore = new Map<string, RateLimitEntry>();
  private databaseService: DatabaseService | null = null;
  private cleanupInterval: ReturnType<typeof setInterval>;
  private static instance: RateLimitService;

  // Unified configuration for all rate limiting scenarios
  public static readonly CONFIGS = {
    // Standard API requests (per IP) - sliding window
    api: {
      windowMs: 60 * 1000,     // 1 minute
      maxRequests: 100,        // 100 requests per minute
      storage: 'memory' as const,
      keyPrefix: 'api'
    },
    
    // Authentication endpoints (per IP) - sliding window
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,          // 10 auth attempts per 15 minutes
      storage: 'memory' as const,
      keyPrefix: 'auth'
    },
    
    // Upload endpoints (per user) - sliding window
    upload: {
      windowMs: 60 * 1000,     // 1 minute
      maxRequests: 5,          // 5 uploads per minute
      storage: 'memory' as const,
      keyPrefix: 'upload'
    },
    
    // Search/filter endpoints (per IP) - sliding window
    search: {
      windowMs: 60 * 1000,     // 1 minute
      maxRequests: 200,        // 200 searches per minute
      storage: 'memory' as const,
      keyPrefix: 'search'
    },
    
    // Admin endpoints (per user) - sliding window
    admin: {
      windowMs: 60 * 1000,     // 1 minute
      maxRequests: 50,         // 50 admin actions per minute
      storage: 'memory' as const,
      keyPrefix: 'admin'
    },
    
    // OG Image generation - DAILY quota with database persistence
    'og-image': {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours (1 day)
      maxRequests: 1,          // 1 generation per day
      storage: 'database' as const,
      keyPrefix: 'og-daily'
    },
    
    // Aggressive rate limiting for detected attacks
    attack: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1,           // 1 request per hour
      storage: 'memory' as const,
      keyPrefix: 'attack'
    }
  } as const;

  constructor() {
    // Initialize database service for daily quotas - with better error handling
    try {
      this.databaseService = DatabaseService.getInstance();
    } catch (error) {
      console.warn('Database service unavailable, falling back to memory-only rate limiting:', error);
      this.databaseService = null;
    }

    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  // Singleton pattern for global access
  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  // ============================================================================
  // MAIN RATE LIMITING METHOD
  // ============================================================================

  /**
   * Check if a request should be rate limited
   * This is the main method that handles all rate limiting scenarios
   */
  public async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const { identifier, configType, customConfig, bypassDevelopment = true } = options;

    // Development bypass - return allowed if bypass is enabled
    if (bypassDevelopment && process.env.BYPASS_RATE_LIMIT === 'true') {
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 60000,
        penaltyLevel: 0,
        isAttack: false,
        quotaType: 'custom'
      };
    }

    // Get configuration (built-in or custom)
    const config = customConfig || 
                   RateLimitService.CONFIGS[configType as keyof typeof RateLimitService.CONFIGS] || 
                   RateLimitService.CONFIGS.api;

    // Route to appropriate rate limiting method based on storage type
    if (config.storage === 'database') {
      return await this.checkDatabaseRateLimit(identifier, config);
    } else {
      return this.checkMemoryRateLimit(identifier, config);
    }
  }

  // ============================================================================
  // MEMORY-BASED RATE LIMITING (sliding window)
  // ============================================================================

  private checkMemoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const key = this.generateKey(identifier, config.keyPrefix || 'default');
    const now = Date.now();
    
    let entry = this.memoryStore.get(key);
    if (!entry) {
      entry = {
        requests: [],
        violations: 0,
        lastViolation: 0,
        backoffUntil: 0,
        penaltyLevel: 0
      };
      this.memoryStore.set(key, entry);
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
        isAttack,
        quotaType: 'per-minute'
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
      isAttack,
      quotaType: 'per-minute'
    };
  }

  // ============================================================================
  // DATABASE-BASED RATE LIMITING (daily quotas)
  // ============================================================================

  private async checkDatabaseRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      if (!this.databaseService) {
        // Fallback to memory if database unavailable
        console.warn('Database service unavailable for rate limiting, falling back to memory');
        return this.checkMemoryRateLimit(identifier, config);
      }

      const dailyCount = await this.databaseService.getDailyGenerationCount(identifier);
      const remaining = Math.max(0, config.maxRequests - dailyCount);
      const allowed = dailyCount < config.maxRequests;

      const now = Date.now();
      const resetTime = this.getNextDayReset();

      return {
        allowed,
        remaining,
        resetTime,
        retryAfter: allowed ? undefined : Math.ceil((resetTime - now) / 1000),
        penaltyLevel: 0, // Database rate limiting doesn't use penalty levels
        isAttack: false,
        quotaType: 'daily'
      };
    } catch (error) {
      console.warn('Database rate limit check failed, falling back to memory:', error);
      // Graceful fallback to memory-based limiting
      return this.checkMemoryRateLimit(identifier, config);
    }
  }

  // ============================================================================
  // COMPOSABLE FACTORY METHODS
  // ============================================================================

  /**
   * Create a custom rate limiter for specific use cases
   */
  public createCustomLimiter(config: RateLimitConfig) {
    return {
      checkLimit: async (identifier: string) => {
        return await this.checkRateLimit({
          identifier,
          configType: 'custom',
          customConfig: config,
          bypassDevelopment: true
        });
      }
    };
  }

  // Removed createOGImageLimiter - using direct checkRateLimit method for cleaner consolidation

  /**
   * Create a standard API rate limiter
   */
  public createAPILimiter(configType: keyof typeof RateLimitService.CONFIGS = 'api') {
    return {
      checkLimit: async (identifier: string) => {
        return await this.checkRateLimit({
          identifier,
          configType,
          bypassDevelopment: true
        });
      }
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private calculateBackoff(penaltyLevel: number, baseWindow: number): number {
    const backoffMs = Math.pow(2, penaltyLevel) * baseWindow;
    const jitter = Math.random() * 0.1 * backoffMs;
    const maxBackoff = 60 * 60 * 1000; // Cap at 1 hour
    return Math.min(backoffMs + jitter, maxBackoff);
  }

  private generateKey(identifier: string, prefix: string): string {
    return `${prefix}:${identifier}`;
  }

  private getNextDayReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, entry] of this.memoryStore.entries()) {
      const lastActivity = Math.max(
        entry.requests[entry.requests.length - 1] || 0,
        entry.lastViolation,
        entry.backoffUntil
      );
      
      if (now - lastActivity > maxAge) {
        this.memoryStore.delete(key);
      }
    }
  }

  // ============================================================================
  // ADMIN & MONITORING METHODS
  // ============================================================================

  public getStats() {
    const now = Date.now();
    let activeBackoffs = 0;
    let highPenaltyEntries = 0;
    
    for (const entry of this.memoryStore.values()) {
      if (entry.backoffUntil > now) {
        activeBackoffs++;
      }
      if (entry.penaltyLevel >= 3) {
        highPenaltyEntries++;
      }
    }
    
    return {
      totalEntries: this.memoryStore.size,
      activeBackoffs,
      highPenaltyEntries,
      databaseAvailable: !!this.databaseService
    };
  }

  public resetRateLimit(identifier: string, configType: keyof typeof RateLimitService.CONFIGS = 'api'): void {
    const config = RateLimitService.CONFIGS[configType];
    const key = this.generateKey(identifier, config.keyPrefix);
    this.memoryStore.delete(key);
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.memoryStore.clear();
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const rateLimitService = RateLimitService.getInstance(); 