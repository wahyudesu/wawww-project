import { getWorkerEnv } from './config/env';
import { createChatClient } from './functions';
import { checkToxic, getToxicWarning } from './functions';
import { handleJoinGroupEvent } from './functions/lib/in-group';
import { handleGroupEvent, isGroupV2ParticipantsEvent, isBotRemovedEvent } from './functions/groups-handler';
import { parseCommand, getCommand } from './commands';
import { isGroupChat } from './config/waha';
import { checkAnswer } from './commands/handlers/math-quiz-manager';
import './commands/registry'; // Register all commands

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
	async fetch(request: Request, env: any): Promise<Response> {
		const url = new URL(request.url);

		// Handle preflight OPTIONS
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		// Route /event
		if (url.pathname === '/event' && request.method === 'POST') {
			return await handleEvent(request, env);
		}

		return new Response('Not found', { status: 404, headers: corsHeaders });
	},
};

async function handleListResponse(payload: any, client: any): Promise<Response> {
	const chatId = payload.from;
	const selectedRowId = payload.list?.rowId;

	if (!selectedRowId) {
		return new Response(JSON.stringify({ status: 'invalid list response' }), { status: 400, headers: corsHeaders });
	}

	// Check if this is a math quiz answer
	if (selectedRowId.startsWith('math_q')) {
		const result = checkAnswer(chatId, selectedRowId);

		if (result) {
			// Send feedback message
			await client.sendText({
				chatId,
				text: result.message,
			});

			// If there's a next question, send it as an interactive list
			if (result.nextQuestion) {
				const { getCurrentQuestion } = await import('./commands/handlers/math-quiz-manager');
				const current = getCurrentQuestion(chatId);

				if (current) {
					const questionNum = current.index + 1;
					const sections = [
						{
							title: `🧮 Soal ${questionNum}: ${result.nextQuestion.question}`,
							rows: result.nextQuestion.options.map((option: string, index: number) => ({
								title: `${String.fromCharCode(65 + index)}. ${option}`,
								rowId: `math_q${questionNum + 1}_a${index}`,
								description: `Pilih jawaban ${String.fromCharCode(65 + index)}`,
							})),
						},
					];

					await client.sendList({
						chatId,
						title: `🧮 Kuis Matematika - Soal ${questionNum}`,
						description: `Pilih jawaban yang benar:`,
						button: '📝 Pilih Jawaban',
						sections,
					});
				}
			}

			return new Response(JSON.stringify({ status: 'answer checked', isCorrect: result.isCorrect, quizCompleted: result.quizCompleted }), {
				status: 200,
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		}
	}

	return new Response(JSON.stringify({ status: 'list response received' }), { status: 200, headers: corsHeaders });
}


async function handleEvent(request: Request, env: any): Promise<Response> {
	let data: any;
	try {
		data = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
	}

	console.log('Received event:', JSON.stringify(data));

	const payload = data.payload || {};
	const chatId = payload.from;
	const text = payload.body;
	const participant = payload.participant;
	const reply_to = payload.id;

	// Create chat client
	const client = await createChatClient(env);

	// Handle list response events (for math quiz answers)
	if (data.event === 'message.upsert' && payload?.type === 'list_response') {
		return await handleListResponse(payload, client);
	}

	// Handle group join events
	if (data.event === 'group.v2.participants') {
		return await handleGroupParticipantsEvent(data, client, env);
	}

	if (data.event === 'group.v2.join') {
		await handleJoinGroupEvent(data, env);
		return new Response(JSON.stringify({ status: 'group join processed' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json', ...corsHeaders },
		});
	}

	// Check toxic messages
	if (text) {
		const toxicResult = checkToxic(text);
		if (toxicResult.isToxic) {
			await client.sendText({
				chatId,
				reply_to: reply_to,
				text: getToxicWarning(toxicResult.found),
			});
			return new Response(JSON.stringify({ status: 'toxic message blocked' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		}
	}

	// Handle commands
	if (text?.startsWith('/')) {
		return await handleCommand(text, client, { chatId, replyTo: reply_to, participant, text, env });
	}

	return new Response(JSON.stringify({ status: 'received', event: data }), { status: 200, headers: corsHeaders });
}

async function handleGroupParticipantsEvent(data: any, client: any, env: any): Promise<Response> {
	const groupPayload = data.payload;

	// Check if bot was removed from group
	if (isGroupV2ParticipantsEvent(data)) {
		const botPhoneId = data.me?.id || '';
		if (isBotRemovedEvent(data, botPhoneId)) {
			console.log('[GroupEvent] Bot was removed from group, deleting from database...');
			const result = await handleGroupEvent(data, botPhoneId, env);
			console.log('[GroupEvent] Delete result:', result);
			return new Response(JSON.stringify({ status: 'bot removed, group deleted from DB', result }), {
				status: 200,
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		}
	}

	// Handle member join (welcome messages)
	if (groupPayload.type === 'join' && groupPayload.group && groupPayload.participants) {
		const groupId = groupPayload.group.id;
		const joinedParticipants = groupPayload.participants;

		// Check if welcome is enabled in database
		const { getDb, getGroupByChatId } = await import('./db/queries');
		const db = getDb(env.DB as any);
		const group = await getGroupByChatId(db, groupId);

		// Default to welcome enabled if no settings found
		const welcomeEnabled = group?.settings?.welcome ?? true;

		if (!welcomeEnabled) {
			console.log(`Welcome is disabled for group ${groupId}`);
			return new Response(JSON.stringify({ status: 'welcome disabled' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			});
		}

		for (const participant of joinedParticipants) {
			const participantId = participant.id;
			const welcomeMessage = `👋 Selamat datang @${participantId.replace('@c.us', '')}!\n\nSemoga betah dan aktif ya! 😊`;

			try {
				await client.sendText({
					chatId: groupId,
					text: welcomeMessage,
					mentions: [participantId],
				});
			} catch (error) {
				console.error('Error sending welcome message:', error);
			}
		}

		return new Response(JSON.stringify({ status: 'welcome message sent' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json', ...corsHeaders },
		});
	}

	return new Response(JSON.stringify({ status: 'event received' }), {
		status: 200,
		headers: { 'Content-Type': 'application/json', ...corsHeaders },
	});
}

async function handleCommand(
	text: string,
	client: any,
	context: { chatId: string; replyTo: string; participant?: string; text?: string; env?: any },
): Promise<Response> {
	const parsed = parseCommand(text);

	if (!parsed) {
		return new Response(JSON.stringify({ error: 'Invalid command' }), { status: 400, headers: corsHeaders });
	}

	const [command] = parsed;
	const commandDef = getCommand(command);

	if (!commandDef) {
		return new Response(JSON.stringify({ error: 'Unknown command' }), { status: 404, headers: corsHeaders });
	}

	// Check if command is group-only
	if (commandDef.groupOnly && !isGroupChat(context.chatId)) {
		await client.sendText({
			chatId: context.chatId,
			text: '❌ Maaf, perintah ini hanya bisa digunakan di grup.',
			reply_to: context.replyTo,
		});
		return new Response(JSON.stringify({ status: 'group only command' }), { status: 200, headers: corsHeaders });
	}

	try {
		return await commandDef.handler(client, context);
	} catch (error) {
		console.error(`Error executing command ${command}:`, error);
		return new Response(
			JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
			{ status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
		);
	}
}
