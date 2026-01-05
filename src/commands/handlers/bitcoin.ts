/**
 * /bitcoin Command Handler
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo } = context;

	try {
		// Fetch Bitcoin price directly
		const response = await fetch(
			'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,idr',
		);

		if (!response.ok) {
			await client.sendText({
				chatId,
				text: '❌ Gagal mengambil harga Bitcoin. Coba lagi nanti.',
				reply_to: replyTo || undefined,
			});
			return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
		}

		const data = await response.json() as { bitcoin?: { usd?: number; idr?: number } };
		const priceUsd = data?.bitcoin?.usd;
		const priceIdr = data?.bitcoin?.idr;

		if (typeof priceUsd !== 'number' || typeof priceIdr !== 'number') {
			await client.sendText({
				chatId,
				text: '❌ Data harga tidak valid. Coba lagi nanti.',
				reply_to: replyTo || undefined,
			});
			return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
		}

		const formattedIdr = priceIdr.toLocaleString('id-ID');
		const formattedUsd = priceUsd.toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

		const message = `💰 *Harga Bitcoin saat ini:*

🇮🇩 IDR: Rp${formattedIdr}
🇺🇸 USD: $${formattedUsd}

📊 Data provided by CoinGecko`;

		await client.sendText({
			chatId,
			text: message,
			reply_to: replyTo || undefined,
		});

		return new Response(JSON.stringify({ status: 'bitcoin sent' }), { status: 200 });
	} catch (error) {
		console.error('Bitcoin command error:', error);
		await client.sendText({
			chatId,
			text: '❌ Terjadi kesalahan. Coba lagi nanti.',
			reply_to: replyTo || undefined,
		});
		return new Response(JSON.stringify({ status: 'error' }), { status: 500 });
	}
};

export default handler;
