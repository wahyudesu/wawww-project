/**
 * /math Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleMathQuizCommand } from '../../functions/math-quiz';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	await handleMathQuizCommand(client, chatId, replyTo, 3);

	return new Response(JSON.stringify({ status: 'math quiz sent' }), { status: 200 });
};

export default handler;
