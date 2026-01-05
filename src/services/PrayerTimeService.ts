/**
 * PrayerTimeService
 * Service for fetching and caching prayer times from Aladhan API
 */

// ==================== TYPES ====================

export interface PrayerTimes {
	Fajr: string; // "04:45"
	Dhuhr: string;
	Asr: string;
	Maghrib: string;
	Isha: string;
}

export interface AladhanResponse {
	code: number;
	status: string;
	data: {
		timings: {
			Fajr: string;
			Dhuhr: string;
			Asr: string;
			Maghrib: string;
			Isha: string;
		};
		date: {
			readable: string;
			timestamp: string;
		};
	};
}

// ==================== SERVICE ====================

export class PrayerTimeService {
	private cache: Map<string, PrayerTimes> = new Map();
	private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

	/**
	 * Get prayer times for a specific date
	 * @param date Date object (will use current date if not provided)
	 * @returns PrayerTimes object with WIB times in "HH:MM" format
	 */
	async getPrayerTimes(date: Date = new Date()): Promise<PrayerTimes> {
		const dateKey = this.getDateKey(date);

		// Check cache first
		const cached = this.cache.get(dateKey);
		if (cached) {
			console.log(`[PrayerTimeService] Cache hit for ${dateKey}`);
			return cached;
		}

		console.log(`[PrayerTimeService] Fetching prayer times for ${dateKey}`);

		// Fetch from Aladhan API
		const prayerTimes = await this.fetchFromAladhan(date);

		// Cache the result
		this.cache.set(dateKey, prayerTimes);

		// Clean old cache entries
		this.cleanCache();

		return prayerTimes;
	}

	/**
	 * Fetch prayer times from Aladhan API for Jakarta (WIB)
	 */
	private async fetchFromAladhan(date: Date): Promise<PrayerTimes> {
		const timestamp = Math.floor(date.getTime() / 1000);
		const url = `https://api.aladhan.com/v1/timings/${timestamp}?city=Jakarta&country=Indonesia`;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Aladhan API error: ${response.statusText}`);
			}

			const data = (await response.json()) as AladhanResponse;

			if (data.code !== 200) {
				throw new Error(`Aladhan API returned error: ${data.status}`);
			}

			const timings = data.data.timings;

			// Extract HH:MM from "04:45 (WIB)" format
			const cleanTime = (time: string): string => time.split(' ')[0];

			return {
				Fajr: cleanTime(timings.Fajr),
				Dhuhr: cleanTime(timings.Dhuhr),
				Asr: cleanTime(timings.Asr),
				Maghrib: cleanTime(timings.Maghrib),
				Isha: cleanTime(timings.Isha),
			};
		} catch (error) {
			console.error('[PrayerTimeService] Failed to fetch from Aladhan:', error);

			// Fallback to hardcoded times (should rarely happen)
			return this.getFallbackTimes();
		}
	}

	/**
	 * Get fallback prayer times (hardcoded averages for Jakarta)
	 */
	private getFallbackTimes(): PrayerTimes {
		console.warn('[PrayerTimeService] Using fallback prayer times');
		return {
			Fajr: '04:45',
			Dhuhr: '12:00',
			Asr: '15:30',
			Maghrib: '18:05',
			Isha: '19:20',
		};
	}

	/**
	 * Get cache key for a specific date
	 */
	private getDateKey(date: Date): string {
		return date.toISOString().split('T')[0]; // "YYYY-MM-DD"
	}

	/**
	 * Clean old cache entries
	 */
	private cleanCache(): void {
		const now = Date.now();
		const keysToDelete: string[] = [];

		for (const [key, value] of this.cache.entries()) {
			// Simple approach: clear all old entries (older than today)
			const keyDate = new Date(key);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (keyDate < today) {
				keysToDelete.push(key);
			}
		}

		keysToDelete.forEach((key) => this.cache.delete(key));
	}
}
