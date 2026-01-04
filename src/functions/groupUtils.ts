// intinya ini tuh fungsi fungsi terkait grup
// mengecek setting terlebih dahulu, lalu mention semua member, kick member, add member,
// mengecek input masuk -> setting di db -> panggil s

import { WahaChatClient } from './lib/chatting';
import { createManualWahaConfig as _createManualWahaConfig } from '../config/waha';

// ==================== REFACTORED FUNCTIONS ====================
// Using WahaChatClient from lib/chatting.ts

/**
 * Mention all group members
 * Uses WahaChatClient for sending messages
 */
export async function mentionAll(
	client: WahaChatClient,
	chatId: string,
	participants: string[],
): Promise<any> {
	// Filter out specific numbers (blacklist)
	const filteredParticipants = participants.filter((id: string) => {
		const phoneNumber = id.replace('@c.us', '').replace('@s.whatsapp.net', '');
		return (
			phoneNumber !== '6285655268926' &&
			phoneNumber !== '6282147200531' &&
			phoneNumber !== '6281230701259' &&
			phoneNumber !== '628885553273' &&
			phoneNumber !== '6281326966110'
		);
	});

	// Create mention text
	let mentionText = filteredParticipants
		.map((id: string) => {
			const phoneNumber = id.replace('@c.us', '').replace('@s.whatsapp.net', '').trim();
			return `@${phoneNumber}`;
		})
		.join(' ');

	// Clean up @lid artifacts
	mentionText = mentionText.replace(/@lid/gi, '').trim();
	mentionText = mentionText.replace(/\s+/g, ' ');

	// Send message using WahaChatClient
	return await client.sendToGroup(chatId, mentionText, {
		mentions: filteredParticipants,
	});
}

// ==================== LEGACY API FUNCTIONS ====================
// These functions are kept for backward compatibility with src/index.ts

/**
 * Get group participants from Waha API
 * @deprecated Use GroupService instead for database-integrated operations
 */
export async function getGroupParticipants(
	baseUrl: string,
	session: string,
	chatId: string,
	apiKey: string,
): Promise<string[]> {
	const response = await fetch(`${baseUrl}/api/${session}/groups/${chatId}/participants`, {
		method: 'GET',
		headers: {
			accept: '*/*',
			'X-Api-Key': apiKey,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch participants: ${response.statusText}`);
	}

	const participantsJson = await response.json();
	if (!Array.isArray(participantsJson)) {
		throw new Error('Participants response is not an array');
	}

	// Extract and return phone numbers only
	const participantIds = participantsJson.map((participant: any) => {
		const phoneId = participant.jid || participant.id;
		return phoneId.replace('@s.whatsapp.net', '@c.us');
	});

	return participantIds;
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
	const config = _createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);
	const participants = await getGroupParticipants(baseUrl, session, chatId, apiKey);
	return await mentionAll(client, chatId, participants);
}

/**
 * Check if user is admin
 * Supports Waha API check
 */
export async function isAdmin(
	baseUrl: string,
	session: string,
	chatId: string,
	userId: string,
	apiKey: string,
): Promise<boolean> {
	try {
		// Try Waha API first (real-time admin status)
		const response = await fetch(`${baseUrl}/api/${session}/groups/${chatId}/participants`, {
			method: 'GET',
			headers: {
				accept: '*/*',
				'X-Api-Key': apiKey,
			},
		});

		if (!response.ok) {
			console.error('Failed to fetch participants for admin check:', response.statusText);
			return false;
		}

		const participantsJson = await response.json();
		if (!Array.isArray(participantsJson)) {
			console.error('Participants response is not an array:', participantsJson);
			return false;
		}

		// Find user and check if they are admin
		const user = participantsJson.find((p: any) => {
			const phoneId = p.jid || p.id;
			const formattedId = phoneId.replace('@s.whatsapp.net', '@c.us');
			const normalizedUserId = userId.replace('@s.whatsapp.net', '@c.us');
			return formattedId === normalizedUserId || p.id === normalizedUserId || phoneId === normalizedUserId;
		});

		if (!user) {
			console.log('User not found in participants list');
			return false;
		}

		// Check various admin role patterns
		const isAdminRole = checkAdminRoleFromWahaUser(user);

		if (isAdminRole) {
			return true;
		}

		return false;
	} catch (error) {
		console.error('Error checking admin status:', error);
		return false;
	}
}

/**
 * Check admin role from Waha user object
 */
function checkAdminRoleFromWahaUser(user: any): boolean {
	const allStringValues = Object.values(user).filter((val) => typeof val === 'string') as string[];
	const containsAdminInString = allStringValues.some(
		(val) => val.toLowerCase().includes('admin') || val.toLowerCase().includes('moderator') || val.toLowerCase().includes('owner'),
	);

	return (
		// Exact matches
		user.rank === 'admin' ||
		user.rank === 'superadmin' ||
		user.rank === 'Admin' ||
		user.rank === 'SuperAdmin' ||
		user.role === 'admin' ||
		user.role === 'superadmin' ||
		user.role === 'Admin' ||
		user.role === 'SuperAdmin' ||
		user.type === 'admin' ||
		user.type === 'superadmin' ||
		user.type === 'Admin' ||
		user.type === 'SuperAdmin' ||
		// Boolean fields
		user.admin === true ||
		user.isAdmin === true ||
		// Group specific fields
		user.role === 'group_admin' ||
		user.role === 'GroupAdmin' ||
		user.groupRole === 'admin' ||
		user.groupRole === 'Admin' ||
		user.level === 'admin' ||
		user.level === 'Admin' ||
		// Contains checks
		(user.rank && String(user.rank).toLowerCase().includes('admin')) ||
		(user.rank && String(user.rank).toLowerCase().includes('moderator')) ||
		(user.rank && String(user.rank).toLowerCase().includes('owner')) ||
		(user.role && String(user.role).toLowerCase().includes('admin')) ||
		(user.role && String(user.role).toLowerCase().includes('moderator')) ||
		(user.role && String(user.role).toLowerCase().includes('owner')) ||
		(user.type && String(user.type).toLowerCase().includes('admin')) ||
		(user.type && String(user.type).toLowerCase().includes('moderator')) ||
		(user.type && String(user.type).toLowerCase().includes('owner')) ||
		(user.groupRole && String(user.groupRole).toLowerCase().includes('admin')) ||
		(user.groupRole && String(user.groupRole).toLowerCase().includes('moderator')) ||
		(user.groupRole && String(user.groupRole).toLowerCase().includes('owner')) ||
		(user.level && String(user.level).toLowerCase().includes('admin')) ||
		(user.level && String(user.level).toLowerCase().includes('moderator')) ||
		(user.level && String(user.level).toLowerCase().includes('owner')) ||
		// Check ALL string values
		containsAdminInString
	);
}

/**
 * Kick member from group (admin only)
 */
export async function kickMember(
	baseUrl: string,
	session: string,
	chatId: string,
	participantId: string,
	apiKey: string,
): Promise<any> {
	console.log(`Attempting to kick member ${participantId} from group ${chatId}`);

	// Try DELETE method
	const endpoint1 = `${baseUrl}/api/${session}/groups/${chatId}/participants/${participantId}`;
	const endpoint2 = `${baseUrl}/api/${session}/groups/${chatId}/participants/remove`;

	try {
		const response = await fetch(endpoint1, {
			method: 'DELETE',
			headers: {
				accept: '*/*',
				'X-Api-Key': apiKey,
			},
		});

		if (response.ok) {
			return await response.json();
		}
	} catch (error) {
		console.log('DELETE failed, trying POST method');
	}

	// Try POST method
	try {
		const response = await fetch(endpoint2, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'Content-Type': 'application/json',
				'X-Api-Key': apiKey,
			},
			body: JSON.stringify({
				groupId: chatId,
				participantChatId: participantId,
			}),
		});

		const result = (await response.json()) as any;
		if (response.ok || (result && (result.success || result.removed || result.kicked))) {
			return result;
		} else {
			throw new Error(`Both DELETE and POST methods failed. Last response: ${JSON.stringify(result)}`);
		}
	} catch (error) {
		console.error('All kick methods failed:', error);
		throw error;
	}
}

/**
 * Add member to group (admin only)
 */
export async function addMember(
	baseUrl: string,
	session: string,
	chatId: string,
	participantIds: string[],
	apiKey: string,
): Promise<any> {
	console.log(`Attempting to add members ${JSON.stringify(participantIds)} to group ${chatId}`);

	const endpoint1 = `${baseUrl}/api/${session}/groups/${chatId}/participants/add`;
	const endpoint2 = `${baseUrl}/api/${session}/addParticipant`;

	// Try first endpoint
	try {
		const response = await fetch(endpoint1, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'Content-Type': 'application/json',
				'X-Api-Key': apiKey,
			},
			body: JSON.stringify({
				participants: participantIds.map((id) => id.replace('@c.us', '')),
			}),
		});

		const result = (await response.json()) as any;
		if (response.ok || (result && (result.success || result.added || result.addParticipant !== false))) {
			return result;
		}
	} catch (error) {
		console.log('Endpoint1 failed:', error);
	}

	// Try second endpoint
	try {
		const response = await fetch(endpoint2, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'Content-Type': 'application/json',
				'X-Api-Key': apiKey,
			},
			body: JSON.stringify({
				groupId: chatId,
				participantChatId: participantIds[0],
			}),
		});

		const result = (await response.json()) as any;
		if (response.ok || (result && (result.success || result.added || result.addParticipant !== false))) {
			return result;
		} else {
			throw new Error(`All add member endpoints failed. Last response: ${JSON.stringify(result)}`);
		}
	} catch (error) {
		console.error('All add methods failed:', error);
		throw error;
	}
}

/**
 * Close group - only admins can send messages
 */
export async function closeGroup(baseUrl: string, session: string, chatId: string, apiKey: string): Promise<any> {
	const endpoint = `${baseUrl}/api/${session}/groups/${chatId}/settings/security/messages-admin-only`;

	const response = await fetch(endpoint, {
		method: 'PUT',
		headers: {
			accept: '*/*',
			'Content-Type': 'application/json',
			'X-Api-Key': apiKey,
		},
		body: JSON.stringify({ adminsOnly: true }),
	});

	if (!response.ok) {
		const result = (await response.json()) as any;
		throw new Error(`HTTP ${response.status}: ${response.statusText} - ${JSON.stringify(result)}`);
	}

	const result = (await response.json()) as any;
	if (result === true || result.adminsOnly === true) {
		return { success: true, adminsOnly: true };
	} else {
		throw new Error('Failed to update group settings.');
	}
}

/**
 * Open group - all members can send messages
 */
export async function openGroup(baseUrl: string, session: string, chatId: string, apiKey: string): Promise<any> {
	const endpoint = `${baseUrl}/api/${session}/groups/${chatId}/settings/security/messages-admin-only`;

	const response = await fetch(endpoint, {
		method: 'PUT',
		headers: {
			accept: '*/*',
			'Content-Type': 'application/json',
			'X-Api-Key': apiKey,
		},
		body: JSON.stringify({ adminsOnly: false }),
	});

	if (!response.ok) {
		const result = (await response.json()) as any;
		throw new Error(`HTTP ${response.status}: ${response.statusText} - ${JSON.stringify(result)}`);
	}

	const result = (await response.json()) as any;
	if (result === true || result.adminsOnly === false) {
		return { success: true, adminsOnly: false };
	} else {
		throw new Error('Failed to update group settings.');
	}
}

// ==================== ADMIN COMMAND HANDLERS ====================
// These handlers check admin status and use WahaChatClient for messaging

/**
 * Handle /kick command with admin check
 * @param client WahaChatClient instance
 * @param baseUrl Waha base URL
 * @param session Session name
 * @param apiKey API key
 * @param chatId Group chat ID
 * @param requesterId User who sent the command
 * @param targetNumber Phone number to kick
 * @param replyToMessageId Message ID to reply to
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
	// Check if requester is admin
	const isAdminUser = await isAdmin(baseUrl, session, chatId, requesterId, apiKey);

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
		await kickMember(baseUrl, session, chatId, participantId, apiKey);
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
 * @param client WahaChatClient instance
 * @param baseUrl Waha base URL
 * @param session Session name
 * @param apiKey API key
 * @param chatId Group chat ID
 * @param requesterId User who sent the command
 * @param targetNumbers Phone numbers to add
 * @param replyToMessageId Message ID to reply to
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
	// Check if requester is admin
	const isAdminUser = await isAdmin(baseUrl, session, chatId, requesterId, apiKey);

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
		const result = await addMember(baseUrl, session, chatId, participantIds, apiKey);
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
	const config = _createManualWahaConfig(baseUrl, apiKey, session);
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
	const config = _createManualWahaConfig(baseUrl, apiKey, session);
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
