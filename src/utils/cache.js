/**
 * Simple In-Memory Cache with TTL (Time To Live) in milliseconds
 */
class SimpleCache {
  constructor(defaultTtlMs = 600000) { // 10 minutes default cache
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const queryCache = new SimpleCache();
