/**
 * Scheduler Utilities
 * Utility functions for cron-based scheduling and time calculations
 */

import type { PrayerTimes } from '../services/PrayerTimeService';

// ==================== TYPES ====================

export type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

// ==================== CRON MAPPINGS ====================

/**
 * Mapping of cron expressions to prayer names
 * Cron format: "minute hour * * *" (UTC)
 */
const CRON_TO_PRAYER: Record<string, PrayerName> = {
	'40 21 * * *': 'Fajr', // Subuh - 04:40 WIB (21:40 UTC)
	'55 4 * * *': 'Dhuhr', // Dzuhur - 11:55 WIB (04:55 UTC)
	'25 8 * * *': 'Asr', // Ashar - 15:25 WIB (08:25 UTC)
	'0 11 * * *': 'Maghrib', // Maghrib - 18:00 WIB (11:00 UTC)
	'15 12 * * *': 'Isha', // Isya - 19:15 WIB (12:15 UTC)
};

// ==================== FUNCTIONS ====================

/**
 * Get prayer name from cron expression
 * @param cron Cron expression (e.g., "40 21 * * *")
 * @returns Prayer name (e.g., "Fajr")
 */
export function getPrayerNameFromCron(cron: string): PrayerName {
	const prayerName = CRON_TO_PRAYER[cron];
	if (!prayerName) {
		throw new Error(`Unknown cron expression: ${cron}`);
	}
	return prayerName;
}

/**
 * Calculate delay in milliseconds from scheduled time to prayer time
 * @param targetTime Prayer time in "HH:MM" format (WIB)
 * @param scheduledTime Scheduled time from cron (timestamp in milliseconds)
 * @returns Delay in milliseconds
 */
export function calculateDelay(targetTime: string, scheduledTime: number): number {
	// Parse target time (e.g., "04:45")
	const [hours, minutes] = targetTime.split(':').map(Number);

	// Create target date in WIB (GMT+7)
	const scheduledDate = new Date(scheduledTime);
	const targetDate = new Date(scheduledDate);

	// Set target time in WIB
	targetDate.setUTCHours(hours - 7, minutes, 0, 0); // Convert WIB to UTC

	// Calculate delay
	const delay = targetDate.getTime() - scheduledDate.getTime();

	console.log(
		`[Scheduler] Scheduled: ${scheduledDate.toISOString()}, Target: ${targetDate.toISOString()}, Delay: ${delay}ms`,
	);

	// If delay is negative, prayer time has already passed
	if (delay < 0) {
		console.warn(
			`[Scheduler] Prayer time ${targetTime} has already passed! Sending immediately.`,
		);
		return 0;
	}

	// Cap delay at 10 minutes to prevent infinite wait
	if (delay > 10 * 60 * 1000) {
		console.warn(`[Scheduler] Delay too long (${delay}ms). Capping at 10 minutes.`);
		return 10 * 60 * 1000;
	}

	return delay;
}

/**
 * Sleep for specified milliseconds
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get Indonesian prayer name from English name
 * @param prayerNameEn English prayer name (e.g., "Fajr")
 * @returns Indonesian prayer name (e.g., "Subuh")
 */
export function getPrayerNameId(prayerNameEn: PrayerName): string {
	const names: Record<PrayerName, string> = {
		Fajr: 'Subuh',
		Dhuhr: 'Dzuhur',
		Asr: 'Ashar',
		Maghrib: 'Maghrib',
		Isha: 'Isya',
	};
	return names[prayerNameEn];
}
