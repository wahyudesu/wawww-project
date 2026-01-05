/**
 * Cryptocurrency Handlers - Bitcoin price checker
 * Uses WahaChatClient for consistent messaging
 */

import { WahaChatClient } from './lib/chatting';

// ==================== TYPES ====================

interface CoinGeckoPriceResponse {
	bitcoin?: {
		usd?: number;
		idr?: number;
	};
}

interface BitcoinPriceData {
	usd: number;
	idr: number;
}

// ==================== CRYPTO FUNCTIONS ====================

/**
 * Fetch Bitcoin price from CoinGecko API
 */
export async function fetchBitcoinPrice(): Promise<BitcoinPriceData | null> {
	try {
		// Fetch both USD and IDR in one request
		const response = await fetch(
			'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,idr',
		);

		if (!response.ok) {
			console.error('CoinGecko API error:', response.statusText);
			return null;
		}

		const data: CoinGeckoPriceResponse = await response.json();
		const priceUsd = data?.bitcoin?.usd;
		const priceIdr = data?.bitcoin?.idr;

		if (typeof priceUsd !== 'number' || typeof priceIdr !== 'number') {
			console.error('Invalid price data:', data);
			return null;
		}

		return { usd: priceUsd, idr: priceIdr };
	} catch (error) {
		console.error('Error fetching Bitcoin price:', error);
		return null;
	}
}

/**
 * Format Bitcoin price message
 */
export function formatBitcoinPriceMessage(price: BitcoinPriceData): string {
	const formattedIdr = price.idr.toLocaleString('id-ID');
	const formattedUsd = price.usd.toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	return `💰 *Harga Bitcoin saat ini:*

🇮🇩 IDR: Rp${formattedIdr}
🇺🇸 USD: $${formattedUsd}

📊 Data provided by CoinGecko`;
}

/**
 * Handle /bitcoin command
 * @param client WahaChatClient instance
 * @param chatId Target chat ID
 * @param replyToMessageId Message ID to reply to
 */
export async function handleBitcoinCommand(
	client: WahaChatClient,
	chatId: string,
	replyToMessageId: string,
): Promise<void> {
	const priceData = await fetchBitcoinPrice();

	if (!priceData) {
		await client.sendText({
			chatId,
			text: '❌ Maaf, gagal mengambil harga Bitcoin. Coba lagi nanti ya.',
			reply_to: replyToMessageId,
		});
		return;
	}

	const message = formatBitcoinPriceMessage(priceData);
	await client.sendText({
		chatId,
		text: message,
		reply_to: replyToMessageId,
	});
}

// ==================== LEGACY WRAPPER ====================
/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use handleBitcoinCommand with WahaChatClient instead
 */
export async function handleBitcoinCommandLegacy(
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	replyTo: string,
) {
	const { createManualWahaConfig } = await import('../config/waha');
	const config = createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);

	return await handleBitcoinCommand(client, chatId, replyTo);
}
