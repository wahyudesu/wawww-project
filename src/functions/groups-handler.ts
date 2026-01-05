/**
 * Groups Handler
 * Menangani event ketika bot ditambahkan atau dikick dari grup
 * - Bot join group: Insert/update data grup ke database
 * - Bot kick/remove dari group: Delete data grup dari database
 */

import { WahaChatClient } from './lib/chatting';

// ==================== TYPES ====================

/**
 * Event structure for group.v2.join (bot joins a group)
 */
export interface GroupV2JoinEvent {
	id: string;
	session: string;
	event: 'group.v2.join';
	payload: {
		id: string; // Group ID
		name: string; // Group name
		owner: string; // Owner phone number
		participants?: Array<{
			id: string;
			phoneNumber: string;
			admin: string | null;
		}>;
	};
	timestamp: number;
	metadata: Record<string, unknown>;
}

/**
 * Event structure for group.v2.participants (member changes)
 */
export interface GroupV2ParticipantsEvent {
	id: string;
	session: string;
	event: 'group.v2.participants';
	payload: {
		type: 'join' | 'leave' | 'promote' | 'demote';
		group: {
			id: string;
			name: string;
			owner: string;
		};
		participants: Array<{
			id: string;
			phoneNumber: string;
		}>;
		author?: string;
	};
	timestamp: number;
	metadata: Record<string, unknown>;
	me?: {
		id: string;
		pushName: string;
	};
}

// ==================== EVENT DETECTORS ====================

/**
 * Detect if event is a group.v2.join event
 */
export function isGroupV2JoinEvent(event: unknown): event is GroupV2JoinEvent {
	return (
		typeof event === 'object' &&
		event !== null &&
		'event' in event &&
		(event as any).event === 'group.v2.join'
	);
}

/**
 * Detect if event is a group.v2.participants event
 */
export function isGroupV2ParticipantsEvent(event: unknown): event is GroupV2ParticipantsEvent {
	return (
		typeof event === 'object' &&
		event !== null &&
		'event' in event &&
		(event as any).event === 'group.v2.participants'
	);
}

/**
 * Check if bot was removed from group in the event
 */
export function isBotRemovedEvent(event: GroupV2ParticipantsEvent, botPhoneId: string): boolean {
	if (event.payload.type !== 'leave') {
		return false;
	}

	// Check if bot is in the removed participants list
	const removedParticipants = event.payload.participants || [];
	return removedParticipants.some((p) => {
		const phone = p.phoneNumber
			?.replace('@s.whatsapp.net', '')
			.replace('@c.us', '')
			.replace('@lid', '')
			.trim();
		const botPhone = botPhoneId
			.replace('@s.whatsapp.net', '')
			.replace('@c.us', '')
			.replace('@lid', '')
			.trim();
		return phone === botPhone;
	});
}

// ==================== HANDLERS ====================

/**
 * Handle group.v2.join event (bot joins a new group)
 * Insert atau update data grup ke database
 */
export async function handleBotJoinGroup(
	event: unknown,
	env: any,
): Promise<{ success: boolean; groupId?: string; groupName?: string; error?: string }> {
	if (!isGroupV2JoinEvent(event)) {
		return { success: false, error: 'Not a group.v2.join event' };
	}

	const { payload } = event;
	const { id: groupId, name: groupName, owner } = payload;

	console.log(`[GroupJoin] Bot joined group: ${groupName} (${groupId})`);

	try {
		// Import queries dynamically
		const { upsertGroup, getDb } = await import('../db/queries');

		const db = getDb(env.DB as any);

		// Parse participants
		const participants = payload.participants || [];
		const admins: string[] = [];
		const members: string[] = [];

		for (const p of participants) {
			const phone = p.phoneNumber
				?.replace('@s.whatsapp.net', '')
				.replace('@c.us', '')
				.replace('@lid', '')
				.trim();

			if (!phone) continue;

			if (p.admin === 'admin' || p.admin === 'superadmin') {
				admins.push(phone);
			}
			members.push(phone);
		}

		// Upsert group to database
		await upsertGroup(db, {
			id: groupId,
			name: groupName,
			ownerId: owner.replace('@c.us', '').replace('@s.whatsapp.net', ''),
			admin: admins,
			member: members,
		});

		console.log(`[GroupJoin] Group ${groupName} saved to database`);

		return { success: true, groupId, groupName };
	} catch (error) {
		console.error(`[GroupJoin] Error saving group to database:`, error);
		return {
			success: false,
			groupId,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Handle bot removed from group event
 * Delete data grup dari database
 */
export async function handleBotLeaveGroup(
	event: unknown,
	botPhoneId: string,
	env: any,
): Promise<{ success: boolean; groupId?: string; groupName?: string; error?: string }> {
	if (!isGroupV2ParticipantsEvent(event)) {
		return { success: false, error: 'Not a group.v2.participants event' };
	}

	// Check if bot was removed
	if (!isBotRemovedEvent(event, botPhoneId)) {
		console.log('[GroupLeave] Bot not in removed participants, skipping');
		return { success: false, error: 'Bot not in removed participants' };
	}

	const { payload } = event;
	const { group, participants } = payload;
	const groupId = group.id;
	const groupName = group.name;

	console.log(`[GroupLeave] Bot removed from group: ${groupName} (${groupId})`);

	try {
		// Import queries dynamically
		const { deleteGroup, getDb } = await import('../db/queries');

		const db = getDb(env.DB as any);

		// Delete group from database
		await deleteGroup(db, groupId);

		console.log(`[GroupLeave] Group ${groupName} deleted from database`);

		return { success: true, groupId, groupName };
	} catch (error) {
		console.error(`[GroupLeave] Error deleting group from database:`, error);
		return {
			success: false,
			groupId,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

/**
 * Main handler untuk group events
 * Router function yang mendeteksi jenis event dan mengirim ke handler yang sesuai
 */
export async function handleGroupEvent(
	event: unknown,
	botPhoneId: string,
	env: any,
): Promise<{ success: boolean; type?: string; groupId?: string; error?: string }> {
	// Handle bot join group
	if (isGroupV2JoinEvent(event)) {
		const result = await handleBotJoinGroup(event, env);
		return {
			...result,
			type: 'join',
		};
	}

	// Handle bot leave group
	if (isGroupV2ParticipantsEvent(event)) {
		const result = await handleBotLeaveGroup(event, botPhoneId, env);
		return {
			...result,
			type: 'leave',
		};
	}

	console.log('[GroupEvent] Unknown event type:', event);
	return { success: false, error: 'Unknown event type' };
}
