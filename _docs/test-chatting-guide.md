# Test Chatting Guide

Panduan untuk menjalankan test chatting functionality (sendText, sendImage, sendButtons).

## Setup Environment Variables

Pastikan environment variables sudah diset di `.dev.vars`:

```bash
WAHA_BASE_URL=http://localhost:3000
WAHA_API_KEY=your_api_key_here
WAHA_SESSION=default
```

Atau set sebagai environment variables saat menjalankan test:

```bash
WAHA_BASE_URL=http://localhost:3000 WAHA_API_KEY=your_key bun run test:chatting
```

## Menjalankan Test

### Jalankan semua test:

```bash
bun run test:chatting
```

### Atau langsung dengan file:

```bash
bun run src/functions/lib/test-chatting.ts
```

## Test yang Tersedia

Test script akan menjalankan 7 test secara berurutan:

1. **Send Text to Personal** - Kirim pesan text ke nomor personal
2. **Send Text to Group** - Kirim pesan text ke grup
3. **Send Image to Personal** - Kirim gambar ke nomor personal
4. **Send Image to Group** - Kirim gambar ke grup
5. **Send Buttons to Personal** - Kirim buttons/list ke nomor personal
6. **Send Buttons to Group** - Kirim buttons/list ke grup
7. **Broadcast to Persons** - Broadcast pesan ke multiple contacts

## Konfigurasi Test Target

Ubah nilai di file [src/functions/lib/test-chatting.ts](src/functions/lib/test-chatting.ts):

```typescript
// Line 16-17
const TEST_PHONE_NUMBER = '6285174346212'; // Ganti dengan nomor kamu
const TEST_GROUP_ID = '120363399604541928@g.us'; // Ganti dengan group ID kamu
```

## Custom Test Data

Ubah test data sesuai kebutuhan di file yang sama:

```typescript
// Line 20-21 - Message content
const TEST_MESSAGE = '🧪 Test pesan dari WahaChatClient...';

// Line 23-27 - Image test
const TEST_IMAGE = {
	url: 'https://picsum.photos/800/600',
	caption: '🖼️ Test gambar dari WahaChatClient...'
};

// Line 29-49 - Buttons test
const TEST_BUTTONS = {
	header: '📋 Test List/Buttons',
	body: 'Silakan pilih salah satu opsi...',
	buttons: [...]
};
```

## Mengambil Environment dari Config

Test script menggunakan `createManualWahaConfig()` dari [src/config/waha.ts](src/config/waha.ts):

```typescript
import { createManualWahaConfig } from './config/waha';

const config = createManualWahaConfig(BASE_URL, API_KEY, SESSION);
const client = new WahaChatClient(config);
```

Atau untuk production environment (Cloudflare Worker):

```typescript
import { createWahaConfig } from './config/waha';

const config = await createWahaConfig(env); // env dari Cloudflare Worker
const client = new WahaChatClient(config);
```

## Expected Output

Setiap test akan menampilkan:

```
============================================================
  TEST 1: Send Text to Personal
============================================================
ℹ️  Sending text to 6285174346212...
✅ Text sent successfully!
Response: { "message": "Message sent successfully", ... }

⏳ Waiting 2 seconds before next test...
```

## Troubleshooting

### Error: WAHA_API_KEY is not set

Pastikan environment variable sudah diset dengan benar.

### Error: Failed to send text: 401 Unauthorized

API key tidak valid. Cek kembali API key yang digunakan.

### Error: Failed to send text: 404 Not Found

Base URL tidak benar atau Waha server tidak berjalan.

### Error: Phone number not found

Nomor telepon tidak terdaftar di WhatsApp atau format salah.

## Menggunakan di Production Code

Contoh penggunaan di Cloudflare Worker:

```typescript
import { createChatClient } from './functions/lib/chatting';

export default {
	async fetch(request, env, ctx) {
		// Create client from env
		const client = await createChatClient(env);

		// Send text
		await client.sendToPerson('6281234567890', 'Hello!');

		// Send image
		await client.sendImageToPerson(
			'6281234567890',
			'https://example.com/image.jpg',
			'Check this out!'
		);

		// Send buttons
		await client.sendButtonsToChat(
			'6281234567890',
			'Choose an option:',
			[
				{ type: 'reply', text: 'Option 1' },
				{ type: 'reply', text: 'Option 2' }
			],
			'Header',
			'Footer'
		);

		return new Response('OK');
	}
};
```
