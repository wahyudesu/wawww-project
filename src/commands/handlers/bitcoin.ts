/**
 * /bitcoin Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleBitcoinCommandLegacy } from '../../functions';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;
	const { baseUrl, session, apiKey } = client['config'].getConfig();

	await handleBitcoinCommandLegacy(baseUrl, session, apiKey, chatId, replyTo);

	return new Response(JSON.stringify({ status: 'bitcoin sent' }), { status: 200 });
};

export default handler;
