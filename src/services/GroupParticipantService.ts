/**
 * Group Participant Service
 * Handles participant operations (get participants, mention all)
 */

export class GroupParticipantService {
	private baseUrl: string;
	private session: string;
	private apiKey: string;

	constructor(baseUrl: string, session: string, apiKey: string) {
		this.baseUrl = baseUrl;
		this.session = session;
		this.apiKey = apiKey;
	}

	/**
	 * Get all group participants
	 */
	async getParticipants(groupId: string): Promise<string[]> {
		// Encode the groupId to handle special characters like @
		const encodedGroupId = encodeURIComponent(groupId);
		const endpoint = `${this.baseUrl}/api/${this.session}/groups/${encodedGroupId}/participants`;

		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				accept: 'application/json',
				'X-Api-Key': this.apiKey,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch participants: ${response.status}`);
		}

		const participantsJson = await response.json() as any;
		const participants = Array.isArray(participantsJson)
			? participantsJson
			: (participantsJson.participants || []);

		// Extract and return phone numbers only
		return participants.map((participant: any) => {
			const phoneId = participant.jid || participant.phoneNumber || participant.id;
			return phoneId
				.replace('@s.whatsapp.net', '@c.us')
				.replace('@lid', '@c.us')
				.trim();
		});
	}

	/**
	 * Filter participants by blacklist
	 */
	filterParticipants(participants: string[]): string[] {
		return participants; // No filtering for now
	}

	/**
	 * Create mention text from participants
	 */
	createMentionText(participants: string[]): string {
		return participants
			.map((id: string) => {
				const phoneNumber = id.replace('@c.us', '').replace('@s.whatsapp.net', '').trim();
				return `@${phoneNumber}`;
			})
			.join(' ');
	}
}
