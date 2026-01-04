/**
 * /kick Command Handler (Admin Only)
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleKickCommandLegacy } from '../../functions';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo, participant, text } = context;

	if (!participant) {
		return new Response(JSON.stringify({ error: 'Participant required' }), { status: 400 });
	}

	const targetNumber = text?.replace('/kick', '').trim() || '';
	const { baseUrl, session, apiKey } = client['config'].getConfig();

	await handleKickCommandLegacy(baseUrl, session, apiKey, chatId, participant, targetNumber, replyTo);

	return new Response(JSON.stringify({ status: 'kick command processed' }), { status: 200 });
};

export default handler;
