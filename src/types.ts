/**
 * Consolidated Type Definitions
 * Single source of truth for all types
 */

// ==================== ENVIRONMENT & CONFIG ====================

export interface Env {
	API_KEY: string;
	BASE_URL: string;
	SESSION: string;
	OPENROUTER_KEY: string;
	'db-tugas': D1Database;
	[key: string]: any;
}

export interface WorkerEnv {
	APIkey: string;
	baseUrl: string;
	session: string;
	openrouterKey: string;
	cobaltApiUrl: string;
}

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

// ==================== WHATSAPP EVENT TYPES ====================

export interface WhatsAppEvent {
	event: string;
	payload: WhatsAppPayload;
}

export interface WhatsAppPayload {
	from: string;
	body: string;
	participant?: string;
	id: string;
	[key: string]: any;
}

export interface GroupPayload {
	type: string;
	group: {
		id: string;
	};
	participants: Participant[];
}

export interface Participant {
	id: string;
}

// ==================== MESSAGE TYPES ====================

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

export interface Button {
	type: 'reply' | 'call' | 'copy' | 'url';
	text: string;
	phoneNumber?: string;
	copyCode?: string;
	url?: string;
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

export interface ListRow {
	title: string;
	rowId: string;
	description?: string;
}

export interface ListSection {
	title: string;
	rows: ListRow[];
}

// ==================== RESPONSE TYPES ====================

export interface SendTextResponse {
	status: string;
	sent?: SendMessageOptions;
	apiResult?: string;
	result?: any;
	error?: string;
}

export interface WelcomeMessageResponse {
	status: string;
}

export interface HelpResponse {
	status: string;
	result: any;
}

// ==================== FEATURE & CONTENT TYPES ====================

export interface Command {
	command: string;
	description: string;
}

export interface Feature {
	icon: string;
	title: string;
	description: string;
}

export interface Pantun {
	[index: number]: string[];
}

export interface DoaHarian {
	title: string;
	arabic: string;
	latin: string;
	translation: string;
}

// ==================== MATH QUIZ TYPES ====================

export interface MathQuestion {
	question: string;
	options: string[];
	correctAnswer: number;
}

export interface MathQuizState {
	questions: MathQuestion[];
	currentIndex: number;
	scores: Map<string, number>;
}

// ==================== TOXIC DETECTION TYPES ====================

export interface ToxicResult {
	isToxic: boolean;
	found: string[];
}

// ==================== BITCOIN TYPES ====================

export interface BitcoinPriceResponse {
	bitcoin?: {
		usd?: number;
		idr?: number;
	};
}

// ==================== MEDIA DOWNLOAD TYPES ====================

export interface MediaDownloadResult {
	type: 'video' | 'image';
	url: string; // Direct download URL
	thumbnail?: string; // Optional thumbnail
	caption?: string; // Optional caption from post
	filename: string;
}

export interface CobaltApiResponse {
	status: 'redirect' | 'stream' | 'error';
	url?: string;
	filename?: string;
	// Add other fields as needed based on actual API response
}

// ==================== DATABASE TYPES ====================

export interface Assignment {
	id?: number;
	mata_kuliah: string;
	deskripsi: string;
	deadline?: string;
	participant: string;
	created_at?: string;
}

export interface GroupData {
	group_id: string;
	name?: string;
	created_at?: string;
}

export interface ParticipantData {
	participant_id: string;
	group_id: string;
	is_admin?: boolean;
	joined_at?: string;
}
