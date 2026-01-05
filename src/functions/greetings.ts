/**
 * Message Handlers - Handle command responses
 * Menggunakan WahaChatClient untuk konsistensi
 */

import { WahaChatClient } from './lib/chatting';
import { createManualWahaConfig as _createManualWahaConfig } from '../config/waha';

// ==================== TYPES ====================

interface CommandMapping {
	[key: string]: string;
}

// ==================== PREDEFINED RESPONSES ====================

export const COMMAND_RESPONSES: CommandMapping = {
	'/pagi': 'selamat pagi bang, saya siap membantu anda',
	'/malam': 'selamat malam bang, ada yang bisa saya bantu?',
	'/siang': 'selamat siang bang, ada yang bisa dibantu?',
	'/sore': 'selamat sore bang, semoga hari anda menyenangkan!',
};

// ==================== BASIC COMMANDS ====================

/**
 * Basic command handler yang fleksibel
 * @param client WahaChatClient instance
 * @param chatId Target chat ID
 * @param replyToMessageId Message ID to reply to (optional)
 * @param command Command string
 * @param customResponse Custom response (overrides predefined)
 */
export async function basicCommands(
	client: WahaChatClient,
	chatId: string,
	replyToMessageId: string,
	command: string,
	customResponse?: string,
): Promise<any> {
	// Gunakan custom response jika ada, atau ambil dari predefined responses
	const responseText = customResponse || COMMAND_RESPONSES[command];

	if (!responseText) {
		throw new Error(`Command "${command}" not found and no custom response provided`);
	}

	return await client.sendText({
		chatId,
		text: responseText,
		reply_to: replyToMessageId,
	});
}

/**
 * Handler untuk command /dev
 */
export async function handleDevInfo(
	client: WahaChatClient,
	chatId: string,
	replyToMessageId: string,
): Promise<any> {
	const devInfo = `👨‍💻 *Developer Bot*

Nama: Wahyu Desu
GitHub: github.com/wahyudesu

*Ketentuan penggunaan:*
- Bot ini hanya untuk keperluan pembelajaran dan komunitas
- Jangan gunakan untuk spam atau tindakan melanggar hukum
- Fitur dapat berubah sewaktu-waktu

Terima kasih telah menggunakan bot ini!`;

	return await client.sendText({
		chatId,
		text: devInfo,
		reply_to: replyToMessageId,
	});
}

// ==================== LEGACY WRAPPERS ====================
// Untuk backward compatibility dengan kode lama

/**
 * Wrapper untuk basicCommands dengan signature lama
 * @deprecated Gunakan basicCommands dengan WahaChatClient
 */
export async function basicCommandsLegacy(
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	replyTo: string,
	command: string,
	customResponse?: string,
) {
	const config = _createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);

	return await basicCommands(client, chatId, replyTo, command, customResponse);
}

/**
 * Wrapper untuk handleDevInfo dengan signature lama
 * @deprecated Gunakan handleDevInfo dengan WahaChatClient
 */
export async function handleDevInfoLegacy(
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	replyTo: string,
) {
	const config = _createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);

	return await handleDevInfo(client, chatId, replyTo);
}

// Wrapper functions lama untuk backward compatibility (dan gakepake)
export async function handleSelamatPagi(
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	replyTo: string,
) {
	return await basicCommandsLegacy(baseUrl, session, apiKey, chatId, replyTo, '/pagi');
}

export async function handleSelamatMalam(
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	replyTo: string,
) {
	return await basicCommandsLegacy(baseUrl, session, apiKey, chatId, replyTo, '/malam');
}
