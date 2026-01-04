/**
 * /opengroup Command Handler (Admin Only)
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { isAdmin, openGroup } from '../../functions';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo, participant } = context;

	if (!participant) {
		return new Response(JSON.stringify({ error: 'Participant required' }), { status: 400 });
	}

	const { baseUrl, session, apiKey } = client['config'].getConfig();

	// Check if user is admin
	const adminCheck = await isAdmin(baseUrl, session, chatId, participant, apiKey);

	if (!adminCheck) {
		await client.sendText({
			chatId,
			text: '❌ Maaf, hanya admin yang bisa menggunakan perintah ini.',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'access denied' }), { status: 200 });
	}

	await openGroup(baseUrl, session, chatId, apiKey);

	await client.sendText({
		chatId,
		text: '🔓 Grup telah dibuka. Semua anggota dapat mengirim pesan.',
		reply_to: replyTo,
	});

	return new Response(JSON.stringify({ status: 'group opened' }), { status: 200 });
};

export default handler;
