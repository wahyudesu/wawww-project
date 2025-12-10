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
	let participants = await getGroupParticipants(baseUrl, session, chatId, apiKey);

	// Filter out specific numbers globally (originally for group: 120363144655427837@g.us)
	participants = participants.filter((id: string) => {
		const phoneNumber = id.replace('@c.us', '').replace('@s.whatsapp.net', '');
		return phoneNumber !== '6285655268926' && phoneNumber !== '6282147200531' && phoneNumber !== '6281230701259' && phoneNumber !== '628885553273' && phoneNumber !== '6281326966110';
	});

	// Buat mention text dengan format @[nomor]
	let mentionText = participants
		.map((id: string) => {
			const phoneNumber = id.replace('@c.us', '').replace('@s.whatsapp.net', '').trim();
			return `@${phoneNumber}`;
		})
		.join(' ');

	// Hapus semua "@lid" dari text sebelum dikirim
	// "@lid" muncul karena format mention WhatsApp, tapi kita hapus sebelum kirim
	mentionText = mentionText.replace(/@lid/gi, '').trim();
	// Hapus spasi ganda yang mungkin muncul setelah menghapus @lid
	mentionText = mentionText.replace(/\s+/g, ' ');

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
			text: mentionText,
			session: session,
			mentions: participants,
		}),
	});
	const result = await response.json();
	return result;
}
