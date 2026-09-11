export declare class SimpleRateLimiter {
    private records;
    private windowMs;
    private maxRequests;
    constructor(windowMs?: number, maxRequests?: number);
    isAllowed(key: string): boolean;
    cleanup(): void;
}
export declare const socketMessageLimiter: SimpleRateLimiter;
export declare const socketActionLimiter: SimpleRateLimiter;
export declare const roomCreationLimiter: SimpleRateLimiter;
//# sourceMappingURL=rate-limiter.d.ts.map