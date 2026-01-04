/**
 * Handle group join events
 * Uses D1 database and current schema
 */

import * as queries from '../../db/queries';

export async function handleJoinGroupEvent(event: any, env: any) {
	// Robustly extract group info from event
	const groupData = event?.payload?.group;
	if (!groupData) {
		console.error('No group data in event:', event);
		return;
	}
	const id = groupData.id;
	const subject = groupData.subject;
	const participants = Array.isArray(groupData.participants) ? groupData.participants : [];
	if (!id || !subject || participants.length === 0) {
		console.error('Missing id, subject, or participants:', { id, subject, participants });
		return;
	}

	console.log(`Handling join group event for group ID: ${id}, subject: ${subject}, participants count: ${participants.length}`);

	const db = queries.getDb(env);
	try {
		// Extract admins and members from participants
		const admins: string[] = [];
		const members: string[] = [];

		for (const p of participants) {
			if (!p?.id) continue;

			// Convert to phone number format
			// Use pn field if available (already in @c.us format), otherwise normalize id
			const rawId = p.pn || p.id;
			const phone = rawId
				.replace('@s.whatsapp.net', '')
				.replace('@c.us', '')
				.replace('@lid', '');

			// Check role - according to Swagger spec: "left" | "participant" | "admin" | "superadmin"
			// Default to "participant" if role is undefined
			const role = p.role?.toLowerCase() || 'participant';
			const isAdminRole = role === 'admin' || role === 'superadmin';

			if (isAdminRole) {
				admins.push(phone);
			}
			members.push(phone);
		}

		// Find owner (first admin usually)
		const ownerPhone = admins.length > 0 ? admins[0] : members[0];

		// Upsert group with participants
		await queries.upsertGroup(db, {
			id,
			name: subject,
			ownerPhone,
			admin: admins,
			member: members,
		});

		console.log(`Successfully synced group ${id} with ${admins.length} admins and ${members.length} members`);
	} catch (err) {
		console.error('Failed to handle join group event:', err);
	}
}
