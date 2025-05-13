
// Rate limiter implementation
const API_RATE_LIMITS = {
  lastRequest: 0,
  minInterval: 1000, // Minimum 1 second between requests
  requestCount: 0,
  maxRequests: 5, // Max 5 requests per minute
  resetTime: 0
};

// Reset the rate limiter counter every minute
setInterval(() => {
  if (Date.now() > API_RATE_LIMITS.resetTime) {
    API_RATE_LIMITS.requestCount = 0;
    API_RATE_LIMITS.resetTime = Date.now() + 60000; // 1 minute from now
    console.log("Rate limit counter reset");
  }
}, 60000);

// Check if we're within rate limits
export function checkRateLimit(): { shouldWait: boolean; waitTime: number } {
  const now = Date.now();
  const timeSinceLastRequest = now - API_RATE_LIMITS.lastRequest;
  
  // Enforce minimum interval between requests
  if (timeSinceLastRequest < API_RATE_LIMITS.minInterval) {
    const waitTime = API_RATE_LIMITS.minInterval - timeSinceLastRequest;
    return { shouldWait: true, waitTime };
  }
  
  // Check if we've hit the maximum requests per minute
  if (API_RATE_LIMITS.requestCount >= API_RATE_LIMITS.maxRequests) {
    const waitTime = Math.max(100, API_RATE_LIMITS.resetTime - Date.now());
    return { shouldWait: true, waitTime };
  }
  
  return { shouldWait: false, waitTime: 0 };
}

// Update rate limit tracking
export function updateRateLimit() {
  API_RATE_LIMITS.lastRequest = Date.now();
  API_RATE_LIMITS.requestCount++;
  
  // If this is our first request in this period, set the reset time
  if (API_RATE_LIMITS.requestCount === 1) {
    API_RATE_LIMITS.resetTime = Date.now() + 60000; // 1 minute from now
  }
}

// Reset request count
export function resetRequestCount() {
  API_RATE_LIMITS.requestCount = 0;
}
