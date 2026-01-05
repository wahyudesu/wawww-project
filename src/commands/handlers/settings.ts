/**
 * /settings Command Handler
 * Display current group settings from database
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { getDb, getGroupByChatId } from '../../db/queries';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, env } = context;

	try {
		// Get database
		const db = getDb(env?.DB as any);

		// Get group from database
		const group = await getGroupByChatId(db, chatId);

		if (!group) {
			await client.sendText({
				chatId,
				text: '❌ Grup ini belum terdaftar di database.\n\nBot akan otomatis mendaftarkan grup saat ada anggota baru bergabung.',
			});
			return new Response(JSON.stringify({ status: 'group not found' }), { status: 200 });
		}

		// Get settings with defaults
		const settings = group.settings || {
			welcome: true,
			tagall: 'admin',
			welcomeMessage: 'Selamat datang di grup {name}!, semoga betah',
			sholatreminder: false,
		};

		// Format settings message
		const emoji = (active: boolean) => (active ? '✅' : '❌');
		const status = (active: boolean) => (active ? '*Aktif*' : '*Nonaktif*');

		const settingsText = `⚙️ *Pengaturan Grup: ${group.name}*

📢 *Welcome Message*
${emoji(settings.welcome)} Status: ${status(settings.welcome)}
${settings.welcome ? `📝 Pesan: "${settings.welcomeMessage || 'Default'}"` : ''}

🏷️ *Tagall Permission*
👥 Siapa yang bisa tagall: *${settings.tagall === 'admin' ? 'Admin Only' : settings.tagall === 'owner' ? 'Owner Only' : 'Semua Anggota'}*

🕌 *Sholat Reminder*
${emoji(settings.sholatreminder)} Status: ${status(settings.sholatreminder)}

━━━━━━━━━━━━━━━
💡 Ketik /set untuk mengubah pengaturan`;

		await client.sendText({
			chatId,
			text: settingsText,
		});

		return new Response(JSON.stringify({ status: 'settings displayed' }), { status: 200 });
	} catch (error) {
		console.error('Error displaying settings:', error);
		await client.sendText({
			chatId,
			text: '❌ Gagal mengambil pengaturan grup. Coba lagi nanti.',
		});
		return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
	}
};

export default handler;
