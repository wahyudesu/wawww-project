/**
 * Group Member Service
 * Handles member management operations (kick, add)
 */

export class GroupMemberService {
	private baseUrl: string;
	private session: string;
	private apiKey: string;

	constructor(baseUrl: string, session: string, apiKey: string) {
		this.baseUrl = baseUrl;
		this.session = session;
		this.apiKey = apiKey;
	}

	/**
	 * Kick member from group
	 * POST /api/{session}/groups/{id}/participants/remove
	 * Body: { "participants": [{"id": "phone@c.us"}] }
	 */
	async kickMember(groupId: string, participantId: string): Promise<any> {
		const endpoint = `${this.baseUrl}/api/${this.session}/groups/${groupId}/participants/remove`;

		// Ensure participant ID has @c.us suffix
		const formattedId = participantId.includes('@') ? participantId : `${participantId}@c.us`;

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'Content-Type': 'application/json',
				'X-Api-Key': this.apiKey,
			},
			body: JSON.stringify({
				participants: [{ id: formattedId }],
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to kick member: ${response.status} ${error}`);
		}

		return await response.json();
	}

	/**
	 * Add member to group
	 * POST /api/{session}/groups/{id}/participants/add
	 * Body: { "participants": [{"id": "phone@c.us"}] }
	 */
	async addMember(groupId: string, participantIds: string[]): Promise<any> {
		const endpoint = `${this.baseUrl}/api/${this.session}/groups/${groupId}/participants/add`;

		// Format participant IDs with @c.us suffix
		const formattedIds = participantIds.map((id) =>
			id.includes('@') ? id : `${id}@c.us`
		);

		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'Content-Type': 'application/json',
				'X-Api-Key': this.apiKey,
			},
			body: JSON.stringify({
				participants: formattedIds.map((id) => ({ id })),
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Failed to add member: ${response.status} ${error}`);
		}

		return await response.json();
	}
}
