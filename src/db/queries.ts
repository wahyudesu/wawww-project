/**
 * Database Queries - Drizzle ORM query functions
 * Provides typed database operations for groups and users
 */

import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';

// ==================== TYPES ====================

export type GroupWhatsAppSelect = typeof schema.group_whatsapp.$inferSelect;
export type GroupWhatsAppInsert = typeof schema.group_whatsapp.$inferInsert;
export type UserSelect = typeof schema.user.$inferSelect;
export type UserInsert = typeof schema.user.$inferInsert;

export type GroupSettings = NonNullable<
	GroupWhatsAppSelect['settings']
>;

// ==================== DATABASE INITIALIZATION ====================

/**
 * Get Drizzle database instance from D1 binding
 */
export function getDb(d1: any): DrizzleD1Database<typeof schema> {
	return drizzle(d1, { schema });
}

// ==================== GROUP QUERIES ====================

/**
 * Get group by chat ID
 */
export async function getGroupByChatId(
	db: DrizzleD1Database<typeof schema>,
	chatId: string,
): Promise<GroupWhatsAppSelect | undefined> {
	const result = await db
		.select()
		.from(schema.group_whatsapp)
		.where(eq(schema.group_whatsapp.id, chatId))
		.limit(1);

	return result[0];
}

/**
 * Get all groups
 */
export async function getAllGroups(
	db: DrizzleD1Database<typeof schema>,
): Promise<GroupWhatsAppSelect[]> {
	return await db.select().from(schema.group_whatsapp);
}

/**
 * Upsert group (insert or update)
 */
export async function upsertGroup(
	db: DrizzleD1Database<typeof schema>,
	data: {
		id: string;
		name: string;
		ownerId: string;
		admin?: string[];
		member?: string[];
	},
): Promise<void> {
	const existing = await getGroupByChatId(db, data.id);

	// Serialize arrays
	const adminJson = schema.serializeArray(data.admin || []);
	const memberJson = schema.serializeArray(data.member || []);

	if (existing) {
		// Update
		await db
			.update(schema.group_whatsapp)
			.set({
				name: data.name,
				ownerPhone: data.ownerId,
				admin: adminJson,
				member: memberJson,
			})
			.where(eq(schema.group_whatsapp.id, data.id));
	} else {
		// Insert
		await db.insert(schema.group_whatsapp).values({
			id: data.id,
			name: data.name,
			ownerPhone: data.ownerId,
			admin: adminJson,
			member: memberJson,
		});
	}
}

/**
 * Update group settings
 */
export async function updateGroupSettings(
	db: DrizzleD1Database<typeof schema>,
	chatId: string,
	settings: Partial<GroupSettings>,
): Promise<void> {
	const existing = await getGroupByChatId(db, chatId);
	if (!existing) {
		throw new Error(`Group ${chatId} not found`);
	}

	// Merge settings
	const currentSettings = (existing.settings || {}) as GroupSettings;
	const newSettings = { ...currentSettings, ...settings };

	await db
		.update(schema.group_whatsapp)
		.set({ settings: newSettings as any })
		.where(eq(schema.group_whatsapp.id, chatId));
}

// ==================== MEMBER QUERIES ====================

/**
 * Add member to group
 */
export async function addGroupMember(
	db: DrizzleD1Database<typeof schema>,
	chatId: string,
	phoneNumber: string,
): Promise<void> {
	const existing = await getGroupByChatId(db, chatId);
	if (!existing) {
		throw new Error(`Group ${chatId} not found`);
	}

	const members = schema.deserializeArray(existing.member);

	// Add if not already exists
	if (!members.includes(phoneNumber)) {
		members.push(phoneNumber);
		const memberJson = schema.serializeArray(members);

		await db
			.update(schema.group_whatsapp)
			.set({ member: memberJson })
			.where(eq(schema.group_whatsapp.id, chatId));
	}
}

/**
 * Remove member from group
 */
export async function removeGroupMember(
	db: DrizzleD1Database<typeof schema>,
	chatId: string,
	phoneNumber: string,
): Promise<void> {
	const existing = await getGroupByChatId(db, chatId);
	if (!existing) {
		throw new Error(`Group ${chatId} not found`);
	}

	const members = schema.deserializeArray(existing.member);
	const admins = schema.deserializeArray(existing.admin || '');

	// Remove from members
	const newMembers = members.filter((m) => m !== phoneNumber);
	const newAdmins = admins.filter((a) => a !== phoneNumber);

	const memberJson = schema.serializeArray(newMembers);
	const adminJson = schema.serializeArray(newAdmins);

	await db
		.update(schema.group_whatsapp)
		.set({
			member: memberJson,
			admin: adminJson,
		})
		.where(eq(schema.group_whatsapp.id, chatId));
}

/**
 * Add admin to group
 */
export async function addGroupAdmin(
	db: DrizzleD1Database<typeof schema>,
	chatId: string,
	phoneNumber: string,
): Promise<void> {
	const existing = await getGroupByChatId(db, chatId);
	if (!existing) {
		throw new Error(`Group ${chatId} not found`);
	}

	const admins = schema.deserializeArray(existing.admin || '');

	// Add if not already admin
	if (!admins.includes(phoneNumber)) {
		admins.push(phoneNumber);
		const adminJson = schema.serializeArray(admins);

		await db
			.update(schema.group_whatsapp)
			.set({ admin: adminJson })
			.where(eq(schema.group_whatsapp.id, chatId));
	}
}

/**
 * Check if user is group admin
 */
export async function isGroupAdmin(
	db: DrizzleD1Database<typeof schema>,
	chatId: string,
	phoneNumber: string,
): Promise<boolean> {
	const existing = await getGroupByChatId(db, chatId);
	if (!existing) {
		return false;
	}

	const admins = schema.deserializeArray(existing.admin || '');
	return admins.includes(phoneNumber);
}

// ==================== USER QUERIES ====================

/**
 * Get user by phone number
 */
export async function getUserByPhone(
	db: DrizzleD1Database<typeof schema>,
	phone: string,
): Promise<UserSelect | undefined> {
	const result = await db
		.select()
		.from(schema.user)
		.where(eq(schema.user.no, phone))
		.limit(1);

	return result[0];
}

/**
 * Create or update user
 */
export async function upsertUser(
	db: DrizzleD1Database<typeof schema>,
	data: {
		name: string;
		no: string;
		email?: string;
	},
): Promise<UserSelect> {
	const existing = await getUserByPhone(db, data.no);

	if (existing) {
		// Update
		await db
			.update(schema.user)
			.set({
				name: data.name,
				email: data.email || existing.email,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(schema.user.id, existing.id));

		return (await getUserByPhone(db, data.no))!;
	} else {
		// Insert
		const result = await db
			.insert(schema.user)
			.values({
				name: data.name,
				no: data.no,
				email: data.email || null,
			})
			.returning();

		return result[0];
	}
}
