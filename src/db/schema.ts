// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Helper functions for array handling (SQLite doesn't support arrays natively)
export function serializeArray(arr: string[]): string {
	return JSON.stringify(arr);
}

export function deserializeArray(jsonStr: string | null): string[] {
	if (!jsonStr) return [];
	try {
		return JSON.parse(jsonStr);
	} catch {
		return [];
	}
}

export const group_whatsapp = sqliteTable('group_whatsapp', {
	id: text('id').primaryKey(), // WhatsApp group IDs are strings like "120363399604541928@g.us"
	name: text('name', { length: 100 }).notNull(),

	ownerPhone: text('owner_phone').notNull(), // Owner's phone number
	admin: text('admin'), // JSON string array of phone numbers
	member: text('member'), // JSON string array of phone numbers

	createdAt: text('created_at').$defaultFn(() => new Date().toISOString()).notNull(),
	settings: text('settings', { mode: 'json' }).$type<{
		welcome: boolean;
		tagall: 'admin' | 'member' | 'owner';
		welcomeMessage: string;
		sholatreminder: boolean;
	}>().$defaultFn(() => ({
		welcome: true, // true, false
		tagall: 'admin', // admin, member, owner
		welcomeMessage: 'Selamat datang di grup {name}!, semoga betah', // custom message
		sholatreminder: false, // true, false
	})),
});

// USER
export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),

	name: text('name', { length: 100 }).notNull(),
	no: text('no', { length: 20 }).notNull(),
	email: text('email', { length: 100 }).unique(),

	note: text('note'), // note milik grup

	createdAt: text('created_at').$defaultFn(() => new Date().toISOString()).notNull(),
	updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()).notNull(),
});

// STATUS
export const subscription = sqliteTable('subscription', {
	id: integer('id').primaryKey({ autoIncrement: true }),

	userId: integer('user_id').notNull().references(() => user.id),

	plan: text('plan', { length: 50 }).notNull(), // free, pro, dll
	status: text('status', { length: 20 }).notNull(), // active, expired
	expiresAt: text('expires_at'), // ISO date string

	createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});