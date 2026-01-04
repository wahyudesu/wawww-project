/**
 * Group Settings Service
 * Handles group settings (open/close group)
 */

export class GroupSettingsService {
	private baseUrl: string;
	private session: string;
	private apiKey: string;

	constructor(baseUrl: string, session: string, apiKey: string) {
		this.baseUrl = baseUrl;
		this.session = session;
		this.apiKey = apiKey;
	}

	/**
	 * Close group - only admins can send messages
	 */
	async closeGroup(groupId: string): Promise<any> {
		const endpoint = `${this.baseUrl}/api/${this.session}/groups/${groupId}/settings/security/messages-admin-only`;

		const response = await fetch(endpoint, {
			method: 'PUT',
			headers: {
				accept: '*/*',
				'Content-Type': 'application/json',
				'X-Api-Key': this.apiKey,
			},
			body: JSON.stringify({ adminsOnly: true }),
		});

		if (!response.ok) {
			const result = await response.json();
			throw new Error(`HTTP ${response.status}: ${response.statusText} - ${JSON.stringify(result)}`);
		}

		const result: any = await response.json();
		if (result === true || result.adminsOnly === true) {
			return { success: true, adminsOnly: true };
		} else {
			throw new Error('Failed to update group settings.');
		}
	}

	/**
	 * Open group - all members can send messages
	 */
	async openGroup(groupId: string): Promise<any> {
		const endpoint = `${this.baseUrl}/api/${this.session}/groups/${groupId}/settings/security/messages-admin-only`;

		const response = await fetch(endpoint, {
			method: 'PUT',
			headers: {
				accept: '*/*',
				'Content-Type': 'application/json',
				'X-Api-Key': this.apiKey,
			},
			body: JSON.stringify({ adminsOnly: false }),
		});

		if (!response.ok) {
			const result = await response.json();
			throw new Error(`HTTP ${response.status}: ${response.statusText} - ${JSON.stringify(result)}`);
		}

		const result: any = await response.json();
		if (result === true || result.adminsOnly === false) {
			return { success: true, adminsOnly: false };
		} else {
			throw new Error('Failed to update group settings.');
		}
	}
}
