/**
 * /kick Command Handler (Admin Only)
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { GroupAdminService, GroupMemberService } from '../../services';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo, participant, text } = context;

	if (!participant) {
		return new Response(JSON.stringify({ error: 'Participant required' }), { status: 400 });
	}

	const targetNumber = text?.replace('/kick', '').trim() || '';
	const { baseUrl, session, apiKey } = client['config'].getConfig();

	const adminService = new GroupAdminService(baseUrl, session, apiKey);
	const memberService = new GroupMemberService(baseUrl, session, apiKey);

	// Check if requester is admin
	const isAdminUser = await adminService.isAdmin(chatId, participant);

	if (!isAdminUser) {
		await client.sendText({
			chatId,
			text: '❌ Maaf, hanya admin yang bisa menggunakan perintah ini.',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'access denied' }), { status: 200 });
	}

	// Validate target number
	if (!targetNumber) {
		await client.sendText({
			chatId,
			text: '⚠️ Format: /kick <nomor_telepon>\nContoh: /kick 628123456789',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'invalid format' }), { status: 200 });
	}

	// Format participant ID
	const participantId = targetNumber.includes('@') ? targetNumber : `${targetNumber}@c.us`;

	try {
		await memberService.kickMember(chatId, participantId);
		await client.sendText({
			chatId,
			text: `✅ Berhasil mengeluarkan member ${targetNumber} dari grup.`,
			reply_to: replyTo,
		});
	} catch (error) {
		console.error('Error kicking member:', error);
		await client.sendText({
			chatId,
			text: `❌ Gagal mengeluarkan member: ${error instanceof Error ? error.message : 'Unknown error'}`,
			reply_to: replyTo,
		});
	}

	return new Response(JSON.stringify({ status: 'kick command processed' }), { status: 200 });
};

export default handler;
