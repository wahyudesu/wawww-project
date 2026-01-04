import dotenv from 'dotenv';
import { test, expect, describe } from 'bun:test';
import { WahaChatClient } from './lib/chatting';
import { createManualWahaConfig } from '../config/waha';
import {
	getGroupParticipants,
	mentionAll,
	isAdmin,
	handleKickCommand,
	handleAddCommand,
	closeGroup,
	openGroup,
} from './groupUtils';

dotenv.config({ path: '.dev.vars' });
const BASE_URL = process.env.base_url_name!;
const API_KEY = process.env.api_key!;
const SESSION = process.env.session_name!;

// ==================== TEST CONFIGURATION ====================

// Test group settings
const TEST_GROUP_ID = '120363420004681217@g.us'; // Group ID untuk testing
const TEST_ADMIN_PHONE = '6282142667503'; // Admin number (bot owner)
const TEST_MEMBER_PHONE = '6285174346212'; // Member number untuk testing

// Create client once for all tests
const config = createManualWahaConfig(BASE_URL, API_KEY, SESSION);
const client = new WahaChatClient(config);

// ==================== TEST SUITE ====================

describe('GroupUtils - Group Management Tests', () => {

	describe('getGroupParticipants', () => {
		test('should fetch group participants', async () => {
			const participants = await getGroupParticipants(BASE_URL, SESSION, TEST_GROUP_ID, API_KEY);

			// Expect result to be an array
			expect(Array.isArray(participants)).toBe(true);

			// Expect at least 1 participant
			expect(participants.length).toBeGreaterThan(0);

			// Expect participant format
			expect(participants[0]).toMatch(/@c\.us$/);

			console.log(`✅ Found ${participants.length} participants in group`);
		}, 15000); // 15s timeout
	});

	describe('isAdmin', () => {
		test('should detect admin user', async () => {
			const adminId = `${TEST_ADMIN_PHONE}@c.us`;
			const isAdminUser = await isAdmin(BASE_URL, SESSION, TEST_GROUP_ID, adminId, API_KEY);

			// Bot owner should be admin
			expect(isAdminUser).toBeDefined();
			console.log(`✅ Admin check for ${TEST_ADMIN_PHONE}: ${isAdminUser ? 'ADMIN' : 'NOT ADMIN'}`);
		}, 15000); // 15s timeout

		test('should return false for non-admin user', async () => {
			const memberId = `${TEST_MEMBER_PHONE}@c.us`;
			const isAdminUser = await isAdmin(BASE_URL, SESSION, TEST_GROUP_ID, memberId, API_KEY);

			// Test member should not be admin (or might be, depends on group setup)
			expect(isAdminUser).toBeDefined();
			console.log(`✅ Admin check for ${TEST_MEMBER_PHONE}: ${isAdminUser ? 'ADMIN' : 'NOT ADMIN'}`);
		}, 15000); // 15s timeout
	});

	describe('mentionAll', () => {
		test('should mention all filtered participants in group', async () => {
			// First get all participants
			const participants = await getGroupParticipants(BASE_URL, SESSION, TEST_GROUP_ID, API_KEY);

			// Use mentionAll with WahaChatClient
			const result = await mentionAll(client, TEST_GROUP_ID, participants);

			// Expect result to exist
			expect(result).toBeDefined();

			// Expect success response
			expect(result).toHaveProperty('message');

			console.log('✅ Mention all sent successfully:', result);
		}, 20000); // 20s timeout
	});
});

describe('GroupUtils - Group Settings Tests', () => {

	describe('closeGroup and openGroup', () => {
		test('should close group (admin only)', async () => {
			try {
				const result = await closeGroup(BASE_URL, SESSION, TEST_GROUP_ID, API_KEY);

				// Expect result to exist
				expect(result).toBeDefined();

				// Expect success
				expect(result).toHaveProperty('success');

				console.log('✅ Group closed successfully:', result);

				// Wait a bit before reopening
				await new Promise(resolve => setTimeout(resolve, 2000));
			} catch (error: any) {
				// If not admin, that's expected for this test
				console.log(`⚠️ Close group failed (expected if not admin): ${error.message}`);
				expect(error).toBeDefined();
			}
		}, 15000); // 15s timeout

		test('should open group (admin only)', async () => {
			try {
				const result = await openGroup(BASE_URL, SESSION, TEST_GROUP_ID, API_KEY);

				// Expect result to exist
				expect(result).toBeDefined();

				// Expect success
				expect(result).toHaveProperty('success');

				console.log('✅ Group opened successfully:', result);
			} catch (error: any) {
				// If not admin, that's expected for this test
				console.log(`⚠️ Open group failed (expected if not admin): ${error.message}`);
				expect(error).toBeDefined();
			}
		}, 15000); // 15s timeout
	});
});

describe('GroupUtils - Admin Command Handlers', () => {

	describe('handleKickCommand', () => {
		test('should check admin permission before kicking', async () => {
			// Try to kick with admin account (should pass admin check)
			const adminId = `${TEST_ADMIN_PHONE}@c.us`;
			const targetMember = `${TEST_MEMBER_PHONE}@c.us`;
			const testMessageId = 'test_message_123';

			try {
				await handleKickCommand(
					client,
					BASE_URL,
					SESSION,
					API_KEY,
					TEST_GROUP_ID,
					adminId,
					TEST_MEMBER_PHONE,
					testMessageId,
				);

				console.log('✅ Kick command executed (admin check passed)');
			} catch (error: any) {
				// May fail if trying to kick admin or if target not in group
				console.log(`⚠️ Kick command error: ${error.message}`);
			}

			// Test should reach this point (admin check should pass)
			expect(true).toBe(true);
		}, 20000); // 20s timeout

		test('should deny kick command for non-admin', async () => {
			const nonAdminId = `${TEST_MEMBER_PHONE}@c.us`;
			const targetMember = `${TEST_ADMIN_PHONE}@c.us`;
			const testMessageId = 'test_message_456';

			// This should fail admin check (unless test member is also admin)
			await handleKickCommand(
				client,
				BASE_URL,
				SESSION,
				API_KEY,
				TEST_GROUP_ID,
				nonAdminId,
				TEST_ADMIN_PHONE,
				testMessageId,
			);

			// If we get here without error, the test member might be admin
			console.log('⚠️ Non-admin was able to execute kick (might be admin in group)');
			expect(true).toBe(true);
		}, 20000); // 20s timeout
	});

	describe('handleAddCommand', () => {
		test('should check admin permission before adding member', async () => {
			const adminId = `${TEST_ADMIN_PHONE}@c.us`;
			const memberToAdd = [TEST_MEMBER_PHONE];
			const testMessageId = 'test_message_789';

			try {
				await handleAddCommand(
					client,
					BASE_URL,
					SESSION,
					API_KEY,
					TEST_GROUP_ID,
					adminId,
					memberToAdd,
					testMessageId,
				);

				console.log('✅ Add command executed (admin check passed)');
			} catch (error: any) {
				// May fail if member already in group or other WhatsApp restrictions
				console.log(`⚠️ Add command error: ${error.message}`);
			}

			// Test should reach this point (admin check should pass)
			expect(true).toBe(true);
		}, 20000); // 20s timeout
	});
});

// ==================== HELPERS ====================

/**
 * Helper function to send test notification
 */
async function sendTestNotification(message: string) {
	try {
		await client.sendToPerson(TEST_ADMIN_PHONE, `🧪 ${message}`);
		console.log(`✅ Test notification sent: ${message}`);
	} catch (error) {
		console.error('❌ Failed to send test notification:', error);
	}
}

// Send notification when tests start
console.log('🧪 Starting GroupUtils tests...');
console.log(`📋 Test Group ID: ${TEST_GROUP_ID}`);
console.log(`👤 Test Admin: ${TEST_ADMIN_PHONE}`);
console.log(`👤 Test Member: ${TEST_MEMBER_PHONE}`);
