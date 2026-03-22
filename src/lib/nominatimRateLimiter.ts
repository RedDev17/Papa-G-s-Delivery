/**
 * Global rate limiter for Nominatim (OpenStreetMap) API requests.
 *
 * Nominatim's usage policy requires a maximum of 1 request per second.
 * This module provides:
 *  - A request queue with 1.1 s minimum gap between requests
 *  - A global geocode cache (address → coordinates) to avoid re-fetching
 *  - A single `rateLimitedFetch` wrapper used by all hooks/components
 */

const MIN_GAP_MS = 1100; // 1.1 seconds between requests
let lastRequestTime = 0;
const pendingQueue: Array<{
  resolve: (value: Response) => void;
  reject: (reason: unknown) => void;
  url: string;
  options?: RequestInit;
}> = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (pendingQueue.length > 0) {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_GAP_MS) {
      await new Promise(r => setTimeout(r, MIN_GAP_MS - elapsed));
    }

    const item = pendingQueue.shift();
    if (!item) break;

    lastRequestTime = Date.now();
    try {
      const response = await fetch(item.url, item.options);
      item.resolve(response);
    } catch (err) {
      item.reject(err);
    }
  }

  isProcessing = false;
}

/**
 * Drop-in replacement for `fetch()` that queues Nominatim requests
 * so they never exceed 1 req/sec.
 */
export function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    pendingQueue.push({ resolve, reject, url, options });
    processQueue();
  });
}

// ---------------------------------------------------------------------------
// Global geocode cache – keyed by normalised address string
// ---------------------------------------------------------------------------
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

export function getCachedGeocode(address: string): { lat: number; lng: number } | null | undefined {
  const key = address.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  return undefined; // cache miss (distinct from null = "address not found")
}

export function setCachedGeocode(address: string, coords: { lat: number; lng: number } | null) {
  const key = address.trim().toLowerCase();
  geocodeCache.set(key, coords);
}
