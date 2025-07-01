/**
 * Edge Runtime Compatible Quota Service
 * 
 * Simplified quota service that works in Edge Runtime environments
 * without Node.js dependencies. Falls back to basic rate limiting.
 */

export interface EdgeQuotaCheck {
  allowed: boolean;
  remaining: number;
  quota_limit: number;
  current_usage: number;
  is_unlimited: boolean;
  quota_source: string;
  reset_date?: Date;
}

export class EdgeQuotaService {
  private static memoryStore = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check quota for authenticated users (simplified version)
   */
  static async checkUserQuota(
    userId: number,
    serviceName: string,
    featureName: string
  ): Promise<EdgeQuotaCheck> {
    // In Edge Runtime, we can't access the database
    // So we'll provide a generous fallback quota
    const key = `user:${userId}:${serviceName}:${featureName}`;
    const now = Date.now();
    const resetTime = this.getNextDayReset();
    
    let entry = this.memoryStore.get(key);
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime };
      this.memoryStore.set(key, entry);
    }

    const dailyLimit = 10; // Generous fallback for authenticated users
    const allowed = entry.count < dailyLimit;
    
    return {
      allowed,
      remaining: Math.max(0, dailyLimit - entry.count),
      quota_limit: dailyLimit,
      current_usage: entry.count,
      is_unlimited: false,
      quota_source: 'edge-fallback',
      reset_date: new Date(resetTime)
    };
  }

  /**
   * Check quota for guest users (simplified version)
   */
  static async checkGuestQuota(
    guestInfo: { client_ip: string; machine_fingerprint: string; user_agent_hash: string },
    serviceName: string,
    featureName: string
  ): Promise<EdgeQuotaCheck> {
    const key = `guest:${guestInfo.client_ip}:${serviceName}:${featureName}`;
    const now = Date.now();
    const resetTime = this.getNextDayReset();
    
    let entry = this.memoryStore.get(key);
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime };
      this.memoryStore.set(key, entry);
    }

    const dailyLimit = 1; // Conservative fallback for guests
    const allowed = entry.count < dailyLimit;
    
    return {
      allowed,
      remaining: Math.max(0, dailyLimit - entry.count),
      quota_limit: dailyLimit,
      current_usage: entry.count,
      is_unlimited: false,
      quota_source: 'edge-guest-fallback',
      reset_date: new Date(resetTime)
    };
  }

  /**
   * Record usage for authenticated users
   */
  static async recordUserUsage(
    userId: number,
    serviceName: string,
    featureName: string,
    amount: number,
    metadata?: any
  ): Promise<void> {
    const key = `user:${userId}:${serviceName}:${featureName}`;
    const entry = this.memoryStore.get(key);
    if (entry) {
      entry.count += amount;
      this.memoryStore.set(key, entry);
    }
  }

  /**
   * Record usage for guest users
   */
  static async recordGuestUsage(
    guestInfo: { client_ip: string; machine_fingerprint: string; user_agent_hash: string },
    serviceName: string,
    featureName: string,
    amount: number,
    metadata?: any
  ): Promise<void> {
    const key = `guest:${guestInfo.client_ip}:${serviceName}:${featureName}`;
    const entry = this.memoryStore.get(key);
    if (entry) {
      entry.count += amount;
      this.memoryStore.set(key, entry);
    }
  }

  private static getNextDayReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Clean up old entries
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.resetTime <= now) {
        this.memoryStore.delete(key);
      }
    }
  }
}

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    EdgeQuotaService.cleanup();
  }, 60 * 60 * 1000);
}