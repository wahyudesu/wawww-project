/**
 * Group Utilities - Integrasi Waha API dengan Database
 * Hybrid approach: Support legacy API + Database operations
 */

import * as queries from '../db/queries';

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
 * Mention all group members
 * @deprecated Use GroupService.mentionAll() for database-integrated operations
 */
export async function mentionAll(
	baseUrl: string,
	session: string,
	chatId: string,
	apiKey: string,
): Promise<any> {
	let participants = await getGroupParticipants(baseUrl, session, chatId, apiKey);

	// Filter out specific numbers (blacklist)
	participants = participants.filter((id: string) => {
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
	let mentionText = participants
		.map((id: string) => {
			const phoneNumber = id.replace('@c.us', '').replace('@s.whatsapp.net', '').trim();
			return `@${phoneNumber}`;
		})
		.join(' ');

	// Clean up @lid artifacts
	mentionText = mentionText.replace(/@lid/gi, '').trim();
	mentionText = mentionText.replace(/\s+/g, ' ');

	const response = await fetch(`${baseUrl}/api/sendText`, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Api-Key': apiKey,
		},
		body: JSON.stringify({
			chatId: chatId,
			reply_to: null,
			text: mentionText,
			session: session,
			mentions: participants,
		}),
	});

	const result = await response.json();
	return result;
}

/**
 * Check if user is admin
 * Supports both Waha API check and database check
 */
export async function isAdmin(
	baseUrl: string,
	session: string,
	chatId: string,
	userId: string,
	apiKey: string,
	db?: any,
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
			// Fallback to database
			if (db) return checkAdminFromDatabase(db, chatId, userId);
			return false;
		}

		const participantsJson = await response.json();
		if (!Array.isArray(participantsJson)) {
			console.error('Participants response is not an array:', participantsJson);
			// Fallback to database
			if (db) return checkAdminFromDatabase(db, chatId, userId);
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
			// Fallback to database
			if (db) return checkAdminFromDatabase(db, chatId, userId);
			return false;
		}

		// Check various admin role patterns
		const isAdminRole = checkAdminRoleFromWahaUser(user);

		if (isAdminRole) {
			// Sync to database
			if (db) {
				try {
					const normalizedUserId = userId.replace('@s.whatsapp.net', '@c.us');
					const phone = normalizedUserId.replace('@c.us', '');
					const drizzleDb = queries.getDb(db);
					await queries.addGroupAdmin(drizzleDb, chatId, phone);
				} catch (err) {
					console.error('Failed to sync admin to database:', err);
				}
			}
			return true;
		}

		// Fallback: Check database
		if (db) return checkAdminFromDatabase(db, chatId, userId);

		return false;
	} catch (error) {
		console.error('Error checking admin status:', error);
		// Final fallback to database
		if (db) return checkAdminFromDatabase(db, chatId, userId);
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
 * Check admin from database
 */
async function checkAdminFromDatabase(db: any, chatId: string, userId: string): Promise<boolean> {
	try {
		const normalizedUserId = userId.replace('@s.whatsapp.net', '@c.us');
		const phone = normalizedUserId.replace('@c.us', '');
		const drizzleDb = queries.getDb(db);
		return await queries.isGroupAdmin(drizzleDb, chatId, phone);
	} catch (dbError) {
		console.error('Database admin check failed:', dbError);
		return false;
	}
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
