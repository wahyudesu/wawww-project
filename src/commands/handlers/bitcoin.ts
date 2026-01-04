/**
 * /bitcoin Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleBitcoinCommand } from '../../functions/bitcoin';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	await handleBitcoinCommand(client, chatId, replyTo);

	return new Response(JSON.stringify({ status: 'bitcoin sent' }), { status: 200 });
};

export default handler;
