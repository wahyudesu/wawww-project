/**
 * /tagall Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { GroupParticipantService } from '../../services';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId } = context;
	const { baseUrl, session, apiKey } = client['config'].getConfig();

	const participantService = new GroupParticipantService(baseUrl, session, apiKey);

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
