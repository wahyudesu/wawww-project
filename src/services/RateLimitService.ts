/**
 * Rate Limit Service
 * Manages rate limiting for commands using Cloudflare Workers KV
 */

const RATE_LIMIT_PER_HOUR = 5; // Maximum 5 requests per hour per chat

export class RateLimitService {
	private kv: KVNamespace;

	constructor(kv: KVNamespace) {
		this.kv = kv;
	}

	/**
	 * Check if the chat has exceeded rate limit
	 */
	async checkLimit(chatId: string): Promise<{ allowed: boolean; remaining: number }> {
		const hourKey = this.getHourKey(chatId);

		try {
			const current = await this.kv.get(hourKey);
			const count = current ? parseInt(current, 10) : 0;

			if (count >= RATE_LIMIT_PER_HOUR) {
				return { allowed: false, remaining: 0 };
			}

			return { allowed: true, remaining: RATE_LIMIT_PER_HOUR - count };
		} catch (error) {
			console.error('Error checking rate limit:', error);
			// On error, allow the request (fail open)
			return { allowed: true, remaining: RATE_LIMIT_PER_HOUR };
		}
	}

	/**
	 * Increment the usage counter for this chat
	 */
	async incrementUsage(chatId: string): Promise<void> {
		const hourKey = this.getHourKey(chatId);

		try {
			const current = await this.kv.get(hourKey);
			const count = current ? parseInt(current, 10) : 0;
			const newCount = count + 1;

			// Set with expiration of 1 hour
			await this.kv.put(hourKey, newCount.toString(), {
				expirationTtl: 3600, // 1 hour in seconds
			});
		} catch (error) {
			console.error('Error incrementing rate limit:', error);
		}
	}

	/**
	 * Generate KV key for current hour
	 * Format: ratelimit:{chatId}:{YYYYMMDDHH}
	 */
	private getHourKey(chatId: string): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hour = String(now.getHours()).padStart(2, '0');

		const hourString = `${year}${month}${day}${hour}`;
		return `ratelimit:${chatId}:${hourString}`;
	}

	/**
	 * Get current usage count (for debugging/admin)
	 */
	async getCurrentUsage(chatId: string): Promise<number> {
		const hourKey = this.getHourKey(chatId);

		try {
			const current = await this.kv.get(hourKey);
			return current ? parseInt(current, 10) : 0;
		} catch (error) {
			console.error('Error getting current usage:', error);
			return 0;
		}
	}
}
