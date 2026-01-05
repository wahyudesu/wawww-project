/**
 * /link Command Handler
 * Downloads media from social media platforms (YouTube, TikTok, Instagram, Facebook)
 * Rate limited: 5 requests per hour per chat
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { MediaDownloadService } from '../../services';
import { SimpleRateLimiter } from '../../utils/rateLimiter';

// Singleton rate limiter instance
const rateLimiter = new SimpleRateLimiter();

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, replyTo, text } = context;

	// 1. Extract and validate URL
	const url = text?.replace('/link', '').trim();

	if (!url) {
		await client.sendText({
			chatId,
			text: '⚠️ Format: /link <url>\n\nContoh:\n/link https://tiktok.com/@user/video/123\n/link https://youtube.com/watch?v=abc\n\nSupported: YouTube, TikTok, Instagram, Facebook, Twitter/X, Reddit, Bilibili',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'invalid format' }), { status: 200 });
	}

	// Basic URL validation
	if (!isValidUrl(url)) {
		await client.sendText({
			chatId,
			text: '❌ URL tidak valid. Pastikan URL dimulai dengan http:// atau https://',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'invalid url' }), { status: 200 });
	}

	// 2. Check rate limit
	const limitCheck = rateLimiter.checkLimit(chatId);

	if (!limitCheck.allowed) {
		await client.sendText({
			chatId,
			text: `⏱️ Rate limit tercapai! Coba lagi dalam ${limitCheck.resetIn || 60} detik.\n\nLimit: 5 request/jam per grup`,
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'rate limited' }), { status: 200 });
	}

	// 3. Download media
	const cobaltApiUrl = context.env?.COBALT_API_URL || 'https://cobalt.tools';
	const downloadService = new MediaDownloadService(cobaltApiUrl);

	try {
		// Send processing message
		await client.sendText({
			chatId,
			text: `⏳ Sedang mendownload dari ${downloadService.getPlatformName(url)}...`,
			reply_to: replyTo,
		});

		const result = await downloadService.downloadMedia(url);

		if (!result) {
			await client.sendText({
				chatId,
				text: '❌ Gagal mendownload media. Kemungkinan:\n- URL tidak didukung\n- Video/private post\n- Server sedang sibuk\n\nCoba lagi atau gunakan URL lain.',
				reply_to: replyTo,
			});
			return new Response(JSON.stringify({ status: 'download failed' }), { status: 200 });
		}

		// 4. Send media
		if (result.type === 'video') {
			await client.sendVideo({
				chatId,
				url: result.url,
				caption: result.caption || `📥 Downloaded from ${downloadService.getPlatformName(url)}`,
				reply_to: replyTo,
			});
		} else {
			await client.sendImage({
				chatId,
				url: result.url,
				caption: result.caption || `📥 Downloaded from ${downloadService.getPlatformName(url)}`,
				reply_to: replyTo,
			});
		}

		// 5. Increment rate limit
		rateLimiter.incrementUsage(chatId);

		console.log(`✅ Successfully downloaded and sent media from ${url}`);
		return new Response(JSON.stringify({ status: 'download sent' }), { status: 200 });
	} catch (error) {
		console.error('Error in /link command:', error);
		await client.sendText({
			chatId,
			text: `❌ Error: ${error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'}`,
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'error' }), { status: 200 });
	}
};

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return ['http:', 'https:'].includes(parsed.protocol);
	} catch {
		return false;
	}
}

export default handler;
