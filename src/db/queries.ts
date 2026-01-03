/**
 * Database Query Functions
 * Utility functions untuk CRUD operations sesuai schema
 */

import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import { serializeArray, deserializeArray } from './schema';

// ==================== TYPES ====================

export type GroupSettings = {
	welcome: boolean;
	tagall: 'admin' | 'member' | 'owner';
	welcomeMessage: string;
	sholatreminder: boolean;
};

export type GroupWhatsApp = typeof schema.group_whatsapp.$inferInsert;
export type GroupWhatsAppSelect = typeof schema.group_whatsapp.$inferSelect;

// Default settings constant
const defaultSettings: GroupSettings = {
	welcome: true,
	tagall: 'admin',
	welcomeMessage: 'Selamat datang di grup {name}!, semoga betah',
	sholatreminder: false,
};

// ==================== HELPERS ====================

async function getOne<T>(db: DrizzleD1Database<typeof schema>, table: any, where: any): Promise<T | undefined> {
	const result = await db.select().from(table).where(where);
	return result[0] as T;
}

export function getDb(env: any): DrizzleD1Database<typeof schema> {
	return drizzle(env.DB, { schema });
}

export async function getGroupByChatId(db: DrizzleD1Database<typeof schema>, chatId: string) {
	return getOne<GroupWhatsAppSelect>(db, schema.group_whatsapp, eq(schema.group_whatsapp.id, chatId));
}

// ==================== GROUP QUERIES ====================
// update settings
// add user to group

export async function upsertGroup(
	db: DrizzleD1Database<typeof schema>,
	data: {
		id: string;
		name: string;
		ownerPhone: string;
		admin?: string[];
		member?: string[];
		settings?: GroupSettings;
	},
) {
	const existing = await getGroupByChatId(db, data.id);

	if (existing) {
		await db
			.update(schema.group_whatsapp)
			.set({
				name: data.name,
				admin: data.admin ? serializeArray(data.admin) : existing.admin,
				member: data.member ? serializeArray(data.member) : existing.member,
				settings: data.settings ? (data.settings as any) : (existing.settings as any),
			})
			.where(eq(schema.group_whatsapp.id, data.id));
	} else {
		await db.insert(schema.group_whatsapp).values({
			id: data.id,
			name: data.name,
			ownerPhone: data.ownerPhone,
			admin: serializeArray(data.admin ?? []),
			member: serializeArray(data.member ?? []),
			settings: (data.settings ?? defaultSettings) as any,
		});
	}
}

export async function updateGroupSettings(
	db: DrizzleD1Database<typeof schema>,
	chatId: string,
	settings: Partial<GroupSettings>,
) {
	const group = await getGroupByChatId(db, chatId);
	if (!group) throw new Error('Group not found');

	const currentSettings = (group.settings as unknown as GroupSettings) ?? defaultSettings;
	const newSettings = { ...currentSettings, ...settings };

	await db
		.update(schema.group_whatsapp)
		.set({ settings: newSettings as any })
		.where(eq(schema.group_whatsapp.id, chatId));
}

export async function removeGroupMember(db: DrizzleD1Database<typeof schema>, chatId: string, phone: string) {
	const group = await getGroupByChatId(db, chatId);
	if (!group) throw new Error('Group not found');

	const members = deserializeArray(group.member).filter((m) => m !== phone);
	const admins = deserializeArray(group.admin).filter((a) => a !== phone);

	await db
		.update(schema.group_whatsapp)
		.set({
			member: serializeArray(members),
			admin: serializeArray(admins),
		})
		.where(eq(schema.group_whatsapp.id, chatId));
}

export async function isGroupAdmin(db: DrizzleD1Database<typeof schema>, chatId: string, phone: string): Promise<boolean> {
	const group = await getGroupByChatId(db, chatId);
	const adminArray = deserializeArray(group?.admin ?? null);
	return adminArray.includes(phone);
}

export async function addGroupMember(db: DrizzleD1Database<typeof schema>, chatId: string, phone: string) {
	const group = await getGroupByChatId(db, chatId);
	if (!group) throw new Error('Group not found');

	const members = deserializeArray(group.member);
	if (members.includes(phone)) return; // Already a member

	await db
		.update(schema.group_whatsapp)
		.set({ member: serializeArray([...members, phone]) })
		.where(eq(schema.group_whatsapp.id, chatId));
}

export async function addGroupAdmin(db: DrizzleD1Database<typeof schema>, chatId: string, phone: string) {
	const group = await getGroupByChatId(db, chatId);
	if (!group) throw new Error('Group not found');

	const admins = deserializeArray(group.admin);
	if (admins.includes(phone)) return; // Already an admin

	const members = deserializeArray(group.member);
	if (!members.includes(phone)) {
		// Add to members first if not already a member
		await db
			.update(schema.group_whatsapp)
			.set({
				member: serializeArray([...members, phone]),
				admin: serializeArray([...admins, phone]),
			})
			.where(eq(schema.group_whatsapp.id, chatId));
	} else {
		await db
			.update(schema.group_whatsapp)
			.set({ admin: serializeArray([...admins, phone]) })
			.where(eq(schema.group_whatsapp.id, chatId));
	}
}
