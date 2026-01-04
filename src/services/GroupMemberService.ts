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
	 */
	async kickMember(groupId: string, participantId: string): Promise<any> {
		console.log(`Attempting to kick member ${participantId} from group ${groupId}`);

		const endpoint1 = `${this.baseUrl}/api/${this.session}/groups/${groupId}/participants/${participantId}`;
		const endpoint2 = `${this.baseUrl}/api/${this.session}/groups/${groupId}/participants/remove`;

		// Try DELETE method
		try {
			const response = await fetch(endpoint1, {
				method: 'DELETE',
				headers: {
					accept: '*/*',
					'X-Api-Key': this.apiKey,
				},
			});

			if (response.ok) {
				return await response.json();
			}
		} catch (error) {
			console.log('DELETE failed, trying POST method');
		}

		// Try POST method
		try {
			const response = await fetch(endpoint2, {
				method: 'POST',
				headers: {
					accept: '*/*',
					'Content-Type': 'application/json',
					'X-Api-Key': this.apiKey,
				},
				body: JSON.stringify({
					groupId: groupId,
					participantChatId: participantId,
				}),
			});

			const result: any = await response.json();
			if (response.ok || (result && (result.success || result.removed || result.kicked))) {
				return result;
			} else {
				throw new Error(`Both DELETE and POST methods failed. Last response: ${JSON.stringify(result)}`);
			}
		} catch (error) {
			console.error('All kick methods failed:', error);
			throw error;
		}
	}

	/**
	 * Add member to group
	 */
	async addMember(groupId: string, participantIds: string[]): Promise<any> {
		console.log(`Attempting to add members ${JSON.stringify(participantIds)} to group ${groupId}`);

		const endpoint1 = `${this.baseUrl}/api/${this.session}/groups/${groupId}/participants/add`;
		const endpoint2 = `${this.baseUrl}/api/${this.session}/addParticipant`;

		// Try first endpoint
		try {
			const response = await fetch(endpoint1, {
				method: 'POST',
				headers: {
					accept: '*/*',
					'Content-Type': 'application/json',
					'X-Api-Key': this.apiKey,
				},
				body: JSON.stringify({
					participants: participantIds.map((id) => id.replace('@c.us', '')),
				}),
			});

			const result: any = await response.json();
			if (response.ok || (result && (result.success || result.added || result.addParticipant !== false))) {
				return result;
			}
		} catch (error) {
			console.log('Endpoint1 failed:', error);
		}

		// Try second endpoint
		try {
			const response = await fetch(endpoint2, {
				method: 'POST',
				headers: {
					accept: '*/*',
					'Content-Type': 'application/json',
					'X-Api-Key': this.apiKey,
				},
				body: JSON.stringify({
					groupId: groupId,
					participantChatId: participantIds[0],
				}),
			});

			const result: any = await response.json();
			if (response.ok || (result && (result.success || result.added || result.addParticipant !== false))) {
				return result;
			} else {
				throw new Error(`All add member endpoints failed. Last response: ${JSON.stringify(result)}`);
			}
		} catch (error) {
			console.error('All add methods failed:', error);
			throw error;
		}
	}
}
