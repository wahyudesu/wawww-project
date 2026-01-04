/**
 * Welcoming Handler - Send welcome messages to new group members
 * Integrates with event handlers from lib/in-group.ts
 *
 * Flow: lib/in-group.ts (event detection) -> welcoming.ts (handler) -> index.ts (main)
 */

import { WahaChatClient } from './lib/chatting';
import { isGroupParticipantsUpdateEvent, handleGroupEvent } from './lib/in-group';
import type { GroupParticipantsUpdateEvent } from './lib/in-group';

// ==================== MAIN HANDLER ====================

/**
 * Main welcoming handler - detects event type and handles accordingly
 * @param event Event object from Waha webhook
 * @param client WahaChatClient instance
 */
export async function handleWelcoming(event: unknown, client: WahaChatClient): Promise<void> {
	try {
		// Use the unified handler from lib/in-group.ts
		await handleGroupEvent(event, client);
	} catch (error) {
		console.error('Error in welcoming handler:', error);
		throw error;
	}
}

/**
 * Check if event is a group participants update event
 */
export function isGroupParticipantsUpdate(event: unknown): event is GroupParticipantsUpdateEvent {
	return isGroupParticipantsUpdateEvent(event);
}

// ==================== LEGACY WRAPPER ====================
/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use handleWelcoming with WahaChatClient instead
 */
export async function handleWelcomingLegacy(
	baseUrl: string,
	session: string,
	apiKey: string,
	event: unknown,
) {
	const { createManualWahaConfig } = await import('../config/waha');
	const config = createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);

	return await handleWelcoming(event, client);
}
