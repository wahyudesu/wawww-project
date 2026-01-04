/**
 * Group Service - Integrasi dengan Waha API dan Database
 * Handle group operations dengan database persistence
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as queries from '../../db/queries';
import * as schema from '../../db/schema';
import type { WahaChatClient } from './chatting';

// ==================== TYPES ====================

export interface GroupServiceOptions {
	db: DrizzleD1Database<typeof import('../../db/schema')>;
	wahaClient: WahaChatClient;
}

// ==================== GROUP SERVICE CLASS ====================

export class GroupService {
	private db: DrizzleD1Database<typeof import('../../db/schema')>;
	private waha: WahaChatClient;

	constructor(options: GroupServiceOptions) {
		this.db = options.db;
		this.waha = options.wahaClient;
	}

	// ==================== GROUP MANAGEMENT ====================

	/**
	 * Sync group dari WhatsApp ke database
	 * Panggil ini saat bot join grup atau ada event update
	 */
	async syncGroup(chatId: string, groupName: string, ownerId: string): Promise<void> {
		// Get participants dari Waha API
		// Note: Ini perlu endpoint untuk get group info
		// Untuk sekarang, kita create/update dengan data minimal
		await queries.upsertGroup(this.db, {
			id: chatId,
			name: groupName,
			ownerId,
		});
	}

	/**
	 * Get group settings dari database
	 */
	async getGroupSettings(chatId: string): Promise<queries.GroupWhatsAppSelect | undefined> {
		return await queries.getGroupByChatId(this.db, chatId);
	}

	/**
	 * Update group settings
	 */
	async updateSettings(
		chatId: string,
		settings: Partial<queries.GroupSettings>,
	): Promise<void> {
		await queries.updateGroupSettings(this.db, chatId, settings);
	}

	/**
	 * Toggle welcome message
	 */
	async toggleWelcome(chatId: string): Promise<boolean> {
		const group = await queries.getGroupByChatId(this.db, chatId);
		if (!group) throw new Error('Group not found');

		const settings = group.settings as queries.GroupSettings;
		const newValue = !settings.welcome;
		await queries.updateGroupSettings(this.db, chatId, { welcome: newValue });

		return newValue;
	}

	/**
	 * Update welcome message
	 */
	async setWelcomeMessage(chatId: string, message: string): Promise<void> {
		await queries.updateGroupSettings(this.db, chatId, { welcomeMessage: message });
	}

	/**
	 * Set who can use tagall
	 */
	async setTagallPermission(chatId: string, permission: 'admin' | 'member' | 'owner'): Promise<void> {
		await queries.updateGroupSettings(this.db, chatId, { tagall: permission });
	}

	/**
	 * Toggle sholat reminder
	 */
	async toggleSholatReminder(chatId: string): Promise<boolean> {
		const group = await queries.getGroupByChatId(this.db, chatId);
		if (!group) throw new Error('Group not found');

		const settings = group.settings as queries.GroupSettings;
		const newValue = !settings.sholatreminder;
		await queries.updateGroupSettings(this.db, chatId, { sholatreminder: newValue });

		return newValue;
	}

	// ==================== MEMBER MANAGEMENT ====================

	/**
	 * Add member ke group (database + Waha API)
	 */
	async addMember(chatId: string, phoneNumbers: string[]): Promise<void> {
		// Add via Waha API
		// Note: WahaChatClient doesn't have addMember method yet
		// await this.waha.addGroupMember(chatId, phoneNumbers);

		// Update database
		for (const phone of phoneNumbers) {
			await queries.addGroupMember(this.db, chatId, phone);
		}
	}

	/**
	 * Remove member dari group (database + Waha API)
	 */
	async removeMember(chatId: string, phoneNumber: string): Promise<void> {
		// Remove via Waha API
		// Note: Need to implement kickMember in WahaChatClient

		// Update database
		await queries.removeGroupMember(this.db, chatId, phoneNumber);
	}

	/**
	 * Promote member to admin (database)
	 */
	async promoteAdmin(chatId: string, phoneNumber: string): Promise<void> {
		await queries.addGroupAdmin(this.db, chatId, phoneNumber);
	}

	/**
	 * Check if user is admin
	 */
	async isAdmin(chatId: string, phoneNumber: string): Promise<boolean> {
		return await queries.isGroupAdmin(this.db, chatId, phoneNumber);
	}

	// ==================== WELCOME MESSAGE ====================

	/**
	 * Send welcome message ke new member
	 */
	async sendWelcomeMessage(chatId: string, memberName: string, memberPhone: string): Promise<void> {
		const group = await queries.getGroupByChatId(this.db, chatId);

		if (!group) return;
		const settings = group.settings as queries.GroupSettings;
		if (!settings.welcome) return;

		// Format welcome message
		let message = settings.welcomeMessage;
		message = message.replace('{name}', memberName);
		message = message.replace('{group}', group.name);

		// Send welcome message
		await this.waha.sendToGroup(chatId, message, {
			mentions: [`${memberPhone}@c.us`],
		});
	}

	// ==================== TAGALL ====================

	/**
	 * Mention all members di group
	 * Sesuai dengan setting tagall permission
	 */
	async mentionAll(chatId: string, requesterPhone: string): Promise<void> {
		const group = await queries.getGroupByChatId(this.db, chatId);

		if (!group) throw new Error('Group not found');

		// Check permission
		const canTagAll = await this.canUseTagall(group, requesterPhone);
		if (!canTagAll) {
			throw new Error('You don\'t have permission to use tagall');
		}

		// Get all members - deserialize from JSON
		const members = schema.deserializeArray(group.member);
		const admins = schema.deserializeArray(group.admin);

		// Filter based on setting
		const settings = group.settings as queries.GroupSettings;
		let allowedToMention: string[] = [];
		if (settings.tagall === 'admin') {
			allowedToMention = admins;
		} else if (settings.tagall === 'owner') {
			// Only owner - but we don't track owner separately in admin array
			// Assuming first admin is owner
			allowedToMention = admins.slice(0, 1);
		} else {
			// member - everyone can be mentioned
			allowedToMention = [...members];
		}

		// Create mention text
		const mentionText = allowedToMention
			.map((phone) => `@${phone}`)
			.join(' ');

		// Send mention
		await this.waha.sendToGroup(chatId, mentionText, {
			mentions: allowedToMention.map((p) => `${p}@c.us`),
		});
	}

	/**
	 * Check if user can use tagall
	 */
	private async canUseTagall(
		group: queries.GroupWhatsAppSelect,
		requesterPhone: string,
	): Promise<boolean> {
		const settings = group.settings as queries.GroupSettings;
		const setting = settings.tagall;

		if (setting === 'member') {
			return true; // Everyone can use
		} else if (setting === 'admin') {
			return schema.deserializeArray(group.admin).includes(requesterPhone);
		} else if (setting === 'owner') {
			// Assuming first admin is owner
			return schema.deserializeArray(group.admin)?.[0] === requesterPhone;
		}

		return false;
	}
}

// ==================== EXPORT FACTORIES ====================

/**
 * Create GroupService instance
 */
export function createGroupService(
	db: any,
	wahaClient: WahaChatClient,
): GroupService {
	const drizzleDb = queries.getDb(db);
	return new GroupService({
		db: drizzleDb,
		wahaClient: wahaClient,
	});
}
