// src/db/schema.ts
import { pgTable, varchar, text, date, smallint } from 'drizzle-orm/pg-core';

// USER
export const user = pgTable('user', {
	id: varchar().primaryKey(), //ganti uuid
	status: varchar({ length: 50 }).references(() => status.id),
	name: varchar({ length: 100 }).notNull(),
	no: varchar({ length: 15 }).notNull(),
	email: varchar({ length: 100 }).unique(),
	created_at: date(),
});

// STATUS
export const status = pgTable('status', {
	id: varchar({ length: 50 }).primaryKey(),
	label: varchar({ length: 50 }),
	start_date: date(),
	end_date: date(),
});

// GROUP
export const group = pgTable('group', {
	id: varchar({ length: 50 }).primaryKey(),
	name: varchar({ length: 100 }).notNull(),
	type: varchar({ length: 50 }),
});

// PARTICIPANT_GROUP
export const participant_group = pgTable('participant_group', {
	id: varchar({ length: 50 }).primaryKey(),
	no: varchar({ length: 15 }),
	role: varchar({ length: 15 }),
	sum_message: smallint().default(0),
	country: varchar({ length: 50 }),
	group_id: varchar({ length: 50 }).references(() => group.id),
	month: date(),
});

// TUGAS_GROUP
export const tugas_group = pgTable('tugas_group', {
	id: varchar({ length: 50 }).primaryKey(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	due_date: date(),
	group_id: varchar({ length: 50 }).references(() => group.id),
	created_at: date(),
});

// NOTE_GROUP
export const note_group = pgTable('note_group', {
	id: varchar({ length: 50 }).primaryKey(),
	note: text(),
	updated_at: date(),
	group_id: varchar({ length: 50 }).references(() => group.id),
});
