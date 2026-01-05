/**
 * /help Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	const helpText = `🤖 *Daftar Perintah Bot*

📋 *Umum*
/tagall - Mention semua anggota grup
/ai <pertanyaan> - Tanya AI
/pantun - Dapatkan pantun acak
/doaharian - Dapatkan doa harian
/bitcoin - Cek harga Bitcoin
/anime <judul> - Cari info anime
/math - Kuis matematika (medium)
/math easy - Kuis matematika (mudah)
/math hard - Kuis matematika (sulit)
/link <url> - Download media (YT, TikTok, IG, FB)
/dev - Info developer
/help - Tampilkan bantuan ini

👑 *Admin*
/kick <nomor> - Kick member
/add <nomor> - Tambah member
/closegroup - Tutup grup
/opengroup - Buka grup
/set - Atur pengaturan grup`;

	await client.sendText({ chatId, text: helpText, reply_to: replyTo || undefined });

	return new Response(JSON.stringify({ status: 'help sent' }), { status: 200 });
};

export default handler;
