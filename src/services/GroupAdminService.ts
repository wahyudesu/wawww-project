/**
 * Group Admin Service
 * Handles all admin-related operations for WhatsApp groups
 */

import { WahaChatClient } from '../functions/lib/chatting';
import { fetchWithRetry } from '../utils/retry';

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
			const response = await fetchWithRetry(
				`${this.baseUrl}/api/${this.session}/groups/${groupId}/participants`,
				{
					method: 'GET',
					headers: {
						accept: '*/*',
						'X-Api-Key': this.apiKey,
					},
				},
				3, // max retries
				2000, // initial delay (2 seconds)
			);

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
				// Normalize userId for comparison
				let normalizedUserId = userId.replace('@s.whatsapp.net', '@c.us').replace('@lid', '');

				// Check multiple possible ID fields
				const phoneId = p.jid || p.id || p.phoneNumber;
				const formattedId = phoneId?.replace('@s.whatsapp.net', '@c.us').replace('@lid', '');

				// Extract just the number part if it contains @
				const userIdNumber = normalizedUserId.split('@')[0];
				const participantNumber = formattedId?.split('@')[0] || phoneId?.split('@')[0];

				return (
					formattedId === normalizedUserId ||
					p.id === normalizedUserId ||
					phoneId === normalizedUserId ||
					userIdNumber === participantNumber ||
					p.phoneNumber === userId ||
					p.phoneNumber?.includes(userIdNumber)
				);
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
		// Waha API format: admin field can be "admin", "superadmin", or null
		if (user.admin === 'admin' || user.admin === 'superadmin') {
			return true;
		}

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
