/**
 * Group Participant Service
 * Handles participant operations (get participants, mention all)
 */

// Blacklist configuration for mention all
const MENTION_BLACKLIST = [
	'6285655268926',
	'6282147200531',
	'6281230701259',
	'628885553273',
	'6281326966110',
];

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
		const response = await fetch(`${this.baseUrl}/api/${this.session}/groups/${groupId}/participants`, {
			method: 'GET',
			headers: {
				accept: '*/*',
				'X-Api-Key': this.apiKey,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch participants: ${response.statusText}`);
		}

		const participantsJson = await response.json();
		if (!Array.isArray(participantsJson)) {
			throw new Error('Participants response is not an array');
		}

		// Extract and return phone numbers only
		return participantsJson.map((participant: any) => {
			const phoneId = participant.jid || participant.id;
			return phoneId.replace('@s.whatsapp.net', '@c.us');
		});
	}

	/**
	 * Filter participants by blacklist
	 */
	filterParticipants(participants: string[]): string[] {
		return participants.filter((id: string) => {
			const phoneNumber = id.replace('@c.us', '').replace('@s.whatsapp.net', '');
			return !MENTION_BLACKLIST.includes(phoneNumber);
		});
	}

	/**
	 * Create mention text from participants
	 */
	createMentionText(participants: string[]): string {
		let mentionText = participants
			.map((id: string) => {
				const phoneNumber = id.replace('@c.us', '').replace('@s.whatsapp.net', '').trim();
				return `@${phoneNumber}`;
			})
			.join(' ');

		// Clean up @lid artifacts
		mentionText = mentionText.replace(/@lid/gi, '').trim();
		mentionText = mentionText.replace(/\s+/g, ' ');

		return mentionText;
	}
}
