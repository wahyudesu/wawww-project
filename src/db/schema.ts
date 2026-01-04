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
	id: text().primaryKey(), // WhatsApp group IDs are strings like "120363399604541928@g.us"
	name: text({ length: 100 }).notNull(),

	ownerPhone: text({ length: 20 }).notNull(), // Owner's phone number
	admin: text(), // JSON string array of phone numbers
	member: text(), // JSON string array of phone numbers
	note: text('note'), // JSON string array of phone numbers


	createdAt: text().$defaultFn(() => new Date().toISOString()).notNull(),
	settings: text({ mode: 'json' }).$type<{
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
	id: integer().primaryKey({ autoIncrement: true }),

	name: text({ length: 100 }).notNull(),
	no: text({ length: 20 }).notNull(),
	email: text({ length: 100 }).unique(),

	createdAt: text().$defaultFn(() => new Date().toISOString()).notNull(),
	updatedAt: text().$defaultFn(() => new Date().toISOString()).notNull(),
});

// STATUS
export const subscription = sqliteTable('subscription', {
	id: integer().primaryKey({ autoIncrement: true }),

	userId: integer().notNull().references(() => user.id),

	plan: text({ length: 50 }).notNull(), // free, pro, dll
	status: text({ length: 20 }).notNull(), // active, expired
	expiresAt: text(), // ISO date string

	createdAt: text().$defaultFn(() => new Date().toISOString()),
});