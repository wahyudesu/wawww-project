// src/db/schema.ts
import { pgTable, varchar, text, date, smallint, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const group_whatsapp = pgTable('group_whatsapp', {id: uuid().primaryKey(),
	name: varchar({ length: 100 }).notNull(),

	ownerId: uuid().notNull().references(() => user.id),
	admin: varchar({ length: 15 }).array(),          // banyak nomor
	member: varchar({ length: 15 }).array(),         // banyak nomor

	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	setings: jsonb(),
});

// USER
export const user = pgTable('user', {
	id: uuid().primaryKey(),

	name: varchar({ length: 100 }).notNull(),
	no: varchar({ length: 20 }).notNull(),
	email: varchar({ length: 100 }).unique(),

	note: text(), // note milik grup
	
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull().$onUpdateFn(() => new Date()),
});

// STATUS
export const subscription = pgTable('subscription', {
	id: uuid().primaryKey(),

	userId: uuid().notNull().references(() => user.id),

	plan: varchar({ length: 50 }).notNull(),      // free, pro, dll
	status: varchar({ length: 20 }).notNull(),    // active, expired
	expiresAt: timestamp('expires_at', { withTimezone: true }),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});