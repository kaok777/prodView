import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 300000; // 5 minutes in milliseconds

  onModuleInit() {
    this.logger.log('CacheService initialized');
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired for key: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.data as T;
  }

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, value: T, ttlMs: number = this.DEFAULT_TTL): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { data: value, expiresAt });
    this.logger.debug(`Cache set for key: ${key}, TTL: ${ttlMs}ms`);
  }

  /**
   * Delete specific key from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Cache deleted for key: ${key}`);
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern Partial key to match
   */
  deletePattern(pattern: string): void {
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    this.logger.debug(`Cache pattern delete: ${pattern}, deleted ${deletedCount} keys`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.debug(`Cache cleared: ${size} entries removed`);
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Remove expired entries (called periodically)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleanup: removed ${cleanedCount} expired cache entries`);
    }
  }
}
