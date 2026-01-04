/**
 * /ai Command Handler
 * AI assistant using OpenRouter
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo, text, env } = context;

	if (!text) {
		return new Response(JSON.stringify({ error: 'Text required' }), { status: 400 });
	}

	const openrouterKey = await env.openrouter_key.get();
	const openrouter = createOpenRouter({ apiKey: openrouterKey });

	const result = await generateObject({
		model: openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free'),
		schema: z.object({ tugas: z.string() }),
		system:
			'Kamu adalah asisten handal untuk mahasiswa.' +
			'Jawab pertanyaan user dengan informasi yang relevan dari daftar tugas yang ada di database.' +
			'Jika tidak ada informasi yang relevan, berikan jawaban umum yang sesuai.' +
			'Jawab sesingkat mungkin, tidak lebih dari 50 kata',
		prompt: `Jawab pertanyaan user atau bantu sesuai konteks.\nPertanyaan user: ${text.replace('/ai', '').trim()}`,
	});

	// Post-process: ganti ** jadi *, hapus semua baris yang hanya berisi pagar
	let tugas = result.object.tugas
		.replace(/\*\*/g, '*') // ganti ** jadi *
		.replace(/^#+\s*/gm, ''); // hapus simbol # di awal baris

	await client.sendText({ chatId, text: tugas, reply_to: replyTo });

	return new Response(JSON.stringify({ status: 'sent', sent: tugas }), { status: 200 });
};

export default handler;
