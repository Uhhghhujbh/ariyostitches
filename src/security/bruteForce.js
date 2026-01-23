/**
 * Brute Force Protection Module
 * Tracks and prevents brute force login attempts
 */

const STORAGE_KEY = 'ariyo_bf_protection';

class BruteForceProtection {
    constructor(options = {}) {
        this.maxAttempts = options.maxAttempts || 5;
        this.lockoutDuration = options.lockoutDuration || 15 * 60 * 1000; // 15 minutes
        this.attemptWindow = options.attemptWindow || 5 * 60 * 1000; // 5 minutes
        this.progressiveDelay = options.progressiveDelay || true;
        this.attempts = this.loadAttempts();
    }

    loadAttempts() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    saveAttempts() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.attempts));
        } catch {
            // Storage might be full or disabled
        }
    }

    getKey(identifier) {
        // Hash the identifier for privacy
        return btoa(identifier).substring(0, 20);
    }

    cleanOldAttempts(record) {
        const now = Date.now();
        record.timestamps = record.timestamps.filter(
            ts => now - ts < this.attemptWindow
        );
    }

    recordAttempt(identifier, success = false) {
        const key = this.getKey(identifier);
        const now = Date.now();

        if (!this.attempts[key]) {
            this.attempts[key] = {
                timestamps: [],
                lockedUntil: 0,
                totalFailures: 0
            };
        }

        const record = this.attempts[key];

        if (success) {
            // Reset on successful login
            record.timestamps = [];
            record.lockedUntil = 0;
            record.totalFailures = 0;
        } else {
            // Record failed attempt
            this.cleanOldAttempts(record);
            record.timestamps.push(now);
            record.totalFailures++;

            // Check if should lock
            if (record.timestamps.length >= this.maxAttempts) {
                // Progressive lockout based on total failures
                const multiplier = Math.min(Math.floor(record.totalFailures / this.maxAttempts), 4);
                record.lockedUntil = now + (this.lockoutDuration * (multiplier + 1));
                console.warn('[BruteForce] Account locked due to too many failed attempts');
            }
        }

        this.saveAttempts();
        return this.getStatus(identifier);
    }

    getStatus(identifier) {
        const key = this.getKey(identifier);
        const record = this.attempts[key];

        if (!record) {
            return {
                locked: false,
                attempts: 0,
                remainingAttempts: this.maxAttempts,
                unlockTime: null,
                delay: 0
            };
        }

        const now = Date.now();
        this.cleanOldAttempts(record);

        const locked = now < record.lockedUntil;
        const attempts = record.timestamps.length;

        // Calculate progressive delay
        let delay = 0;
        if (this.progressiveDelay && attempts > 0) {
            delay = Math.min(attempts * 1000, 10000); // Max 10 second delay
        }

        return {
            locked,
            attempts,
            remainingAttempts: Math.max(0, this.maxAttempts - attempts),
            unlockTime: locked ? new Date(record.lockedUntil) : null,
            unlockInSeconds: locked ? Math.ceil((record.lockedUntil - now) / 1000) : 0,
            delay
        };
    }

    isLocked(identifier) {
        return this.getStatus(identifier).locked;
    }

    getDelay(identifier) {
        return this.getStatus(identifier).delay;
    }

    async executeWithDelay(identifier, fn) {
        const status = this.getStatus(identifier);

        if (status.locked) {
            throw new Error(
                `Account locked. Try again in ${status.unlockInSeconds} seconds.`
            );
        }

        // Apply progressive delay
        if (status.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, status.delay));
        }

        return fn();
    }

    reset(identifier) {
        const key = this.getKey(identifier);
        delete this.attempts[key];
        this.saveAttempts();
    }

    resetAll() {
        this.attempts = {};
        localStorage.removeItem(STORAGE_KEY);
    }
}

// Singleton instance
const bruteForce = new BruteForceProtection();

export const recordLoginAttempt = (identifier, success) => bruteForce.recordAttempt(identifier, success);
export const isAccountLocked = (identifier) => bruteForce.isLocked(identifier);
export const getLoginStatus = (identifier) => bruteForce.getStatus(identifier);
export const resetLoginAttempts = (identifier) => bruteForce.reset(identifier);
export const getLoginDelay = (identifier) => bruteForce.getDelay(identifier);

export { BruteForceProtection };

export default {
    BruteForceProtection,
    recordLoginAttempt,
    isAccountLocked,
    getLoginStatus,
    resetLoginAttempts,
    getLoginDelay
};
