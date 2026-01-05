/**
 * /pantun Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import pantunList from '../../data/pantun.json';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	const idx = Math.floor(Math.random() * pantunList.length);
	const pantun = pantunList[idx];
	const pantunText = pantun.map((bait) => bait.join('\n')).join('\n\n');

	await client.sendText({ chatId, text: pantunText, reply_to: replyTo });

	return new Response(JSON.stringify({ status: 'pantun sent', pantun: pantunText }), { status: 200 });
};

export default handler;
