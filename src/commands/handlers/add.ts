/**
 * /add Command Handler (Admin Only)
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { GroupAdminService, GroupMemberService } from '../../services';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo, participant, text } = context;

	if (!participant) {
		return new Response(JSON.stringify({ error: 'Participant required' }), { status: 400 });
	}

	const targetNumbers = text
		?.replace('/add', '')
		.trim()
		.split(/[\s,]+/)
		.filter((n) => n) || [];

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

	// Validate target numbers
	if (!targetNumbers || targetNumbers.length === 0) {
		await client.sendText({
			chatId,
			text: '⚠️ Format: /add <nomor1,nomor2,...>\nContoh: /add 628123456789,628987654321',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'invalid format' }), { status: 200 });
	}

	// Format participant IDs
	const participantIds = targetNumbers.map((num) => (num.includes('@') ? num : `${num}@c.us`));

	try {
		const result = await memberService.addMember(chatId, participantIds);
		console.log('Add member result:', result);
		await client.sendText({
			chatId,
			text: `✅ Berhasil menambahkan ${targetNumbers.length} member ke grup.`,
			reply_to: replyTo,
		});
	} catch (error) {
		console.error('Error adding member:', error);
		await client.sendText({
			chatId,
			text: `❌ Gagal menambahkan member: ${error instanceof Error ? error.message : 'Unknown error'}`,
			reply_to: replyTo,
		});
	}

	return new Response(JSON.stringify({ status: 'add command processed' }), { status: 200 });
};

export default handler;
