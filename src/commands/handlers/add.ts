/**
 * /add Command Handler (Admin Only)
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleAddCommandLegacy } from '../../functions';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo, participant, text } = context;

	if (!participant) {
		return new Response(JSON.stringify({ error: 'Participant required' }), { status: 400 });
	}

	const targetNumbers = text
		?.replace('/add', '')
		.trim()
		.split(/[\s,]+/)
		.filter((n) => n) || [];

	const { baseUrl, session, apiKey } = client['config'].getConfig();

	await handleAddCommandLegacy(baseUrl, session, apiKey, chatId, participant, targetNumbers, replyTo);

	return new Response(JSON.stringify({ status: 'add command processed' }), { status: 200 });
};

export default handler;
