/**
 * /debugadmin Command Handler
 * Debug admin status in group
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo, participant } = context;

	if (!participant) {
		return new Response(JSON.stringify({ error: 'Participant required' }), { status: 400 });
	}

	const { baseUrl, session, apiKey } = client['config'].getConfig();

	// Get raw participants data to debug
	const response = await fetch(`${baseUrl}/api/${session}/groups/${chatId}/participants`, {
		method: 'GET',
		headers: {
			accept: '*/*',
			'X-Api-Key': apiKey,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch participants: ${response.statusText}`);
	}

	const participantsJson: any[] = await response.json();

	// Find current user in participants
	const currentUser = participantsJson.find((p: any) => {
		const phoneId = p.jid || p.id;
		const formattedId = phoneId?.replace('@s.whatsapp.net', '@c.us') || '';
		const normalizedUserId = participant.replace('@s.whatsapp.net', '@c.us');
		return formattedId === normalizedUserId || p.id === normalizedUserId || phoneId === normalizedUserId;
	});

	// Create detailed debug info
	let debugInfo = `🔍 *Debug Admin Status*\n\n`;
	debugInfo += `📱 *Your ID:* ${participant}\n`;
	debugInfo += `🏠 *Group ID:* ${chatId}\n\n`;

	if (currentUser) {
		debugInfo += `🔍 *Your User Data:*\n`;
		debugInfo += `\`\`\`\n${JSON.stringify(currentUser, null, 2)}\n\`\`\`\n\n`;

		debugInfo += `📋 *All Possible Admin Fields:*\n`;
		Object.keys(currentUser).forEach((key) => {
			const value = currentUser[key];
			const isLikelyAdmin =
				key.toLowerCase().includes('admin') ||
				key.toLowerCase().includes('role') ||
				key.toLowerCase().includes('rank') ||
				key.toLowerCase().includes('level') ||
				(typeof value === 'string' && value.toLowerCase().includes('admin'));

			debugInfo += `${isLikelyAdmin ? '👑' : '📝'} ${key}: ${JSON.stringify(value)}\n`;
		});
	} else {
		debugInfo += `❌ *User not found in participants list!*\n\n`;
		debugInfo += `👥 *All Participants:* (${participantsJson.length})\n`;
		(participantsJson as any[]).slice(0, 5).forEach((p: any, i: number) => {
			const phoneId = p.jid || p.id;
			const formattedId = phoneId?.replace('@s.whatsapp.net', '@c.us') || '';
			debugInfo += `${i + 1}. ${formattedId} - Role: ${p.role || p.rank || 'N/A'}\n`;
		});
		if ((participantsJson as any[]).length > 5) {
			debugInfo += `... and ${(participantsJson as any[]).length - 5} more\n`;
		}
	}

	await client.sendText({ chatId, text: debugInfo, reply_to: replyTo });

	return new Response(JSON.stringify({ status: 'debug info sent', currentUser }), { status: 200 });
};

export default handler;
