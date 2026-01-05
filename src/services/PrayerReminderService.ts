/**
 * PrayerReminderService
 * Service for sending prayer reminders to WhatsApp groups
 */

import type { WahaChatClient } from '../functions/lib/chatting';
import { getDb, getAllGroups } from '../db/queries';
import type { PrayerTimes } from './PrayerTimeService';

// ==================== TYPES ====================

type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

interface PrayerNameMapping {
	en: PrayerName;
	id: string;
	name: string;
}

// ==================== CONSTANTS ====================

const PRAYER_NAMES: PrayerNameMapping[] = [
	{ en: 'Fajr', id: 'Subuh', name: 'Subuh' },
	{ en: 'Dhuhr', id: 'Dzuhur', name: 'Dzuhur' },
	{ en: 'Asr', id: 'Ashar', name: 'Ashar' },
	{ en: 'Maghrib', id: 'Maghrib', name: 'Maghrib' },
	{ en: 'Isha', id: 'Isya', name: 'Isya' },
];

const PRAYER_QUOTES: Record<PrayerName, string> = {
	Fajr: '"Dan dirikanlah shalat di dua ujung hari (pagi dan petang) dan pada bagian-bagayan malam." (QS. Hud: 114)',
	Dhuhr: '"Sesungguhnya shalat itu adalah fardhu yang ditentukan waktunya atas orang-orang yang beriman." (QS. An-Nisa: 103)',
	Asr: '"Peliharalah semua shalat (mu), terutama shalat wustha (ashar). Dan berdirilah untuk Allah dengan khusyuk." (QS. Al-Baqarah: 238)',
	Maghrib: '"Maka sabarlah (hai Muhammad) atas apa mereka katakan dan bertasbihlah dengan memuji Tuhanmu sebelum terbit matahari dan terbenamnya." (QS. Qaf: 39)',
	Isha: '"Dan pada sebagian malam, maka kerjakanlah shalat Isya sebagai tambahan bagimu." (QS. Al-Isra: 79)',
};

// ==================== SERVICE ====================

export class PrayerReminderService {
	constructor(private client: WahaChatClient, private env: any) {}

	/**
	 * Send prayer reminder to all groups with sholatreminder enabled
	 */
	async sendPrayerReminder(prayerNameEn: PrayerName, prayerTime: string): Promise<void> {
		console.log(`[PrayerReminderService] Starting ${prayerNameEn} reminder at ${prayerTime} WIB`);

		try {
			// Get all groups with prayer reminders enabled
			const activeGroups = await this.getActiveGroups();

			if (activeGroups.length === 0) {
				console.log('[PrayerReminderService] No active groups found');
				return;
			}

			console.log(`[PrayerReminderService] Sending to ${activeGroups.length} groups`);

			// Send reminder to each group
			let successCount = 0;
			let failCount = 0;

			for (const group of activeGroups) {
				try {
					await this.sendToGroup(group.id, prayerNameEn, prayerTime);
					successCount++;
				} catch (error) {
					console.error(`[PrayerReminderService] Failed to send to ${group.id}:`, error);
					failCount++;
				}
			}

			console.log(
				`[PrayerReminderService] Completed: ${successCount} success, ${failCount} failed`,
			);
		} catch (error) {
			console.error('[PrayerReminderService] Error sending prayer reminder:', error);
			throw error;
		}
	}

	/**
	 * Get all groups with prayer reminders enabled
	 */
	private async getActiveGroups(): Promise<Array<{ id: string }>> {
		const db = getDb(this.env.DB as any);
		const allGroups = await getAllGroups(db);

		// Filter groups with sholatreminder=true
		return allGroups
			.filter((group) => group.settings?.sholatreminder === true)
			.map((group) => ({ id: group.id }));
	}

	/**
	 * Send reminder to a specific group
	 */
	private async sendToGroup(
		chatId: string,
		prayerNameEn: PrayerName,
		prayerTime: string,
	): Promise<void> {
		const prayerInfo = PRAYER_NAMES.find((p) => p.en === prayerNameEn);
		if (!prayerInfo) {
			throw new Error(`Invalid prayer name: ${prayerNameEn}`);
		}

		const message = this.formatReminderMessage(prayerNameEn, prayerTime);

		await this.client.sendText({
			chatId,
			text: message,
		});

		console.log(`[PrayerReminderService] Sent to ${chatId}`);
	}

	/**
	 * Format reminder message
	 */
	private formatReminderMessage(prayerNameEn: PrayerName, prayerTime: string): string {
		const prayerInfo = PRAYER_NAMES.find((p) => p.en === prayerNameEn);
		if (!prayerInfo) {
			throw new Error(`Invalid prayer name: ${prayerNameEn}`);
		}

		const now = new Date();
		const dateOptions: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		};
		const dateString = now.toLocaleDateString('id-ID', dateOptions);
		const quote = PRAYER_QUOTES[prayerNameEn];

		return `🕌 *Waktunya Sholat ${prayerInfo.name}*

📅 ${dateString}
⏰ Waktu: ${prayerTime} WIB

${quote}

Semoga sholat kita diterima oleh Allah SWT. 🤲`;
	}
}

/**
 * Get Indonesian prayer name from English name
 */
export function getPrayerNameId(prayerNameEn: PrayerName): string {
	const prayerInfo = PRAYER_NAMES.find((p) => p.en === prayerNameEn);
	return prayerInfo?.id || prayerNameEn;
}
