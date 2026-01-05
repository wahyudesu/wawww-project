/**
 * Simple In-Memory Rate Limiter
 * No database/KV required - uses a simple map with timestamp-based expiration
 */

const RATE_LIMIT_PER_HOUR = 5; // Maximum 5 requests per hour per chat

// Store: { chatId: { count: number, resetTime: number } }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiter using in-memory storage
 * Note: In a distributed environment (multiple Worker instances), each instance
 * has its own memory, so this is not perfectly accurate. For a production app,
 * consider using a proper rate limiting solution.
 */
export class SimpleRateLimiter {
	/**
	 * Check if the chat has exceeded rate limit
	 */
	checkLimit(chatId: string): { allowed: boolean; remaining: number; resetIn?: number } {
		const now = Date.now();
		const hourInMillis = 60 * 60 * 1000; // 1 hour

		const record = rateLimitStore.get(chatId);

		// No record or expired, allow
		if (!record || now >= record.resetTime) {
			return { allowed: true, remaining: RATE_LIMIT_PER_HOUR };
		}

		// Check if limit exceeded
		if (record.count >= RATE_LIMIT_PER_HOUR) {
			const resetIn = Math.ceil((record.resetTime - now) / 1000); // seconds
			return { allowed: false, remaining: 0, resetIn };
		}

		return { allowed: true, remaining: RATE_LIMIT_PER_HOUR - record.count };
	}

	/**
	 * Increment the usage counter for this chat
	 */
	incrementUsage(chatId: string): void {
		const now = Date.now();
		const hourInMillis = 60 * 60 * 1000; // 1 hour

		const record = rateLimitStore.get(chatId);

		// No record or expired, create new
		if (!record || now >= record.resetTime) {
			rateLimitStore.set(chatId, {
				count: 1,
				resetTime: now + hourInMillis,
			});
			return;
		}

		// Increment existing
		record.count++;
	}

	/**
	 * Get current usage count (for debugging/admin)
	 */
	getCurrentUsage(chatId: string): number {
		const now = Date.now();
		const record = rateLimitStore.get(chatId);

		if (!record || now >= record.resetTime) {
			return 0;
		}

		return record.count;
	}

	/**
	 * Reset rate limit for a specific chat (admin function)
	 */
	resetLimit(chatId: string): void {
		rateLimitStore.delete(chatId);
	}

	/**
	 * Clean up expired entries (call periodically to prevent memory leaks)
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [chatId, record] of rateLimitStore.entries()) {
			if (now >= record.resetTime) {
				rateLimitStore.delete(chatId);
			}
		}
	}
}
