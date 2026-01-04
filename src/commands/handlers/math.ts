/**
 * /math Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleMathQuizCommandLegacy } from '../../functions';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;
	const { baseUrl, session, apiKey } = client['config'].getConfig();

	await handleMathQuizCommandLegacy(baseUrl, session, apiKey, chatId, replyTo, 3);

	return new Response(JSON.stringify({ status: 'math quiz sent' }), { status: 200 });
};

export default handler;
