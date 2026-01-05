import dotenv from 'dotenv';
import { test, expect, describe } from 'bun:test';
import { WahaChatClient } from './lib/chatting';
import { createManualWahaConfig } from '../config/waha';
import { GroupSettingsService, GroupMemberService } from '../services';

dotenv.config({ path: '.dev.vars' });
const BASE_URL = process.env.base_url_name!;
const API_KEY = process.env.api_key!;
const SESSION = process.env.session_name!;

// ==================== TEST CONFIGURATION ====================

const TEST_GROUP_ID = '120363399604541928@g.us';
const TEST_MEMBER_PHONE = '6282132928170';

const config = createManualWahaConfig(BASE_URL, API_KEY, SESSION);
const client = new WahaChatClient(config);

// ==================== TEST SUITE ====================

describe('GroupUtils - Complete Flow', () => {

	test('1. Mention all participants', async () => {
		const encodedGroupId = encodeURIComponent(TEST_GROUP_ID);
		const endpoint = `${BASE_URL}/api/${SESSION}/groups/${encodedGroupId}/participants`;

		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				accept: 'application/json',
				'X-Api-Key': API_KEY,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch participants: ${response.status}`);
		}

		const participantsJson = await response.json() as any;
		const participants = Array.isArray(participantsJson)
			? participantsJson
			: (participantsJson.participants || []);

		const participantIds = participants.map((p: any) => {
			const phoneId = p.jid || p.phoneNumber || p.id;
			return phoneId
				.replace('@s.whatsapp.net', '@c.us')
				.replace('@lid', '@c.us')
				.trim();
		});

		// Create mention text
		const mentionText = participantIds
			.map((id: string) => `@${id.replace('@c.us', '')}`)
			.join(' ');

		await client.sendToGroup(TEST_GROUP_ID, mentionText, { mentions: participantIds });

		console.log(`✅ Mentioned ${participantIds.length} participants`);
		expect(participantIds.length).toBeGreaterThan(0);
	}, 20000);

	// test('2a. Close group (admin only)', async () => {
	// 	const settingsService = new GroupSettingsService(BASE_URL, SESSION, API_KEY);
	// 	const result = await settingsService.closeGroup(TEST_GROUP_ID);

	// 	console.log('✅ Group closed - only admin can send');
	// 	expect(result).toBeDefined();
	// }, 15000);

	// test('2b. Open group (all members)', async () => {
	// 	const settingsService = new GroupSettingsService(BASE_URL, SESSION, API_KEY);
	// 	const result = await settingsService.openGroup(TEST_GROUP_ID);

	// 	console.log('✅ Group opened - all members can send');
	// 	expect(result).toBeDefined();
	// }, 15000);

	// test('3. Kick member from group', async () => {
	// 	const memberService = new GroupMemberService(BASE_URL, SESSION, API_KEY);
	// 	const result = await memberService.kickMember(TEST_GROUP_ID, TEST_MEMBER_PHONE);

	// 	console.log(`✅ Kicked member: ${TEST_MEMBER_PHONE}`);
	// 	expect(result).toBeDefined();
	// }, 20000);

	// test('4. Add member back to group', async () => {
	// 	const memberService = new GroupMemberService(BASE_URL, SESSION, API_KEY);
	// 	const result = await memberService.addMember(TEST_GROUP_ID, [TEST_MEMBER_PHONE]);

	// 	console.log(`✅ Added member back: ${TEST_MEMBER_PHONE}`);
	// 	expect(result).toBeDefined();
	// }, 20000);
});

// ==================== TEST INFO ====================

console.log('🧪 Group Flow Tests:');
console.log('1. Mention All → 2. Close/Open → 3. Kick → 4. Add');
console.log(`📋 Test Group: ${TEST_GROUP_ID}`);
console.log(`👤 Test Member: ${TEST_MEMBER_PHONE}`);
