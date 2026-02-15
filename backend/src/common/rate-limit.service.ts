import { Injectable } from '@nestjs/common';

interface RateLimitEntry {
  timestamps: number[];
  ip?: string;
  userAgent?: string;
}

/**
 * In-memory rate limiting service
 * Fixed: MEDIUM-B2 - Migrated from database to in-memory for performance
 * - Uses Map for O(1) lookups instead of database queries
 * - Automatic cleanup via sliding window algorithm
 * - No database writes for rate limiting checks
 */
@Injectable()
export class RateLimitService {
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Start periodic cleanup of old entries
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Check if a request is within rate limits
   * @param key - Rate limit key (e.g., "api:127.0.0.1")
   * @param windowMs - Time window in milliseconds
   * @param maxAttempts - Maximum attempts within window
   */
  async checkRateLimit(
    key: string,
    windowMs: number,
    maxAttempts: number,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create rate limit entry
    let entry = this.rateLimits.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.rateLimits.set(key, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const attempts = entry.timestamps.length;
    const allowed = attempts < maxAttempts;
    const remaining = Math.max(0, maxAttempts - attempts);
    const resetTime = windowStart + windowMs;

    return {
      allowed,
      remaining,
      resetTime,
    };
  }

  /**
   * Record a rate limit attempt
   * @param key - Rate limit key
   * @param ip - IP address (for logging)
   * @param userAgent - User agent (for logging)
   */
  async recordAttempt(key: string, ip?: string, userAgent?: string): Promise<void> {
    const now = Date.now();

    let entry = this.rateLimits.get(key);
    if (!entry) {
      entry = { timestamps: [], ip, userAgent };
      this.rateLimits.set(key, entry);
    }

    // Add current timestamp
    entry.timestamps.push(now);

    // Update IP and user agent if provided
    if (ip) entry.ip = ip;
    if (userAgent) entry.userAgent = userAgent;
  }

  /**
   * Clean up old rate limit entries
   * Removes entries with no timestamps in the last 24 hours
   */
  private cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

    for (const [key, entry] of this.rateLimits.entries()) {
      // Remove timestamps older than 24 hours
      entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

      // Remove entry if no recent timestamps
      if (entry.timestamps.length === 0) {
        this.rateLimits.delete(key);
      }
    }

    // Log cleanup stats in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[RateLimit] Cleanup: ${this.rateLimits.size} active keys`);
    }
  }

  /**
   * Clear all rate limits (useful for testing)
   */
  clearAll(): void {
    this.rateLimits.clear();
  }

  /**
   * Get current stats (for monitoring)
   */
  getStats(): { totalKeys: number; totalAttempts: number } {
    let totalAttempts = 0;
    for (const entry of this.rateLimits.values()) {
      totalAttempts += entry.timestamps.length;
    }
    return {
      totalKeys: this.rateLimits.size,
      totalAttempts,
    };
  }

  /**
   * Cleanup on service destroy
   */
  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}
