/**
 * Waha API Configuration
 * Centralized configuration for WhatsApp HTTP API
 */

import { getWorkerEnv } from './env';

// ==================== TYPES ====================

export interface WahaConfig {
	baseUrl: string;
	apiKey: string;
	session: string;
}

export interface WahaEnv {
	baseUrl: string;
	session: string;
	APIkey: string;
	openrouterKey: string;
}

// ==================== CONFIG CLASS ====================

/**
 * WahaConfigManager - Manages Waha API configuration
 */
export class WahaConfigManager {
	private config: WahaConfig;

	constructor(config: WahaConfig) {
		this.config = config;
	}

	/**
	 * Get base URL
	 */
	getBaseUrl(): string {
		return this.config.baseUrl;
	}

	/**
	 * Get API Key
	 */
	getApiKey(): string {
		return this.config.apiKey;
	}

	/**
	 * Get session name
	 */
	getSession(): string {
		return this.config.session;
	}

	/**
	 * Get full config object
	 */
	getConfig(): WahaConfig {
		return { ...this.config };
	}
}

// ==================== FACTORY FUNCTIONS ====================

/**
 * Create WahaConfig from Cloudflare Worker env
 * @param env Cloudflare Worker environment
 * @returns WahaConfig instance
 */
export async function createWahaConfig(env: any): Promise<WahaConfigManager> {
	const workerEnv: WahaEnv = await getWorkerEnv(env);
	return new WahaConfigManager({
		baseUrl: workerEnv.baseUrl,
		apiKey: workerEnv.APIkey,
		session: workerEnv.session,
	});
}

/**
 * Create WahaConfig manually (for testing or standalone usage)
 * @param baseUrl Waha API base URL
 * @param apiKey API key
 * @param session Session name
 * @returns WahaConfig instance
 */
export function createManualWahaConfig(baseUrl: string, apiKey: string, session: string): WahaConfigManager {
	return new WahaConfigManager({ baseUrl, apiKey, session });
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format phone number to WhatsApp chat ID (personal)
 * @param phoneNumber Phone number (e.g., "6281234567890")
 * @returns Chat ID (e.g., "6281234567890@c.us")
 */
export function formatPersonalChatId(phoneNumber: string): string {
	const cleaned = phoneNumber.replace(/[^\d]/g, ''); // Remove non-digits
	return `${cleaned}@c.us`;
}

/**
 * Format group ID to WhatsApp chat ID
 * @param groupId Group ID (e.g., "120363399604541928@g.us" or "120363399604541928")
 * @returns Chat ID (e.g., "120363399604541928@g.us")
 */
export function formatGroupChatId(groupId: string): string {
	return groupId.includes('@g.us') ? groupId : `${groupId}@g.us`;
}

/**
 * Check if chat ID is a group
 * @param chatId Chat ID to check
 * @returns true if group, false if personal
 */
export function isGroupChat(chatId: string): boolean {
	return chatId.includes('@g.us');
}

/**
 * Extract phone number from chat ID
 * @param chatId Chat ID (e.g., "6281234567890@c.us")
 * @returns Phone number (e.g., "6281234567890")
 */
export function extractPhoneNumber(chatId: string): string {
	return chatId.replace(/@c\.us$|@s\.whatsapp\.net$|@g\.us$/, '');
}

// ==================== HEADERS ====================

/**
 * Get standard Waha API headers
 * @param apiKey API key
 * @returns Headers object
 */
export function getWahaHeaders(apiKey: string): HeadersInit {
	return {
		accept: 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': apiKey,
	};
}
