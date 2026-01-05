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
	 * Get the internal Waha ID for a participant by phone number
	 * Waha uses @lid format internally, not @c.us
	 */
	private async getParticipantInternalId(groupId: string, phoneNumber: string): Promise<string | null> {
		try {
			const response = await fetch(`${this.baseUrl}/api/${this.session}/groups/${groupId}/participants`, {
				method: 'GET',
				headers: {
					accept: '*/*',
					'X-Api-Key': this.apiKey,
				},
			});

			if (!response.ok) {
				console.error('Failed to fetch participants for ID conversion');
				return null;
			}

			const participants: any[] = await response.json();

			// Normalize phone number (remove @c.us, @s.whatsapp.net, etc)
			const normalizedPhone = phoneNumber.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '');

			// Find participant by phone number
			const participant = participants.find((p: any) => {
				const pPhone = p.phoneNumber?.replace('@s.whatsapp.net', '').replace('@c.us', '') || '';
				const pId = p.id?.replace('@lid', '') || '';
				return pPhone === normalizedPhone || pId === normalizedPhone;
			});

			return participant?.id || null;
		} catch (error) {
			console.error('Error getting participant internal ID:', error);
			return null;
		}
	}

	/**
	 * Kick member from group
	 */
	async kickMember(groupId: string, participantId: string): Promise<any> {
		console.log(`Attempting to kick member ${participantId} from group ${groupId}`);

		// Try to get internal Waha ID first
		const internalId = await this.getParticipantInternalId(groupId, participantId);
		const idToUse = internalId || participantId;

		console.log(`Using ID for kick: ${idToUse} (original: ${participantId})`);

		const endpoint1 = `${this.baseUrl}/api/${this.session}/groups/${groupId}/participants/${idToUse}`;
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
			const errorText = await response.text();
			console.log('DELETE response:', response.status, errorText);
		} catch (error) {
			console.log('DELETE failed, trying POST method');
		}

		// Try POST method with different body formats
		const bodyFormats = [
			// Format 1: Array of participant IDs
			{ participants: [idToUse] },
			// Format 2: Single participantChatId
			{ participantChatId: idToUse },
			// Format 3: With groupId
			{ groupId: groupId, participantChatId: idToUse },
			// Format 4: Using phone number format
			{ participantChatId: idToUse.replace('@lid', '@s.whatsapp.net') },
		];

		for (const bodyFormat of bodyFormats) {
			try {
				console.log(`Trying POST with body:`, JSON.stringify(bodyFormat));

				const response = await fetch(endpoint2, {
					method: 'POST',
					headers: {
						accept: '*/*',
						'Content-Type': 'application/json',
						'X-Api-Key': this.apiKey,
					},
					body: JSON.stringify(bodyFormat),
				});

				const result: any = await response.json();

				if (response.ok) {
					console.log('Kick successful:', result);
					return result;
				}

				console.log('Response not ok:', response.status, JSON.stringify(result));

				// Check if it's a success despite non-200 status
				if (result && (result.success || result.removed || result.kicked)) {
					return result;
				}
			} catch (error: any) {
				console.log(`Format failed: ${error.message}`);
			}
		}

		throw new Error('All kick methods failed');
	}

	/**
	 * Add member to group
	 */
	async addMember(groupId: string, participantIds: string[]): Promise<any> {
		console.log(`Attempting to add members ${JSON.stringify(participantIds)} to group ${groupId}`);

		// Normalize phone numbers (remove @c.us, just send numbers)
		const normalizedNumbers = participantIds.map((id) => id.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', ''));

		const endpoints = [
			`${this.baseUrl}/api/${this.session}/groups/${groupId}/participants/add`,
			`${this.baseUrl}/api/${this.session}/addParticipant`,
		];

		const bodyFormats = [
			// Format 1: Array of participant IDs (numbers only)
			{ participants: normalizedNumbers },
			// Format 2: Array with full IDs
			{ participants: normalizedNumbers.map(n => n + '@c.us') },
			// Format 3: Single participant with groupId
			{ groupId: groupId, participantChatId: normalizedNumbers[0] + '@c.us' },
			// Format 4: Phone number format
			{ groupId: groupId, participantChatId: normalizedNumbers[0] + '@s.whatsapp.net' },
			// Format 5: Just the phone number
			{ participantChatId: normalizedNumbers[0] },
		];

		for (const endpoint of endpoints) {
			for (const bodyFormat of bodyFormats) {
				try {
					console.log(`Trying ${endpoint} with body:`, JSON.stringify(bodyFormat));

					const response = await fetch(endpoint, {
						method: 'POST',
						headers: {
							accept: '*/*',
							'Content-Type': 'application/json',
							'X-Api-Key': this.apiKey,
						},
						body: JSON.stringify(bodyFormat),
					});

					const result: any = await response.json();

					if (response.ok) {
						console.log('Add successful:', result);
						return result;
					}

					console.log('Response not ok:', response.status, JSON.stringify(result));

					// Check if it's a success despite non-200 status
					if (result && (result.success || result.added || result.addParticipant !== false)) {
						return result;
					}
				} catch (error: any) {
					console.log(`Format failed: ${error.message}`);
				}
			}
		}

		throw new Error('All add methods failed');
	}
}
