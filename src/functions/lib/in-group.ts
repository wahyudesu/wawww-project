/**
 * Handle group join events and participant updates
 * Uses WahaChatClient for sending messages
 */

import { WahaChatClient } from './chatting';

// ==================== TYPES ====================

/**
 * Event structure for group-participants.update
 */
export interface GroupParticipantsUpdateEvent {
	id: string;
	session: string;
	event: string;
	payload: {
		event: 'group-participants.update';
		data: {
			id: string; // Group ID
			author: string | null;
			participants: Array<{
				id: string;
				phoneNumber: string;
				admin: string | null;
			}>;
			action: 'add' | 'remove' | 'promote' | 'demote';
		};
	};
	timestamp: number;
	metadata: Record<string, unknown>;
	me: {
		id: string;
		pushName: string;
		lid: string;
	};
	engine: string;
	environment: {
		version: string;
		engine: string;
		tier: string;
		browser: string | null;
	};
}

/**
 * Parsed participant data
 */
export interface ParticipantData {
	phone: string;
	groupId: string;
	isAdmin: boolean;
}

// ==================== EVENT DETECTORS ====================

/**
 * Detect if event is a group-participants.update event
 */
export function isGroupParticipantsUpdateEvent(event: unknown): event is GroupParticipantsUpdateEvent {
	return (
		typeof event === 'object' &&
		event !== null &&
		'payload' in event &&
		typeof (event as any).payload?.event === 'string' &&
		(event as any).payload.event === 'group-participants.update'
	);
}

/**
 * Check if action is 'add' (new member joined)
 */
export function isMemberAddEvent(event: GroupParticipantsUpdateEvent): boolean {
	return event.payload.data.action === 'add';
}

/**
 * Parse participants from group-participants.update event
 */
export function parseParticipantsFromEvent(
	event: GroupParticipantsUpdateEvent,
): ParticipantData[] {
	const { data } = event.payload;
	const participants: ParticipantData[] = [];

	if (!Array.isArray(data.participants)) {
		return participants;
	}

	for (const p of data.participants) {
		if (!p.phoneNumber) continue;

		// Normalize phone number
		const phone = p.phoneNumber
			.replace('@s.whatsapp.net', '')
			.replace('@c.us', '')
			.replace('@lid', '')
			.trim();

		participants.push({
			phone,
			groupId: data.id,
			isAdmin: p.admin === 'admin' || p.admin === 'superadmin',
		});
	}

	return participants;
}

// ==================== EVENT HANDLERS ====================

/**
 * Handle group-participants.update event (new members joined)
 * Sends welcome message to new participants
 */
export async function handleGroupParticipantsUpdate(
	event: GroupParticipantsUpdateEvent,
	client: WahaChatClient,
	env?: any,
): Promise<void> {
	if (!isMemberAddEvent(event)) {
		console.log(`Event action is '${event.payload.data.action}', skipping (only 'add' is handled)`);
		return;
	}

	const participants = parseParticipantsFromEvent(event);
	if (participants.length === 0) {
		console.log('No participants to welcome');
		return;
	}

	const { data } = event.payload;
	const groupId = data.id;

	// Check database for welcome setting (if env is provided)
	if (env?.DB) {
		try {
			const { getDb, getGroupByChatId } = await import('../../db/queries');
			const db = getDb(env.DB as any);
			const group = await getGroupByChatId(db, groupId);

			// Skip if welcome is disabled
			if (group?.settings?.welcome === false) {
				console.log(`Welcome is disabled for group ${groupId}, skipping`);
				return;
			}
		} catch (error) {
			console.error('Error checking welcome settings:', error);
			// Continue anyway if check fails
		}
	}

	console.log(
		`Welcoming ${participants.length} new member(s) to group ${groupId}`,
	);

	// Send welcome message for each participant
	for (const participant of participants) {
		try {
			await sendWelcomeMessage(client, groupId, participant.phone);
		} catch (err) {
			console.error(`Failed to send welcome to ${participant.phone}:`, err);
		}
	}
}

/**
 * Send welcome message to new member
 */
async function sendWelcomeMessage(
	client: WahaChatClient,
	groupId: string,
	phoneNumber: string,
): Promise<void> {
	const welcomeMessages = [
		`Halo @${phoneNumber}! Selamat datang di grup! 🎉`,
		`Selamat bergabung @${phoneNumber}! Jangan lupa baca deskripsi grup ya 👋`,
		`Welcome @${phoneNumber}! Semoga betah di grup ini 😊`,
	];

	// Pick random welcome message
	const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
	const welcomeMessage = welcomeMessages[randomIndex];

	// Send to group with mention
	await client.sendToGroup(groupId, welcomeMessage, {
		mentions: [`${phoneNumber}@c.us`],
	});

	console.log(`Welcome message sent to ${phoneNumber}`);
}

/**
 * Main entry point - detect and handle any group-related event
 */
export async function handleGroupEvent(
	event: unknown,
	client: WahaChatClient,
	env?: any,
): Promise<void> {
	if (!event || typeof event !== 'object') {
		console.log('Invalid event object');
		return;
	}

	// Handle group-participants.update event
	if (isGroupParticipantsUpdateEvent(event)) {
		await handleGroupParticipantsUpdate(event, client, env);
		return;
	}

	console.log('Unknown group event type:', event);
}

// ==================== GROUP JOIN EVENT (BOT JOINS GROUP) ====================

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
 * Handle group.v2.join event (bot joins a new group)
 * This function integrates with database to store group info
 */
export async function handleJoinGroupEvent(
	event: unknown,
	env: any,
): Promise<void> {
	if (!isGroupV2JoinEvent(event)) {
		console.log('Not a group.v2.join event');
		return;
	}

	const { payload } = event;
	const { id: groupId, name: groupName, owner } = payload;

	console.log(`Bot joined group: ${groupName} (${groupId})`);

	// Import queries dynamically to avoid circular dependency
	const { upsertGroup } = await import('../../db/queries');
	const { getDb } = await import('../../db/queries');

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

	console.log(`Group ${groupName} saved to database`);
}
