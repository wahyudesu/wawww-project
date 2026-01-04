/**
 * Group Admin Service
 * Handles all admin-related operations for WhatsApp groups
 */

import { WahaChatClient } from '../functions/lib/chatting';

export class GroupAdminService {
	private baseUrl: string;
	private session: string;
	private apiKey: string;

	constructor(baseUrl: string, session: string, apiKey: string) {
		this.baseUrl = baseUrl;
		this.session = session;
		this.apiKey = apiKey;
	}

	/**
	 * Check if user is admin in the group
	 */
	async isAdmin(groupId: string, userId: string): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/api/${this.session}/groups/${groupId}/participants`, {
				method: 'GET',
				headers: {
					accept: '*/*',
					'X-Api-Key': this.apiKey,
				},
			});

			if (!response.ok) {
				console.error('Failed to fetch participants for admin check:', response.statusText);
				return false;
			}

			const participantsJson = await response.json();
			if (!Array.isArray(participantsJson)) {
				console.error('Participants response is not an array:', participantsJson);
				return false;
			}

			// Find user and check if they are admin
			const user = participantsJson.find((p: any) => {
				const phoneId = p.jid || p.id;
				const formattedId = phoneId.replace('@s.whatsapp.net', '@c.us');
				const normalizedUserId = userId.replace('@s.whatsapp.net', '@c.us');
				return formattedId === normalizedUserId || p.id === normalizedUserId || phoneId === normalizedUserId;
			});

			if (!user) {
				console.log('User not found in participants list');
				return false;
			}

			return this.checkAdminRole(user);
		} catch (error) {
			console.error('Error checking admin status:', error);
			return false;
		}
	}

	/**
	 * Check admin role from Waha user object
	 */
	private checkAdminRole(user: any): boolean {
		const allStringValues = Object.values(user).filter((val) => typeof val === 'string') as string[];
		const containsAdminInString = allStringValues.some(
			(val) => val.toLowerCase().includes('admin') || val.toLowerCase().includes('moderator') || val.toLowerCase().includes('owner'),
		);

		return (
			// Exact matches
			user.rank === 'admin' ||
			user.rank === 'superadmin' ||
			user.rank === 'Admin' ||
			user.rank === 'SuperAdmin' ||
			user.role === 'admin' ||
			user.role === 'superadmin' ||
			user.role === 'Admin' ||
			user.role === 'SuperAdmin' ||
			user.type === 'admin' ||
			user.type === 'superadmin' ||
			user.type === 'Admin' ||
			user.type === 'SuperAdmin' ||
			// Boolean fields
			user.admin === true ||
			user.isAdmin === true ||
			// Group specific fields
			user.role === 'group_admin' ||
			user.role === 'GroupAdmin' ||
			user.groupRole === 'admin' ||
			user.groupRole === 'Admin' ||
			user.level === 'admin' ||
			user.level === 'Admin' ||
			// Contains checks
			(user.rank && String(user.rank).toLowerCase().includes('admin')) ||
			(user.rank && String(user.rank).toLowerCase().includes('moderator')) ||
			(user.rank && String(user.rank).toLowerCase().includes('owner')) ||
			(user.role && String(user.role).toLowerCase().includes('admin')) ||
			(user.role && String(user.role).toLowerCase().includes('moderator')) ||
			(user.role && String(user.role).toLowerCase().includes('owner')) ||
			(user.type && String(user.type).toLowerCase().includes('admin')) ||
			(user.type && String(user.type).toLowerCase().includes('moderator')) ||
			(user.type && String(user.type).toLowerCase().includes('owner')) ||
			(user.groupRole && String(user.groupRole).toLowerCase().includes('admin')) ||
			(user.groupRole && String(user.groupRole).toLowerCase().includes('moderator')) ||
			(user.groupRole && String(user.groupRole).toLowerCase().includes('owner')) ||
			(user.level && String(user.level).toLowerCase().includes('admin')) ||
			(user.level && String(user.level).toLowerCase().includes('moderator')) ||
			(user.level && String(user.level).toLowerCase().includes('owner')) ||
			// Check ALL string values
			containsAdminInString
		);
	}
}
