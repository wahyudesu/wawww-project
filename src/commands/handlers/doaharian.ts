/**
 * /doaharian Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import doaHarianList from '../../data/doaharian.json';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	const idx = Math.floor(Math.random() * doaHarianList.length);
	const doa = doaHarianList[idx];
	const doaText = `📿 *${doa.title}*\n\n${doa.arabic}\n\n_${doa.latin}_\n\n${doa.translation}`;

	await client.sendText({ chatId, text: doaText, reply_to: replyTo });

	return new Response(JSON.stringify({ status: 'doa sent', doa: doaText }), { status: 200 });
};

export default handler;
