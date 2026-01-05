/**
 * Greeting Command Handlers
 * /pagi, /siang, /malam
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';

// Greeting messages
const greetings = {
	pagi: [
		'Selamat pagi! Semoga harimu penuh berkah dan produktif! ☀️',
		'Pagi! Jangan lupa sarapan dan minum air ya! 🌅',
		'Selamat pagi! Mulai hari dengan senyuman! 😊',
		'Pagi semuanya! Semoga hari ini lebih baik dari kemarin! 💪',
	],
	siang: [
		'Selamat siang! Jangan lupa istirahat sejenak ya! ☀️',
		'Siang! Sudah makan siang belum? 🍽️',
		'Selamat siang! Semangat menyelesaikan tugas-tugas hari ini! 🌟',
		'Siang semuanya! Jangan lupa sholat dhuhur ya! 🕌',
	],
	malam: [
		'Selamat malam! Semoga istirahatmu nyenyak! 🌙',
		'Malam! Jangan begadang terus ya, besok masih ada aktivitas! 😴',
		'Selamat malam! Terima kasih atas hari ini! ✨',
		'Malam semuanya! Sampai jumpa besok! 🌜',
	],
};

/**
 * Get random greeting message
 */
function getRandomGreeting(type: keyof typeof greetings): string {
	const messages = greetings[type];
	const idx = Math.floor(Math.random() * messages.length);
	return messages[idx];
}

/**
 * /pagi Command Handler
 */
export const pagiHandler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	const message = getRandomGreeting('pagi');
	await client.sendText({ chatId, text: message, reply_to: replyTo });

	return new Response(JSON.stringify({ status: 'pagi sent' }), { status: 200 });
};

/**
 * /siang Command Handler
 */
export const siangHandler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	const message = getRandomGreeting('siang');
	await client.sendText({ chatId, text: message, reply_to: replyTo });

	return new Response(JSON.stringify({ status: 'siang sent' }), { status: 200 });
};

/**
 * /malam Command Handler
 */
export const malamHandler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	const message = getRandomGreeting('malam');
	await client.sendText({ chatId, text: message, reply_to: replyTo });

	return new Response(JSON.stringify({ status: 'malam sent' }), { status: 200 });
};

// Default exports for individual handlers
export default pagiHandler;
