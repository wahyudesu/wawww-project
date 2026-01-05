/**
 * /dev Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleDevInfo } from '../../functions/greetings';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	await handleDevInfo(client, chatId, replyTo);

	return new Response(JSON.stringify({ status: 'dev info sent' }), { status: 200 });
};

export default handler;
