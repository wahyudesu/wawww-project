#!/usr/bin/env bun
/**
 * Fetch All Groups Script
 *
 * Script untuk mengambil semua groups dari Waha API dan menyimpannya ke D1 database.
 *
 * Usage:
 * ```bash
 * # Run directly with bun
 * bun scripts/fetch-all-groups.ts
 *
 * # Or with custom environment
 * BASE_URL="https://..." SESSION="default" API_KEY="..." bun scripts/fetch-all-groups.ts
 * ```
 */

import * as schema from '../src/db/schema';
import { getWahaHeaders } from '../src/config/waha';

// ==================== TYPES ====================

/**
 * Response dari GET /api/{session}/groups
 * Format: Object dengan group ID sebagai key
 */
export interface GroupParticipant {
	id: string;
	phoneNumber?: string;
	admin: 'superadmin' | 'admin' | null;
}

export interface GroupInfo {
	id: string;
	subject: string;
	owner?: string;
	ownerPn?: string;
	participants: GroupParticipant[];
}

// ==================== D1 DATABASE CLIENT ====================

/**
 * D1 Database Client using Cloudflare API
 */
export class D1Client {
	private readonly token: string;
	private readonly apiUrl: string;

	constructor(accountId: string, databaseId: string, token: string) {
		this.token = token;
		this.apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
	}

	/**
	 * Execute SQL query on D1 database
	 */
	async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ sql, params }),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`D1 query failed: ${response.status} ${error}`);
		}

		const data = await response.json();
		if (data.success === false) {
			throw new Error(`D1 query error: ${data.errors?.[0]?.message || 'Unknown error'}`);
		}

		return data.result?.[0]?.results || [];
	}

	/**
	 * Get group by ID
	 */
	async getGroup(groupId: string): Promise<any | null> {
		const result = await this.query<any>(
			`SELECT * FROM group_whatsapp WHERE id = ? LIMIT 1`,
			[groupId]
		);
		return result[0] || null;
	}

	/**
	 * Insert new group
	 */
	async insertGroup(data: {
		id: string;
		name: string;
		ownerPhone: string;
		admin: string;
	}): Promise<void> {
		const sql = `
			INSERT INTO group_whatsapp (id, name, ownerPhone, admin, member, note, createdAt, settings)
			VALUES (?, ?, ?, ?, NULL, NULL, datetime('now'), ?)
		`;
		const defaultSettings = JSON.stringify({
			welcome: true,
			tagall: 'admin',
			welcomeMessage: 'Selamat datang di grup {name}!, semoga betah',
			sholatreminder: false,
		});
		await this.query(sql, [data.id, data.name, data.ownerPhone, data.admin, defaultSettings]);
	}

	/**
	 * Update existing group
	 */
	async updateGroup(groupId: string, data: {
		name: string;
		ownerPhone: string;
		admin: string;
	}): Promise<void> {
		const sql = `
			UPDATE group_whatsapp
			SET name = ?, ownerPhone = ?, admin = ?
			WHERE id = ?
		`;
		await this.query(sql, [data.name, data.ownerPhone, data.admin, groupId]);
	}

	/**
	 * Upsert group (insert or update)
	 */
	async upsertGroup(data: {
		id: string;
		name: string;
		ownerPhone: string;
		admin: string;
	}): Promise<void> {
		const existing = await this.getGroup(data.id);
		if (existing) {
			await this.updateGroup(data.id, data);
		} else {
			await this.insertGroup(data);
		}
	}
}

// ==================== LOAD ENV VARS ====================

/**
 * Load environment variables from .dev.vars file
 */
async function loadDevVars(): Promise<void> {
	const devVarsPath = './.dev.vars';
	try {
		const file = Bun.file(devVarsPath);
		if (!await file.exists()) return;

		const text = await file.text();
		if (!text) return;

		for (const line of text.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;

			const [key, ...valueParts] = trimmed.split('=');
			if (valueParts.length === 0) continue;

			const value = valueParts.join('=').trim();
			if (key && !process.env[key]) {
				process.env[key] = value;
			}
		}
	} catch (error) {
		console.warn(`Warning: Could not load ${devVarsPath}: ${error}`);
	}
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Clean phone number - remove domain suffixes
 */
function cleanPhone(phone: string): string {
	return phone
		.replace(/@s\.whatsapp\.net$/, '')
		.replace(/@c\.us$/, '')
		.replace(/@lid$/, '');
}

// ==================== MAIN FUNCTION ====================

export interface FetchGroupsResult {
	success: boolean;
	totalGroups: number;
	savedGroups: number;
	failedGroups: number;
	errors: string[];
}

/**
 * Fetch semua groups dari Waha API dan simpan ke D1 database
 */
export async function fetchAllGroupsAndSave(
	baseUrl: string,
	session: string,
	apiKey: string,
	d1Client: D1Client,
): Promise<FetchGroupsResult> {
	const result: FetchGroupsResult = {
		success: true,
		totalGroups: 0,
		savedGroups: 0,
		failedGroups: 0,
		errors: [],
	};

	try {
		if (!baseUrl || !session || !apiKey) {
			throw new Error('Missing required parameters (baseUrl, session, apiKey)');
		}

		// Build API URL
		const apiUrl = new URL(`${baseUrl}/api/${session}/groups`);
		console.log(`Fetching groups from: ${apiUrl.toString()}`);

		// Fetch groups dari Waha API
		const response = await fetch(apiUrl.toString(), {
			method: 'GET',
			headers: getWahaHeaders(apiKey),
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
		}

		// Response format: { "groupId1": {...}, "groupId2": {...} }
		const groupsData: Record<string, GroupInfo> = await response.json();
		const groupIds = Object.keys(groupsData);
		result.totalGroups = groupIds.length;

		console.log(`Found ${groupIds.length} groups`);

		// Proses setiap group
		for (const groupId of groupIds) {
			try {
				const group = groupsData[groupId];

				// Extract: owner = superadmin, admins = semua participant dengan role admin
				let ownerPhone = '';
				const admins: string[] = [];

				for (const p of group.participants) {
					const phone = p.phoneNumber ? cleanPhone(p.phoneNumber) : cleanPhone(p.id);

					if (p.admin === 'superadmin') {
						ownerPhone = phone;
					} else if (p.admin === 'admin') {
						admins.push(phone);
					}
					// participant tanpa role = member (di skip dulu)
				}

				// Serialize admins array
				const adminJson = schema.serializeArray(admins);

				// Upsert ke D1
				await d1Client.upsertGroup({
					id: group.id,
					name: group.subject,
					ownerPhone: ownerPhone || 'unknown',
					admin: adminJson,
				});

				result.savedGroups++;
				console.log(`[${result.savedGroups}/${groupIds.length}] Saved: ${group.subject} (${group.id})`);
				console.log(`   Owner: ${ownerPhone}`);
				console.log(`   Admins: ${admins.length}`);
			} catch (error) {
				result.failedGroups++;
				const errorMsg = `Group ${groupId}: ${error instanceof Error ? error.message : String(error)}`;
				result.errors.push(errorMsg);
				console.error(errorMsg);
			}
		}

		if (result.failedGroups > 0) {
			result.success = false;
		}
	} catch (error) {
		result.success = false;
		const errorMsg = error instanceof Error ? error.message : String(error);
		result.errors.push(errorMsg);
		console.error('Fatal error:', errorMsg);
	}

	return result;
}

/**
 * Format result ke readable string
 */
export function formatFetchGroupsResult(result: FetchGroupsResult): string {
	const lines: string[] = [];
	lines.push('=== Fetch All Groups Result ===');
	lines.push(`Status: ${result.success ? '✅ Success' : '⚠️ Partial Success / Failed'}`);
	lines.push(`Total Groups: ${result.totalGroups}`);
	lines.push(`Saved Groups: ${result.savedGroups}`);
	lines.push(`Failed Groups: ${result.failedGroups}`);

	if (result.errors.length > 0) {
		lines.push('');
		lines.push('Errors:');
		result.errors.forEach((err, i) => {
			lines.push(`  ${i + 1}. ${err}`);
		});
	}

	return lines.join('\n');
}

// ==================== MAIN EXECUTION ====================

async function main() {
	await loadDevVars();

	const baseUrl =
		process.env.BASE_URL_NAME ||
		process.env.BASE_URL ||
		process.env.baseUrl ||
		process.env.base_url_name ||
		process.env.base_url;

	const session =
		process.env.SESSION_NAME ||
		process.env.SESSION ||
		process.env.session ||
		process.env.session_name ||
		process.env.sessionName ||
		'default';

	const apiKey = process.env.API_KEY || process.env.apiKey || process.env.api_key;

	const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.cloudflare_account_id;
	const databaseId = process.env.CLOUDFLARE_DATABASE_ID || process.env.cloudflare_database_id;
	const d1Token = process.env.CLOUDFLARE_D1_TOKEN || process.env.cloudflare_d1_token;

	if (!baseUrl) {
		console.error('❌ Error: BASE_URL_NAME or BASE_URL environment variable is required');
		process.exit(1);
	}

	if (!apiKey) {
		console.error('❌ Error: API_KEY environment variable is required');
		process.exit(1);
	}

	if (!accountId || !databaseId || !d1Token) {
		console.error('❌ Error: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_D1_TOKEN are required');
		process.exit(1);
	}

	console.log(`Using D1 database: ${databaseId}`);
	const d1Client = new D1Client(accountId, databaseId, d1Token);

	try {
		console.log('\n🚀 Starting fetch all groups to D1...\n');
		const result = await fetchAllGroupsAndSave(baseUrl, session, apiKey, d1Client);

		console.log('\n' + formatFetchGroupsResult(result) + '\n');
		process.exit(result.success ? 0 : 1);
	} catch (error) {
		console.error('\n❌ Fatal error:', error);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}
