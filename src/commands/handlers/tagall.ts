/**
 * /tagall Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { getGroupParticipants, mentionAllWithClient } from '../../functions';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, env } = context;

	const participants = await getGroupParticipants(
		client['config'].getBaseUrl(),
		client['config'].getSession(),
		chatId,
		client['config'].getApiKey(),
	);

	const result = await mentionAllWithClient(client, chatId, participants);

	return new Response(JSON.stringify({ status: 'mention sent', result }), { status: 200 });
};

export default handler;
