/**
 * Group Utilities (Refactored)
 * Uses services for cleaner separation of concerns
 */

import { WahaChatClient } from './lib/chatting';
import { createManualWahaConfig } from '../config/waha';
import { GroupAdminService, GroupMemberService, GroupSettingsService, GroupParticipantService } from '../services';

// ==================== TYPE DEFINITIONS ====================

export interface AdminCheckResult {
	isAdmin: boolean;
	user?: any;
}

// ==================== REFACTORED FUNCTIONS ====================
// Using new service classes

/**
 * Mention all group members (new implementation)
 */
export async function mentionAll(
	client: WahaChatClient,
	chatId: string,
	participants: string[],
): Promise<any> {
	const { baseUrl, session, apiKey } = client['config'].getConfig();
	const participantService = new GroupParticipantService(baseUrl, session, apiKey);

	const filteredParticipants = participantService.filterParticipants(participants);
	const mentionText = participantService.createMentionText(filteredParticipants);

	return await client.sendToGroup(chatId, mentionText, {
		mentions: filteredParticipants,
	});
}

// ==================== LEGACY API FUNCTIONS ====================
// These functions are kept for backward compatibility with src/index.ts

/**
 * Get group participants from Waha API
 * @deprecated Use GroupParticipantService instead
 */
export async function getGroupParticipants(
	baseUrl: string,
	session: string,
	chatId: string,
	apiKey: string,
): Promise<string[]> {
	const participantService = new GroupParticipantService(baseUrl, session, apiKey);
	return await participantService.getParticipants(chatId);
}

/**
 * Mention all group members (Legacy Wrapper)
 * @deprecated Use mentionAll with WahaChatClient instead
 */
export async function mentionAllLegacy(
	baseUrl: string,
	session: string,
	chatId: string,
	apiKey: string,
): Promise<any> {
	const config = createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);
	const participants = await getGroupParticipants(baseUrl, session, chatId, apiKey);
	return await mentionAll(client, chatId, participants);
}

/**
 * Check if user is admin
 * @deprecated Use GroupAdminService instead
 */
export async function isAdmin(
	baseUrl: string,
	session: string,
	chatId: string,
	userId: string,
	apiKey: string,
): Promise<boolean> {
	const adminService = new GroupAdminService(baseUrl, session, apiKey);
	return await adminService.isAdmin(chatId, userId);
}

/**
 * Kick member from group (admin only)
 * @deprecated Use GroupMemberService instead
 */
export async function kickMember(
	baseUrl: string,
	session: string,
	chatId: string,
	participantId: string,
	apiKey: string,
): Promise<any> {
	const memberService = new GroupMemberService(baseUrl, session, apiKey);
	return await memberService.kickMember(chatId, participantId);
}

/**
 * Add member to group (admin only)
 * @deprecated Use GroupMemberService instead
 */
export async function addMember(
	baseUrl: string,
	session: string,
	chatId: string,
	participantIds: string[],
	apiKey: string,
): Promise<any> {
	const memberService = new GroupMemberService(baseUrl, session, apiKey);
	return await memberService.addMember(chatId, participantIds);
}

/**
 * Close group - only admins can send messages
 * @deprecated Use GroupSettingsService instead
 */
export async function closeGroup(baseUrl: string, session: string, chatId: string, apiKey: string): Promise<any> {
	const settingsService = new GroupSettingsService(baseUrl, session, apiKey);
	return await settingsService.closeGroup(chatId);
}

/**
 * Open group - all members can send messages
 * @deprecated Use GroupSettingsService instead
 */
export async function openGroup(baseUrl: string, session: string, chatId: string, apiKey: string): Promise<any> {
	const settingsService = new GroupSettingsService(baseUrl, session, apiKey);
	return await settingsService.openGroup(chatId);
}

// ==================== ADMIN COMMAND HANDLERS ====================
// These handlers check admin status and use WahaChatClient for messaging

/**
 * Handle /kick command with admin check
 * @deprecated Use command handlers from /src/commands instead
 */
export async function handleKickCommand(
	client: WahaChatClient,
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	requesterId: string,
	targetNumber: string,
	replyToMessageId: string,
): Promise<void> {
	const adminService = new GroupAdminService(baseUrl, session, apiKey);
	const memberService = new GroupMemberService(baseUrl, session, apiKey);

	// Check if requester is admin
	const isAdminUser = await adminService.isAdmin(chatId, requesterId);

	if (!isAdminUser) {
		await client.sendText({
			chatId,
			text: '❌ Maaf, hanya admin yang bisa menggunakan perintah ini.',
			reply_to: replyToMessageId,
		});
		return;
	}

	// Validate target number
	if (!targetNumber) {
		await client.sendText({
			chatId,
			text: '⚠️ Format: /kick <nomor_telepon>\nContoh: /kick 628123456789',
			reply_to: replyToMessageId,
		});
		return;
	}

	// Format participant ID
	const participantId = targetNumber.includes('@') ? targetNumber : `${targetNumber}@c.us`;

	try {
		await memberService.kickMember(chatId, participantId);
		await client.sendText({
			chatId,
			text: `✅ Berhasil mengeluarkan member ${targetNumber} dari grup.`,
			reply_to: replyToMessageId,
		});
	} catch (error) {
		console.error('Error kicking member:', error);
		await client.sendText({
			chatId,
			text: `❌ Gagal mengeluarkan member: ${error instanceof Error ? error.message : 'Unknown error'}`,
			reply_to: replyToMessageId,
		});
	}
}

/**
 * Handle /add command with admin check
 * @deprecated Use command handlers from /src/commands instead
 */
export async function handleAddCommand(
	client: WahaChatClient,
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	requesterId: string,
	targetNumbers: string[],
	replyToMessageId: string,
): Promise<void> {
	const adminService = new GroupAdminService(baseUrl, session, apiKey);
	const memberService = new GroupMemberService(baseUrl, session, apiKey);

	// Check if requester is admin
	const isAdminUser = await adminService.isAdmin(chatId, requesterId);

	if (!isAdminUser) {
		await client.sendText({
			chatId,
			text: '❌ Maaf, hanya admin yang bisa menggunakan perintah ini.',
			reply_to: replyToMessageId,
		});
		return;
	}

	// Validate target numbers
	if (!targetNumbers || targetNumbers.length === 0) {
		await client.sendText({
			chatId,
			text: '⚠️ Format: /add <nomor1,nomor2,...>\nContoh: /add 628123456789,628987654321',
			reply_to: replyToMessageId,
		});
		return;
	}

	// Format participant IDs
	const participantIds = targetNumbers.map((num) => (num.includes('@') ? num : `${num}@c.us`));

	try {
		const result = await memberService.addMember(chatId, participantIds);
		console.log('Add member result:', result);
		await client.sendText({
			chatId,
			text: `✅ Berhasil menambahkan ${targetNumbers.length} member ke grup.`,
			reply_to: replyToMessageId,
		});
	} catch (error) {
		console.error('Error adding member:', error);
		await client.sendText({
			chatId,
			text: `❌ Gagal menambahkan member: ${error instanceof Error ? error.message : 'Unknown error'}`,
			reply_to: replyToMessageId,
		});
	}
}

// ==================== LEGACY WRAPPERS ====================
/**
 * Legacy wrapper for handleKickCommand
 * @deprecated Use handleKickCommand with WahaChatClient instead
 */
export async function handleKickCommandLegacy(
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	requesterId: string,
	targetNumber: string,
	replyToMessageId: string,
) {
	const config = createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);

	return await handleKickCommand(
		client,
		baseUrl,
		session,
		apiKey,
		chatId,
		requesterId,
		targetNumber,
		replyToMessageId,
	);
}

/**
 * Legacy wrapper for handleAddCommand
 * @deprecated Use handleAddCommand with WahaChatClient instead
 */
export async function handleAddCommandLegacy(
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	requesterId: string,
	targetNumbers: string[],
	replyToMessageId: string,
) {
	const config = createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);

	return await handleAddCommand(
		client,
		baseUrl,
		session,
		apiKey,
		chatId,
		requesterId,
		targetNumbers,
		replyToMessageId,
	);
}
