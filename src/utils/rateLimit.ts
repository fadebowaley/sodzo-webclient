export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // seconds
}

/**
 * Extract rate limit information from response headers
 */
export function extractRateLimitInfo(response: any): RateLimitInfo | null {
  const headers = response?.headers || {};

  // Try standard headers first (draft-7)
  const rateLimitHeader = headers["ratelimit"];
  if (rateLimitHeader) {
    // Format: "limit=100, remaining=95, reset=1234567890"
    const parts = rateLimitHeader.split(",");
    const info: any = {};
    parts.forEach((part) => {
      const [key, value] = part.trim().split("=");
      info[key] = parseInt(value, 10);
    });
    return {
      limit: info.limit || 0,
      remaining: info.remaining || 0,
      reset: info.reset || 0,
    };
  }

  // Fallback to legacy headers
  const limit = parseInt(headers["x-ratelimit-limit"] || "0", 10);
  const remaining = parseInt(headers["x-ratelimit-remaining"] || "0", 10);
  const resetHeader = headers["x-ratelimit-reset"];
  const retryAfter = parseInt(headers["retry-after"] || "0", 10);

  let reset = 0;
  if (resetHeader) {
    // Could be ISO string or Unix timestamp
    const resetDate = new Date(resetHeader);
    reset = isNaN(resetDate.getTime())
      ? parseInt(resetHeader, 10)
      : Math.floor(resetDate.getTime() / 1000);
  }

  if (limit === 0 && remaining === 0) {
    return null; // No rate limit info
  }

  return {
    limit,
    remaining,
    reset,
    retryAfter: retryAfter > 0 ? retryAfter : undefined,
  };
}

/**
 * Calculate seconds until rate limit resets
 */
export function getSecondsUntilReset(rateLimitInfo: RateLimitInfo): number {
  if (rateLimitInfo.reset > 0) {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, rateLimitInfo.reset - now);
  }
  if (rateLimitInfo.retryAfter) {
    return rateLimitInfo.retryAfter;
  }
  return 0;
}

/**
 * Format seconds into human-readable string
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
  return `${minutes} minute${
    minutes !== 1 ? "s" : ""
  } ${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
}
