import dotenv from 'dotenv';
import { test, expect, describe } from 'bun:test';
import { WahaChatClient } from './chatting';
import { createManualWahaConfig } from '../../config/waha';

dotenv.config({ path: '.dev.vars' });
const BASE_URL = process.env.base_url_name!;
const API_KEY = process.env.api_key!;
const SESSION = process.env.session_name!;

// Test targets 
const TEST_PHONE_NUMBER = '6285174346212'; // Personal number untuk test

// Test data
const TEST_MESSAGE = '🧪 Test pesan dari WahaChatClient\n\nIni adalah pesan test otomatis.';

const TEST_IMAGE = {
	url: 'https://fastly.picsum.photos/id/783/800/600.jpg?hmac=9E0Hm_Au7n-J17-Ia1S7sG9J-mi5eL6FX4xiIdc_ZRI', // Random image untuk test
	caption: '🖼️ Test gambar dari WahaChatClient\n\nIni adalah gambar test otomatis.',
};

// ==================== SETUP ====================

// Create client once for all tests
const config = createManualWahaConfig(BASE_URL, API_KEY, SESSION);
const client = new WahaChatClient(config);

// ==================== TEST SUITE ====================

describe('WahaChatClient - Personal Chat Tests', () => {

	describe('Send Text Messages', () => {
		test('should send text to personal chat', async () => {
			const result = await client.sendToPerson(TEST_PHONE_NUMBER, TEST_MESSAGE);

			// Expect result to exist
			expect(result).toBeDefined();

			// Expect success response
			expect(result).toHaveProperty('message');
			console.log('✅ Text sent successfully:', result);
		}, 10000); // 10s timeout
	});

	describe('Send Image Messages', () => {
		test('should send image to personal chat', async () => {
			const result = await client.sendImageToPerson(
				TEST_PHONE_NUMBER,
				TEST_IMAGE.url,
				TEST_IMAGE.caption,
			);

			// Expect result to exist
			expect(result).toBeDefined();

			// Expect success response
			expect(result).toHaveProperty('message');
			console.log('✅ Image sent successfully:', result);
		}, 10000); // 10s timeout
	});

	describe('Send List Messages', () => {
		test('should send list to personal chat', async () => {
			const TEST_LIST = {
				title: '📋 Test List Menu',
				description: 'Silakan pilih salah satu opsi di bawah ini:',
				footer: 'Ini adalah pesan test otomatis',
				button: 'Pilih Opsi',
				sections: [
					{
						title: 'Kategori 1',
						rows: [
							{
								title: 'Opsi 1.1',
								rowId: 'opt_1_1',
								description: 'Deskripsi opsi 1.1',
							},
							{
								title: 'Opsi 1.2',
								rowId: 'opt_1_2',
								description: 'Deskripsi opsi 1.2',
							},
						],
					},
					{
						title: 'Kategori 2',
						rows: [
							{
								title: 'Opsi 2.1',
								rowId: 'opt_2_1',
								description: 'Deskripsi opsi 2.1',
							},
							{
								title: 'Opsi 2.2',
								rowId: 'opt_2_2',
								description: 'Deskripsi opsi 2.2',
							},
						],
					},
				],
			};

			const result = await client.sendListToChat(
				TEST_PHONE_NUMBER,
				TEST_LIST.title,
				TEST_LIST.button,
				TEST_LIST.sections,
				TEST_LIST.description,
				TEST_LIST.footer,
			);

			// Expect result to exist
			expect(result).toBeDefined();

			// Expect success response
			expect(result).toHaveProperty('message');
			console.log('✅ List sent successfully:', result);
		}, 10000); // 10s timeout
	});
});

// ==================== GROUP TESTS (DISABLED) ====================

// describe.skip('WahaChatClient - Group Chat Tests (Disabled)', () => {
// 	const TEST_GROUP_ID = '120363399604541928@g.us'; // Group ID untuk test

// 	test.skip('should send text to group', async () => {
// 		const result = await client.sendToGroup(TEST_GROUP_ID, TEST_MESSAGE);
// 		expect(result).toBeDefined();
// 		expect(result).toHaveProperty('message');
// 		console.log('✅ Text sent to group successfully:', result);
// 	}, 10000);

// 	test.skip('should send image to group', async () => {
// 		const result = await client.sendImageToGroup(
// 			TEST_GROUP_ID,
// 			TEST_IMAGE.url,
// 			TEST_IMAGE.caption,
// 		);
// 		expect(result).toBeDefined();
// 		expect(result).toHaveProperty('message');
// 		console.log('✅ Image sent to group successfully:', result);
// 	}, 10000);

// 	test.skip('should send buttons to group', async () => {
// 		const result = await client.sendButtonsToChat(
// 			TEST_GROUP_ID,
// 			TEST_BUTTONS.body,
// 			TEST_BUTTONS.buttons,
// 			TEST_BUTTONS.header,
// 			TEST_BUTTONS.footer,
// 		);
// 		expect(result).toBeDefined();
// 		expect(result).toHaveProperty('message');
// 		console.log('✅ Buttons sent to group successfully:', result);
// 	}, 10000);
// });
