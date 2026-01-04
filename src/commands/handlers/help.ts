/**
 * /help Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	const helpText = [
		'🤖 *Daftar Perintah Bot*',
		'',
		'📋 *Umum*',
		'/tagall - Mention semua anggota grup',
		'/ai <pertanyaan> - Tanya AI tentang tugas/kuliah',
		'/pantun - Dapatkan pantun acak',
		'/doaharian - Dapatkan doa harian',
		'/bitcoin - Cek harga Bitcoin',
		'/math - Kuis matematika',
		'/dev - Info developer',
		'/help - Tampilkan bantuan ini',
		'',
		'👑 *Admin Only*',
		'/kick <nomor> - Kick member dari grup',
		'/add <nomor1,nomor2> - Tambahkan member ke grup',
		'/closegroup - Tutup grup (hanya admin yang bisa chat)',
		'/opengroup - Buka grup (semua bisa chat)',
		'/debugadmin - Cek status admin (debug)',
		'',
	].join('\n');

	await client.sendText({ chatId, text: helpText, reply_to: replyTo });

	return new Response(JSON.stringify({ status: 'help sent' }), { status: 200 });
};

export default handler;
