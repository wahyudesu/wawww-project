// src/db/schema.ts
import { pgTable, uuid, varchar, text, date } from 'drizzle-orm/pg-core';

// USER
export const user = pgTable('user', {
	id: varchar('id').primaryKey(), //ngambil id dari key
	status: varchar('status', { length: 50 }).references(() => status.id),
	name: varchar('name', { length: 100 }).notNull(),
	no: varchar('no', { length: 15 }).notNull(),
	email: varchar('email', { length: 100 }).unique(),
	created_at: date('created_at'),
});

// STATUS
export const status = pgTable('status', {
	id: varchar('id', { length: 50 }).primaryKey(),
	label: varchar('label', { length: 50 }),
	start_date: date('start_date'),
	end_date: date('end_date'),
});

// GROUP
export const group = pgTable('group', {
	id: varchar('id', { length: 50 }).primaryKey(), //ngambil id dari key
	name: varchar('name', { length: 100 }).notNull(),
	type: varchar('type', { length: 50 }),
});

// PARTICIPANT_GROUP
export const participant_group = pgTable('participant_group', {
	id: varchar('id', { length: 50 }).primaryKey(),
	no: varchar('no', { length: 15 }),
	role: varchar('participant', { length: 15 }),
	sum_message: varchar('sum_message', { length: 255 }),
	country: varchar('country', { length: 50 }),
	group_id: varchar('group_id', { length: 50 }).references(() => group.id),
});

// TUGAS_GROUP
export const tugas_group = pgTable('tugas_group', {
	id: varchar('id', { length: 50 }).primaryKey(),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description'),
	due_date: date('due_date'),
	group_id: varchar('group_id', { length: 50 }).references(() => group.id),
	created_at: date('created_at'),
});

// NOTE_GROUP
export const note_group = pgTable('note_group', {
	id: varchar('id', { length: 50 }).primaryKey(),
	note: text('note'),
	updated_at: date('updated_at'),
	group_id: varchar('group_id', { length: 50 }).references(() => group.id),
});

