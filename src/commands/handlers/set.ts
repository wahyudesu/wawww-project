/**
 * /set Command Handler
 * Manage group settings:
 * - /set tagall admin - Only admins can use tagall
 * - /set tagall member - Everyone can use tagall
 * - /set welcome on - Enable welcome messages
 * - /set welcome off - Disable welcome messages
 * - /set sholat on - Enable sholat reminder
 * - /set sholat off - Disable sholat reminder
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { GroupAdminService } from '../../services';
import { getDb, getGroupByChatId, updateGroupSettings, upsertGroup } from '../../db/queries';

// Type for group info response from Waha API
interface GroupApiResponse {
	subject?: string;
	name?: string;
	owner?: string;
	ownerJid?: string;
	participants?: Array<{
		id?: string;
		jid?: string;
		admin?: string | null;
	}>;
}

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, participant, text, env } = context;
	const { baseUrl, session, apiKey } = client.getConfig();

	// Parse arguments
	const parsed = text?.split(' ') || [];
	const args = parsed.slice(1); // Skip '/set'

	if (args.length < 2) {
		await client.sendText({
			chatId,
			text: `⚙️ *Pengaturan Grup*

Usage:
• /set tagall admin - Hanya admin yang bisa pakai tagall
• /set tagall member - Semua orang bisa pakai tagall
• /set welcome on - Aktifkan pesan welcome
• /set welcome off - Matikan pesan welcome
• /set sholat on - Aktifkan reminder sholat
• /set sholat off - Matikan reminder sholat`,
		});
		return new Response(JSON.stringify({ status: 'help shown' }), { status: 200 });
	}

	const [setting, value] = args;

	// Check if user is admin
	const adminService = new GroupAdminService(baseUrl, session, apiKey);
	const isAdmin = await adminService.isAdmin(chatId, participant || '');

	if (!isAdmin) {
		await client.sendText({
			chatId,
			text: '❌ Maaf, hanya admin yang bisa mengubah pengaturan grup.',
		});
		return new Response(JSON.stringify({ status: 'not admin' }), { status: 200 });
	}

	// Get database
	const db = getDb(env?.DB as any);

	// Check if group exists in database, if not, create it first
	let group = await getGroupByChatId(db, chatId);

	// If group doesn't exist in database, we need to create it
	// This can happen if the bot was added before the database feature
	if (!group) {
		// Fetch group info from WhatsApp
		try {
			const response = await fetch(`${baseUrl}/api/${session}/groups/${chatId}`, {
				method: 'GET',
				headers: {
					accept: '*/*',
					'X-Api-Key': apiKey,
				},
			});

			if (response.ok) {
				const groupInfo = (await response.json()) as GroupApiResponse;
				const participants = groupInfo.participants || [];

				const admins: string[] = [];
				const members: string[] = [];

				for (const p of participants) {
					const phone = (p.jid || p.id)
						?.replace('@s.whatsapp.net', '')
						.replace('@c.us', '')
						.replace('@lid', '')
						.trim();

					if (!phone) continue;

					if (p.admin === 'admin' || p.admin === 'superadmin') {
						admins.push(phone);
					}
					members.push(phone);
				}

				// Create group in database
				await upsertGroup(db, {
					id: chatId,
					name: groupInfo.subject || groupInfo.name || 'Unknown',
					ownerId: groupInfo.owner || groupInfo.ownerJid || admins[0] || '',
					admin: admins,
					member: members,
				});

				group = await getGroupByChatId(db, chatId);
			}
		} catch (error) {
			console.error('Error creating group in database:', error);
		}
	}

	if (!group) {
		await client.sendText({
			chatId,
			text: '❌ Gagal mengakses database grup. Silakan coba lagi.',
		});
		return new Response(JSON.stringify({ status: 'group not found' }), { status: 200 });
	}

	// Handle different settings
	switch (setting.toLowerCase()) {
		case 'tagall': {
			if (value.toLowerCase() === 'admin') {
				await updateGroupSettings(db, chatId, { tagall: 'admin' });
				await client.sendText({
					chatId,
					text: '✅ Pengaturan tagall diubah: *Hanya admin* yang bisa menggunakan tagall.',
				});
			} else if (value.toLowerCase() === 'member' || value.toLowerCase() === 'all') {
				await updateGroupSettings(db, chatId, { tagall: 'member' });
				await client.sendText({
					chatId,
					text: '✅ Pengaturan tagall diubah: *Semua anggota* bisa menggunakan tagall.',
				});
			} else {
				await client.sendText({
					chatId,
					text: '❌ Nilai tidak valid. Gunakan: /set tagall admin atau /set tagall member',
				});
			}
			break;
		}
		case 'welcome': {
			if (value.toLowerCase() === 'on') {
				await updateGroupSettings(db, chatId, { welcome: true });
				await client.sendText({
					chatId,
					text: '✅ Pesan *welcome diaktifkan*.',
				});
			} else if (value.toLowerCase() === 'off') {
				await updateGroupSettings(db, chatId, { welcome: false });
				await client.sendText({
					chatId,
					text: '✅ Pesan *welcome dimatikan*.',
				});
			} else {
				await client.sendText({
					chatId,
					text: '❌ Nilai tidak valid. Gunakan: /set welcome on atau /set welcome off',
				});
			}
			break;
		}
		case 'sholat': {
			if (value.toLowerCase() === 'on') {
				await updateGroupSettings(db, chatId, { sholatreminder: true });
				await client.sendText({
					chatId,
					text: '✅ Reminder *sholat diaktifkan*.',
				});
			} else if (value.toLowerCase() === 'off') {
				await updateGroupSettings(db, chatId, { sholatreminder: false });
				await client.sendText({
					chatId,
					text: '✅ Reminder *sholat dimatikan*.',
				});
			} else {
				await client.sendText({
					chatId,
					text: '❌ Nilai tidak valid. Gunakan: /set sholat on atau /set sholat off',
				});
			}
			break;
		}
		default: {
			await client.sendText({
				chatId,
				text: `⚙️ *Pengaturan Grup*

Pengaturan yang tersedia:
• /set tagall admin - Hanya admin yang bisa pakai tagall
• /set tagall member - Semua orang bisa pakai tagall
• /set welcome on - Aktifkan pesan welcome
• /set welcome off - Matikan pesan welcome
• /set sholat on - Aktifkan reminder sholat
• /set sholat off - Matikan reminder sholat`,
			});
		}
	}

	return new Response(JSON.stringify({ status: 'settings updated' }), { status: 200 });
};

export default handler;
