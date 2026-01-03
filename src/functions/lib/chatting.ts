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
	mentions?: string[];
}

export interface SendFileOptions extends SendMediaOptions {
	filename?: string;
}

export interface SendLocationOptions {
	chatId: string;
	latitude: number;
	longitude: number;
	name?: string;
	address?: string;
}

export interface SendContactOptions {
	chatId: string;
	contacts: ContactMessage[];
}

export interface ContactMessage {
	name: string;
	phone: string;
}

export interface CreateGroupOptions {
	groupName: string;
	participants: string[]; // Array of phone numbers (e.g., ["6281234567890"])
}

export interface SendButtonsOptions {
	chatId: string;
	header?: string;
	body: string;
	footer?: string;
	buttons: ButtonMessage[];
	reply_to?: string | null;
}

export interface ButtonMessage {
	type: 'reply' | 'call' | 'copy' | 'url';
	text: string;
	phoneNumber?: string;
	copyCode?: string;
	url?: string;
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
				url: options.url,
				caption: options.caption || '',
				session: this.getSession(),
				reply_to: options.reply_to || null,
				mentions: options.mentions || [],
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
		options?: { reply_to?: string; mentions?: string[] },
	): Promise<any> {
		const chatId = formatGroupChatId(groupId);
		return await this.sendImage({
			chatId,
			url: imageUrl,
			caption,
			reply_to: options?.reply_to,
			mentions: options?.mentions,
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
				url: options.url,
				filename: options.filename || 'document',
				caption: options.caption || '',
				session: this.getSession(),
				reply_to: options.reply_to || null,
				mentions: options.mentions || [],
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
				url: options.url,
				caption: options.caption || '',
				session: this.getSession(),
				reply_to: options.reply_to || null,
				mentions: options.mentions || [],
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

	// ==================== LOCATION MESSAGES ====================

	/**
	 * Kirim location ke chat
	 */
	async sendLocation(options: SendLocationOptions): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/sendLocation`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId: options.chatId,
				latitude: options.latitude,
				longitude: options.longitude,
				name: options.name || '',
				address: options.address || '',
				session: this.getSession(),
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send location: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	/**
	 * Kirim lokasi ke chat
	 */
	async sendLocationToChat(
		chatId: string,
		latitude: number,
		longitude: number,
		name?: string,
		address?: string,
	): Promise<any> {
		return await this.sendLocation({ chatId, latitude, longitude, name, address });
	}

	// ==================== CONTACT MESSAGES ====================

	/**
	 * Kirim contact ke chat
	 */
	async sendContact(options: SendContactOptions): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/sendContact`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId: options.chatId,
				contacts: options.contacts,
				session: this.getSession(),
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send contact: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	/**
	 * Kirim kontak ke chat
	 */
	async sendContactToChat(chatId: string, contacts: ContactMessage[]): Promise<any> {
		return await this.sendContact({ chatId, contacts });
	}

	// ==================== GROUP MANAGEMENT ====================

	/**
	 * Buat grup baru
	 */
	async createGroup(options: CreateGroupOptions): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/createGroup`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				groupName: options.groupName,
				participants: options.participants,
				session: this.getSession(),
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to create group: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	/**
	 * Buat grup baru dengan participants
	 */
	async createGroupWithParticipants(groupName: string, participants: string[]): Promise<any> {
		return await this.createGroup({ groupName, participants });
	}

	// ==================== BUTTONS ====================

	/**
	 * Kirim pesan dengan buttons
	 */
	async sendButtons(options: SendButtonsOptions): Promise<any> {
		const apiUrl = `${this.getBaseUrl()}/api/sendText`;

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify({
				chatId: options.chatId,
				header: options.header || '',
				body: options.body,
				footer: options.footer || '',
				buttons: options.buttons,
				reply_to: options.reply_to || null,
				session: this.getSession(),
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to send buttons: ${response.status} ${response.statusText} - ${errorText}`);
		}

		return await response.json();
	}

	/**
	 * Kirim pesan dengan buttons ke chat
	 */
	async sendButtonsToChat(
		chatId: string,
		body: string,
		buttons: ButtonMessage[],
		header?: string,
		footer?: string,
	): Promise<any> {
		return await this.sendButtons({ chatId, header, body, footer, buttons });
	}

	// ==================== BULK MESSAGES ====================

	/**
	 * Kirim pesan bulk ke multiple chats
	 */
	async sendBulkText(
		chatIds: string[],
		message: string,
	): Promise<{ success: string[]; failed: { chatId: string; error: string }[] }> {
		const results = {
			success: [] as string[],
			failed: [] as { chatId: string; error: string }[],
		};

		for (const chatId of chatIds) {
			try {
				await this.sendText({ chatId, text: message });
				results.success.push(chatId);
			} catch (error: any) {
				results.failed.push({ chatId, error: error.message });
			}
		}

		return results;
	}

	/**
	 * Broadcast pesan ke multiple personal chats
	 */
	async broadcastToPersons(
		phoneNumbers: string[],
		message: string,
	): Promise<{ success: string[]; failed: { phone: string; error: string }[] }> {
		const chatIds = phoneNumbers.map((phone) => formatPersonalChatId(phone));
		const results = await this.sendBulkText(chatIds, message);

		return {
			success: results.success.map((id) => id.replace('@c.us', '')),
			failed: results.failed.map((f) => ({
				phone: f.chatId.replace('@c.us', ''),
				error: f.error,
			})),
		};
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

