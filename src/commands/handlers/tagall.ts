/**
 * /tagall Command Handler
 * Mentions all group members (with permission check from database)
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { GroupParticipantService, GroupAdminService } from '../../services';
import { getDb, getGroupByChatId, updateGroupSettings } from '../../db/queries';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, participant, env } = context;
	const { baseUrl, session, apiKey } = client.getConfig();

	const participantService = new GroupParticipantService(baseUrl, session, apiKey);
	const adminService = new GroupAdminService(baseUrl, session, apiKey);

	// Get group settings from database
	const db = getDb(env?.DB as any);
	const group = await getGroupByChatId(db, chatId);

	// Default to admin-only if no settings found
	let tagallPermission = 'admin';
	if (group?.settings?.tagall) {
		tagallPermission = group.settings.tagall;
	}

	// Check permission based on settings
	if (tagallPermission === 'admin') {
		// Only admins can use tagall
		const isAdmin = await adminService.isAdmin(chatId, participant || '');
		if (!isAdmin) {
			await client.sendText({
				chatId,
				text: '❌ Maaf, hanya admin yang bisa menggunakan command /tagall.',
			});
			return new Response(JSON.stringify({ status: 'not authorized' }), { status: 200 });
		}
	}
	// If tagallPermission is 'member', everyone can use it

	// Get all participants
	const participants = await participantService.getParticipants(chatId);

	// Filter participants
	const filteredParticipants = participantService.filterParticipants(participants);

	// Create mention text
	const mentionText = participantService.createMentionText(filteredParticipants);

	// Send message
	await client.sendToGroup(chatId, mentionText, {
		mentions: filteredParticipants,
	});

	return new Response(JSON.stringify({ status: 'mention sent' }), { status: 200 });
};

export default handler;
