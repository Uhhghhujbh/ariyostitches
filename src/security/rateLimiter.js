/**
 * Rate Limiter Module
 * Implements token bucket algorithm for client-side rate limiting
 */

class RateLimiter {
    constructor(options = {}) {
        this.maxTokens = options.maxTokens || 10;
        this.refillRate = options.refillRate || 1; // tokens per second
        this.tokens = this.maxTokens;
        this.lastRefill = Date.now();
        this.blockedUntil = 0;
        this.blockDuration = options.blockDuration || 60000; // 1 minute block
        this.violationCount = 0;
        this.maxViolations = options.maxViolations || 5;
    }

    refillTokens() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000;
        const tokensToAdd = timePassed * this.refillRate;

        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }

    isBlocked() {
        if (Date.now() < this.blockedUntil) {
            return true;
        }
        return false;
    }

    consume(tokens = 1) {
        if (this.isBlocked()) {
            return {
                allowed: false,
                reason: 'Rate limit exceeded. Please wait.',
                retryAfter: Math.ceil((this.blockedUntil - Date.now()) / 1000)
            };
        }

        this.refillTokens();

        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            this.violationCount = Math.max(0, this.violationCount - 0.1); // Slowly decrease violations
            return { allowed: true };
        }

        this.violationCount++;

        if (this.violationCount >= this.maxViolations) {
            this.blockedUntil = Date.now() + this.blockDuration * Math.min(this.violationCount, 5);
            console.warn('[RateLimiter] User blocked due to rate limit violations');
        }

        return {
            allowed: false,
            reason: 'Too many requests. Please slow down.',
            retryAfter: Math.ceil(1 / this.refillRate)
        };
    }

    reset() {
        this.tokens = this.maxTokens;
        this.violationCount = 0;
        this.blockedUntil = 0;
    }

    getStatus() {
        this.refillTokens();
        return {
            tokens: Math.floor(this.tokens),
            maxTokens: this.maxTokens,
            blocked: this.isBlocked(),
            blockedUntil: this.blockedUntil > Date.now() ? new Date(this.blockedUntil) : null
        };
    }
}

// Default limiters for different actions
const limiters = {
    api: new RateLimiter({ maxTokens: 30, refillRate: 2 }),
    auth: new RateLimiter({ maxTokens: 5, refillRate: 0.1, blockDuration: 300000 }), // 5 min block
    payment: new RateLimiter({ maxTokens: 3, refillRate: 0.05, blockDuration: 600000 }), // 10 min block
    search: new RateLimiter({ maxTokens: 20, refillRate: 5 })
};

/**
 * Check if action is rate limited
 */
export const checkRateLimit = (action = 'api', tokens = 1) => {
    const limiter = limiters[action] || limiters.api;
    return limiter.consume(tokens);
};

/**
 * Get limiter status
 */
export const getRateLimitStatus = (action = 'api') => {
    const limiter = limiters[action] || limiters.api;
    return limiter.getStatus();
};

/**
 * Reset specific limiter
 */
export const resetRateLimit = (action = 'api') => {
    const limiter = limiters[action];
    if (limiter) limiter.reset();
};

/**
 * Create rate-limited wrapper for functions
 */
export const withRateLimit = (fn, action = 'api') => {
    return async (...args) => {
        const result = checkRateLimit(action);

        if (!result.allowed) {
            throw new Error(result.reason);
        }

        return fn(...args);
    };
};

export { RateLimiter };

export default {
    RateLimiter,
    checkRateLimit,
    getRateLimitStatus,
    resetRateLimit,
    withRateLimit
};
