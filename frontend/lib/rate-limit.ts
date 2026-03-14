type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, RateLimitRecord>();

const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetAt) {
      attempts.delete(key);
    }
  }
  lastCleanup = now;
}

export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  cleanup();
  
  const now = Date.now();
  const record = attempts.get(key);
  
  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  
  if (record.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfterMs: record.resetAt - now 
    };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count, retryAfterMs: 0 };
}

export function getRateLimitKey(request: Request, prefix: string = ""): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return prefix ? `${prefix}:${ip}` : ip;
}
