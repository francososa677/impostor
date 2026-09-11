interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class SimpleRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  public isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetTime) {
      this.records.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count += 1;
    return true;
  }

  public cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(key);
      }
    }
  }
}

export const socketMessageLimiter = new SimpleRateLimiter(5000, 10); // max 10 messages per 5s
export const socketActionLimiter = new SimpleRateLimiter(2000, 15); // max 15 actions per 2s
export const roomCreationLimiter = new SimpleRateLimiter(60000, 10); // max 10 rooms per min per IP
