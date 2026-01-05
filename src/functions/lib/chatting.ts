/**
 * REST API Functions untuk WhatsApp Chatting
 * Menggunakan Waha API (WhatsApp HTTP API)
 *
 * @module chatting
 */

import type { WahaConfigManager } from '../../config/waha';
import { formatPersonalChatId, formatGroupChatId, getWahaHeaders } from '../../config/waha';

// ==================== TYPES ====================

export interface SendMessageOptions {
	chatId: string;
	text: string;
	reply_to?: string | null;
	mentions?: string[];
}

export interface SendMediaOptions {
	chatId: string;
	url: string;
	caption?: string;
	reply_to?: string | null;
}

export interface SendFileOptions extends SendMediaOptions {
	filename?: string;
}

export interface CreateGroupOptions {
	groupName: string;
	participants: string[]; // Array of phone numbers (e.g., ["6281234567890"])
}

// List Message Types
export interface ListRow {
	title: string;
	rowId: string;
	description?: string;
}

export interface ListSection {
	title: string;
	rows: ListRow[];
}

export interface SendListOptions {
	chatId: string;
	title: string;
	description?: string;
	footer?: string;
	button: string;
	sections: ListSection[];
	reply_to?: string | null;
}

// ==================== CHAT CLIENT CLASS ====================

/**
 * WahaChatClient - Client utama untuk interaksi dengan Waha API
 *
 * @example
 * ```typescript
 * const config = await createWahaConfig(env);
 * const client = new WahaChatClient(config);
 *
 * // Kirim pesan
 * await client.sendToPerson("6281234567890", "Hello!");
 * await client.sendToGroup("120363399604541928@g.us", "Halo grup!");
 * ```
 */
export class WahaChatClient {
	private config: WahaConfigManager;

	constructor(config: WahaConfigManager) {
		this.config = config;
	}

	/**
	 * Get base URL
	 */
	private getBaseUrl(): string {
		return this.config.getBaseUrl();
	}

	/**
	 * Get API key
	 */
	private getApiKey(): string {
		return this.config.getApiKey();
	}

	/**
	 * Get session name
	 */
	private getSession(): string {
		return this.config.getSession();
	}

	/**
	 * Get config object (public method for service classes)
	 */
	public getConfig(): { baseUrl: string; session: string; apiKey: string } {
		return {
			baseUrl: this.getBaseUrl(),
			session: this.getSession(),
			apiKey: this.getApiKey(),
		};
	}

	/**
	 * Get standard headers for API requests
	 */
	private getHeaders(): HeadersInit {
		return getWahaHeaders(this.getApiKey());
	}

	// ==================== TEXT MESSAGES ====================

	/**
	 * Kirim pesan text ke chat (personal atau grup)
	 */
	async sendText(options: SendMessageOptions): Promise<Response> {
		const apiUrl = `${this.getBaseUrl()}/api/sendText`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId: options.chatId,
				text: options.text,
				session: this.getSession(),
				reply_to: options.reply_to || null,
				mentions: options.mentions || [],
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send text: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return response;
	}

	/**
	 * Kirim pesan ke personal chat
	 * @param phoneNumber Nomor telepon (e.g., "6281234567890")
	 * @param message Pesan yang akan dikirim
	 */
	async sendToPerson(phoneNumber: string, message: string): Promise<any> {
		const chatId = formatPersonalChatId(phoneNumber);
		const response = await this.sendText({ chatId, text: message });
		return await response.json();
	}

	/**
	 * Kirim pesan ke grup
	 * @param groupId Group ID (e.g., "120363399604541928@g.us" or "120363399604541928")
	 * @param message Pesan yang akan dikirim
	 * @param options Opsi tambahan (reply_to, mentions)
	 */
	async sendToGroup(
		groupId: string,
		message: string,
		options?: { reply_to?: string; mentions?: string[] },
	): Promise<any> {
		const chatId = formatGroupChatId(groupId);
		const response = await this.sendText({
			chatId,
			text: message,
			reply_to: options?.reply_to,
			mentions: options?.mentions,
		});
		return await response.json();
	}

	/**
	 * Reply pesan dengan mention
	 */
	async replyWithMention(
		chatId: string,
		message: string,
		replyToMessageId: string,
		mentionIds: string[],
	): Promise<any> {
		const response = await this.sendText({
			chatId,
			text: message,
			reply_to: replyToMessageId,
			mentions: mentionIds,
		});
		return await response.json();
	}

	// ==================== IMAGE MESSAGES ====================

	/**
	 * Kirim gambar ke chat
	 */
	async sendImage(options: SendMediaOptions): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/sendImage`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId: options.chatId,
				file: {
					url: options.url,
					mimetype: 'image/jpeg',
				},
				caption: options.caption || '',
				session: this.getSession(),
				reply_to: options.reply_to || null,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send image: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	/**
	 * Kirim gambar dari URL ke personal chat
	 */
	async sendImageToPerson(phoneNumber: string, imageUrl: string, caption: string): Promise<any> {
		const chatId = formatPersonalChatId(phoneNumber);
		return await this.sendImage({ chatId, url: imageUrl, caption });
	}

	/**
	 * Kirim gambar dari URL ke grup
	 */
	async sendImageToGroup(
		groupId: string,
		imageUrl: string,
		caption: string,
		options?: { reply_to?: string },
	): Promise<any> {
		const chatId = formatGroupChatId(groupId);
		return await this.sendImage({
			chatId,
			url: imageUrl,
			caption,
			reply_to: options?.reply_to,
		});
	}

	// ==================== FILE/DOCUMENT MESSAGES ====================

	/**
	 * Kirim file/document ke chat
	 */
	async sendFile(options: SendFileOptions): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/sendFile`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId: options.chatId,
				file: {
					url: options.url,
					mimetype: 'application/octet-stream',
					filename: options.filename || 'document',
				},
				caption: options.caption || '',
				session: this.getSession(),
				reply_to: options.reply_to || null,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send file: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	/**
	 * Kirim file/document dari URL ke chat
	 */
	async sendFileToChat(chatId: string, fileUrl: string, filename: string, caption: string): Promise<any> {
		return await this.sendFile({ chatId, url: fileUrl, filename, caption });
	}

	// ==================== AUDIO MESSAGES ====================

	/**
	 * Kirim audio ke chat
	 */
	async sendAudio(chatId: string, audioUrl: string): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/sendAudio`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId,
				url: audioUrl,
				session: this.getSession(),
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send audio: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	// ==================== VIDEO MESSAGES ====================

	/**
	 * Kirim video ke chat
	 */
	async sendVideo(options: SendMediaOptions): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/sendVideo`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId: options.chatId,
				file: {
					url: options.url,
					mimetype: 'video/mp4',
				},
				caption: options.caption || '',
				session: this.getSession(),
				reply_to: options.reply_to || null,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send video: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	/**
	 * Kirim video dari URL ke chat
	 */
	async sendVideoToChat(chatId: string, videoUrl: string, caption: string): Promise<any> {
		return await this.sendVideo({ chatId, url: videoUrl, caption });
	}

	// ==================== LIST MESSAGES ====================

	/**
	 * Kirim pesan dengan list (sections & rows)
	 */
	async sendList(options: SendListOptions): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/sendList`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId: options.chatId,
				message: {
					title: options.title,
					description: options.description || '',
					footer: options.footer || '',
					button: options.button,
					sections: options.sections,
				},
				reply_to: options.reply_to || null,
				session: this.getSession(),
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send list: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	/**
	 * Kirim pesan dengan list ke chat
	 */
	async sendListToChat(
		chatId: string,
		title: string,
		button: string,
		sections: ListSection[],
		description?: string,
		footer?: string,
	): Promise<any> {
		return await this.sendList({ chatId, title, button, sections, description, footer });
	}
}

// ==================== EXPORT FACTORIES ====================

/**
 * Create WahaChatClient from Cloudflare Worker env
 * @param env Cloudflare Worker environment
 * @returns WahaChatClient instance
 */
export async function createChatClient(env: any): Promise<WahaChatClient> {
	const { createWahaConfig } = await import('../../config/waha');
	const config = await createWahaConfig(env);
	return new WahaChatClient(config);
}