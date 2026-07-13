import { Injectable, Logger } from '@nestjs/common';

/**
 * CacheService provides a lightweight, in-memory key-value cache
 * with Time-To-Live (TTL) expiration support.
 * 
 * CacheService ले TTL (Time-To-Live) support सहितको हलुका, in-memory key-value cache प्रदान गर्छ।
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, { value: any; expiresAt: number }>();

  /**
   * Retrieve an item from the cache. Returns null if missing or expired.
   * cache बाट item तान्ने। यदि छैन वा expire भएको छ भने null return गर्छ।
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    // If the cache entry has expired, delete it (lazy eviction) and return null
    // यदि cache entry expire भएको छ भने त्यसलाई delete (lazy eviction) गरेर null return गर्ने
    if (now > cached.expiresAt) {
      this.logger.debug(`Cache key "${key}" has expired. Evicting.`);
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit for key: "${key}"`);
    return cached.value as T;
  }

  /**
   * Store an item in the cache with a specified Time-To-Live (TTL) in seconds.
   * TTL (seconds मा) सहित cache मा item store गर्ने।
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
    this.logger.debug(`Cache set for key: "${key}" with TTL of ${ttlSeconds}s`);
  }

  /**
   * Delete an item from the cache.
   * cache बाट specific item delete गर्ने।
   */
  del(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Cache evicted for key: "${key}"`);
    }
  }

  /**
   * Clear all items from the cache.
   * cache का सबै items सफा (clear) गर्ने।
   */
  clear(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared completely');
  }
}
