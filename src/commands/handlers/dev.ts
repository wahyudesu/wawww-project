/**
 * /dev Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleDevInfoLegacy } from '../../functions';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;
	const { baseUrl, session, apiKey } = client['config'].getConfig();

	await handleDevInfoLegacy(baseUrl, session, apiKey, chatId, replyTo);

	return new Response(JSON.stringify({ status: 'dev info sent' }), { status: 200 });
};

export default handler;
