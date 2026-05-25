/**
 * Fetch with retry logic, exponential backoff, and caching.
 */

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchWithRetry(url, options = {}, { retries = 3, backoff = 1000, cacheKey = null } = {}) {
  // Check cache first
  if (cacheKey && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Cache successful response
      if (cacheKey) {
        cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, attempt)));
      }
    }
  }

  // Try returning stale cache if available
  if (cacheKey && cache.has(cacheKey)) {
    return cache.get(cacheKey).data;
  }

  throw lastError;
}

/**
 * Clear cached data
 */
export function clearApiCache() {
  cache.clear();
}
