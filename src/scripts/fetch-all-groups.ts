#!/usr/bin/env bun
/**
 * Fetch All Groups Script
 *
 * Script untuk mengambil semua groups dari Waha API dan menyimpannya ke database.
 *
 * Usage:
 * ```bash
 * # Run directly with bun
 * bun src/scripts/fetch-all-groups.ts
 *
 * # Or with custom environment
 * BASE_URL="https://..." SESSION="default" API_KEY="..." bun src/scripts/fetch-all-groups.ts
 * ```
 */

import { Database } from 'bun:sqlite';
import { drizzle, BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { getWahaHeaders } from '../config/waha';

// ==================== TYPES ====================

/**
 * Response dari GET /api/{session}/groups
 */
export interface GroupParticipant {
	id: string; // Member ID in @c.us or @lid format
	pn?: string; // Member ID in @c.us format
	role: 'left' | 'participant' | 'admin' | 'superadmin';
}

export interface GroupInfo {
	id: string; // Group ID
	subject: string; // Group name
	description?: string; // Group description
	invite?: string; // Invite URL
	membersCanAddNewMember: boolean;
	membersCanSendMessages: boolean;
	newMembersApprovalRequired: boolean;
	participants: GroupParticipant[];
}

/**
 * Result dari fetchAllGroupsAndSave
 */
export interface FetchGroupsResult {
	success: boolean;
	totalGroups: number;
	savedGroups: number;
	failedGroups: number;
	errors: string[];
}

// ==================== MAIN FUNCTION ====================

/**
 * Fetch semua groups dari Waha API dan simpan ke database
 *
 * @param baseUrl Waha base URL
 * @param session Session name
 * @param apiKey API key
 * @param db Drizzle database instance
 * @returns Result object dengan statistik
 */
export async function fetchAllGroupsAndSave(
	baseUrl: string,
	session: string,
	apiKey: string,
	db: BunSQLiteDatabase<typeof schema>,
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

		const groups: GroupInfo[] = await response.json();
		result.totalGroups = groups.length;

		console.log(`Found ${groups.length} groups`);

		// Upsert setiap group ke database
		for (const group of groups) {
			try {
				// Extract participant info
				const admins: string[] = [];
				const members: string[] = [];
				let ownerPhone = '';

				for (const participant of group.participants) {
					// Use pn if available, otherwise extract from id
					const phone = participant.pn || participant.id.replace(/@lid$|@c\.us$/, '');

					if (participant.role === 'superadmin') {
						ownerPhone = phone;
						admins.push(phone);
					} else if (participant.role === 'admin') {
						admins.push(phone);
					} else if (participant.role === 'participant') {
						members.push(phone);
					}
					// Skip participants with 'left' role
				}

				// Check if group exists
				const existing = await db
					.select()
					.from(schema.group_whatsapp)
					.where(eq(schema.group_whatsapp.id, group.id))
					.limit(1);

				// Serialize arrays
				const adminJson = schema.serializeArray(admins);
				const memberJson = schema.serializeArray(members);

				if (existing.length > 0) {
					// Update
					await db
						.update(schema.group_whatsapp)
						.set({
							name: group.subject,
							ownerPhone: ownerPhone || admins[0] || 'unknown',
							admin: adminJson,
							member: memberJson,
						})
						.where(eq(schema.group_whatsapp.id, group.id));
				} else {
					// Insert
					await db.insert(schema.group_whatsapp).values({
						id: group.id,
						name: group.subject,
						ownerPhone: ownerPhone || admins[0] || 'unknown',
						admin: adminJson,
						member: memberJson,
					});
				}

				result.savedGroups++;
				console.log(`[${result.savedGroups}/${groups.length}] Saved group: ${group.subject} (${group.id})`);
			} catch (error) {
				result.failedGroups++;
				const errorMsg = `Group ${group.id}: ${error instanceof Error ? error.message : String(error)}`;
				result.errors.push(errorMsg);
				console.error(errorMsg);
			}
		}

		// Mark as failed jika ada errors
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

// ==================== HELPER FUNCTIONS ====================

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

/**
 * Main function - entry point for standalone execution
 */
async function main() {
	// Get environment variables
	const baseUrl = process.env.BASE_URL_NAME || process.env.BASE_URL || process.env.baseUrl;
	const session = process.env.SESSION_NAME || process.env.SESSION || process.env.session || 'default';
	const apiKey = process.env.API_KEY || process.env.apiKey;
	const dbPath = process.env.DB_PATH || './local.db';

	// Validate required parameters
	if (!baseUrl) {
		console.error('❌ Error: BASE_URL_NAME or BASE_URL environment variable is required');
		console.error('\nUsage:');
		console.error('  bun src/scripts/fetch-all-groups.ts');
		console.error('\nEnvironment variables:');
		console.error('  BASE_URL_NAME - Waha base URL (required)');
		console.error('  SESSION_NAME - Session name (default: default)');
		console.error('  API_KEY - Waha API key (required)');
		console.error('  DB_PATH - Local database path (default: ./local.db)');
		process.exit(1);
	}

	if (!apiKey) {
		console.error('❌ Error: API_KEY environment variable is required');
		process.exit(1);
	}

	// Initialize database
	console.log(`Using database: ${dbPath}`);
	const sqlite = new Database(dbPath);
	const db = drizzle(sqlite, { schema });

	try {
		// Fetch and save groups
		console.log('\n🚀 Starting fetch all groups...\n');
		const result = await fetchAllGroupsAndSave(baseUrl, session, apiKey, db);

		// Print result
		console.log('\n' + formatFetchGroupsResult(result) + '\n');

		// Exit with appropriate code
		process.exit(result.success ? 0 : 1);
	} catch (error) {
		console.error('\n❌ Fatal error:', error);
		process.exit(1);
	} finally {
		sqlite.close();
	}
}

// Run main function if this file is executed directly
if (import.meta.main) {
	main();
}
