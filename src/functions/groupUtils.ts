// Function to fetch group participants
export async function getGroupParticipants(baseUrl: string, session: string, chatId: string, apiKey: string) {
	const response = await fetch(`${baseUrl}/api/${session}/groups/${chatId}/participants`, {
		method: 'GET',
		headers: {
			accept: '*/*',
			'X-Api-Key': apiKey,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch participants: ${response.statusText}`);
	}

	const participantsJson = await response.json();
	if (!Array.isArray(participantsJson)) {
		throw new Error('Participants response is not an array');
	}
	// Extract and return only the 'id' values, converting format
	// Use jid (real phone number) if available, fallback to id
	const participantIds = participantsJson.map((participant: any) => {
		const phoneId = participant.jid || participant.id;
		return phoneId.replace('@s.whatsapp.net', '@c.us');
	});
	return participantIds;
}

// Function to mention all group members
export async function mentionAll(baseUrl: string, session: string, chatId: string, apiKey: string) {
	const participants = await getGroupParticipants(baseUrl, session, chatId, apiKey);
	const response = await fetch(`${baseUrl}/api/sendText`, {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Api-Key': apiKey,
		},
		body: JSON.stringify({
			chatId: chatId,
			reply_to: null,
			text: participants.map((id: string) => `@${id.replace('@c.us', '')}`).join(' '),
			session: session,
			mentions: participants,
		}),
	});
	const result = await response.json();
	return result;
}
