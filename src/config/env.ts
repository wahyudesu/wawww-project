import { env } from 'cloudflare:workers';

// Grup WA Spesifik (wajib)
export const GroupIds = [
	'120363399604541928@g.us', //AAAAA
	'120363183408730771@g.us', //jamaah wahyu sdt
	//   "120363123456789@g.us",
	//   "6281234567890@c.us",
];

// Spesifik personal contact (default:everyone)
export const PersonalIds = [
	'6285174346212@c.us',
	//   "120363123456789@g.us",
	//   "6281234567890@c.us",
];

export async function getWorkerEnv(env: any) {
	const APIkey = await env.api_key.get();
	const baseUrl = await env.base_url_name.get();
	const session = await env.session_name.get();
	const openrouterKey = await env.openrouter_key.get();

	if (!baseUrl) throw new Error('BASE_URL environment variable is missing or empty.');
	if (!session) throw new Error('SESSION environment variable is missing or empty.');
	if (!APIkey) throw new Error('X_API_KEY environment variable is missing or empty.');
	if (!openrouterKey) throw new Error('OPENROUTER_API_KEY environment variable is missing or empty.');

	// Cobalt API URL (optional, defaults to https://cobalt.tools)
	const cobaltApiUrl = env.COBALT_API_URL || 'https://cobalt.tools';

	return { baseUrl, session, APIkey, openrouterKey, cobaltApiUrl };
}

// Fungsi untuk cek apakah pesan dari grup/individu yang diizinkan
export function isAllowedSource(payload: any): boolean {
	// Cek grup
	if (payload.from && GroupIds.includes(payload.from)) return true;
	// Cek personal
	if (payload.from && PersonalIds.includes(payload.from)) return true;
	return false;
}
