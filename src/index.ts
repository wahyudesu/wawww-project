import { getWorkerEnv, PersonalIds } from './config/env';
import {
	mentionAll,
	basicCommands,
	// handleTambahTugas,
	// handleLihatTugas,
	// handleHapusTugas,
	// handleHelp,
	checkToxic,
	getToxicWarning,
	handleDevInfo,
	generateMathQuestions,
	formatMathQuiz,
	checkMathAnswers,
} from './functions';
import pantunList from './data/pantun.json';
import doaHarianList from './data/doaharian.json';

// import assignmentCron from './cron/assignment-cron';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { handleJoinGroupEvent } from './handler/new-group';

import { generateObject } from 'ai';
import { z } from 'zod';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
	async fetch(request: Request, env: any): Promise<Response> {
		const { APIkey, baseUrl, session, openrouterKey } = await getWorkerEnv(env);
		const url = new URL(request.url);

		// Handle preflight OPTIONS
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		// Route home
		if (url.pathname === '/' && request.method === 'GET') {
			return new Response('Cloudflare Worker Webhook is ready!', { status: 200, headers: corsHeaders });
		}

		// Route /event
		if (url.pathname === '/event' && request.method === 'POST') {
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
			
			// Handle group join events
			if (data.event === "group.v2.participants") {
			  const groupPayload = data.payload;
			  if (groupPayload.type === "join" && groupPayload.group && groupPayload.participants) {
				const groupId = groupPayload.group.id;
				const joinedParticipants = groupPayload.participants;

				for (const participant of joinedParticipants) {
				  const participantId = participant.id;
				  const welcomeMessage = `👋 Selamat datang @${participantId.replace("@c.us", "")}!\n\nSemoga betah dan aktif ya! 😊`;

				  try {
					await fetch(baseUrl + "/api/sendText", {
					  method: "POST",
					  headers: {
						"accept": "application/json",
						"Content-Type": "application/json",
						"X-Api-Key": APIkey,
					  },
					  body: JSON.stringify({
						chatId: groupId,
						text: welcomeMessage,
						session: session,
						mentions: [participantId],
					  }),
					});
				  } catch (error) {
					console.error("Error sending welcome message:", error);
				  }
				}

				return new Response(JSON.stringify({ status: "welcome message sent" }), {
				  status: 200,
				  headers: { "Content-Type": "application/json", ...corsHeaders }
				});
			  }
			}

			// Deteksi toxic sebelum proses lain
			if (text) {
				const toxicResult = checkToxic(text);
				if (toxicResult.isToxic) {
					// Kirim pesan peringatan ke WhatsApp
					await fetch(baseUrl + '/api/sendText', {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json',
							'X-Api-Key': APIkey,
						},
						body: JSON.stringify({
							chatId: chatId,
							reply_to: reply_to,
							text: getToxicWarning(toxicResult.found),
							session: session,
						}),
					});
				}
			}

			if (text?.startsWith('/tagall') && chatId) {
				try {
					const mentionResult = await mentionAll(baseUrl, session, chatId, APIkey);
					return new Response(JSON.stringify({ status: 'mention sent', result: mentionResult }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			if (text === '/help' && chatId && reply_to) {
				try {
					const result = await handleHelp(baseUrl, session, APIkey, chatId, reply_to);
					return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			if (text?.startsWith('/ai') && chatId && reply_to) {
				try {
					// Ambil semua data assignments dari D1 dan jadikan context
					const db = env['db-tugas'];
					// const manager = new D1AssignmentManager(db);
					// const assignments = await manager.getAllAssignments();
					// const contextString = assignments
					// 	.map((a) => `- [${a.mata_kuliah}] ${a.deskripsi} (Deadline: ${a.deadline || '-'} | By: ${a.participant})`)
					// 	.join('\n');

					const openrouter = createOpenRouter({ apiKey: openrouterKey });
					const result = await generateObject({
						model: openrouter.chat('mistralai/mistral-small-3.2-24b-instruct:free'),
						schema: z.object({ tugas: z.string() }),
						system:
							'Kamu adalah asisten handal untuk mahasiswa' +
							'Jawab pertanyaan user dengan informasi yang relevan dari daftar tugas yang ada di database.' +
							'Jika tidak ada informasi yang relevan, berikan jawaban umum yang sesuai.' +
							'Jawab sesingkat mungkin, tidak lebih dari 50 kata',
						prompt: `Berikut adalah daftar tugas di database: Jawab pertanyaan user atau bantu sesuai konteks tugas di atas.\nPertanyaan user: ${text.replace('/ai', '').trim()}`,
					});

					// Post-process: ganti ** jadi *, hapus semua baris yang hanya berisi pagra
					let tugas = result.object.tugas
						.replace(/\*\*/g, '*') // ganti ** jadi *
						.replace(/^#+\s*/gm, ''); // hapus simbol # di awal baris (contoh: #, ##, ## )

					const apiUrl = baseUrl + '/api/sendText';
					const bodyData = {
						chatId: chatId,
						reply_to: reply_to,
						text: tugas,
						session: session,
					};

					const apiResp = await fetch(apiUrl, {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json',
							'X-Api-Key': APIkey,
						},
						body: JSON.stringify(bodyData),
					});

					const apiResult = await apiResp.text();
					return new Response(JSON.stringify({ status: 'sent', sent: bodyData, apiResult }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			// Command /pantun
			if (text === '/pantun' && chatId && reply_to) {
				try {
					// Ambil pantun acak
					const pantunArr = pantunList;
					const idx = Math.floor(Math.random() * pantunArr.length);
					const pantun = pantunArr[idx];
					// Gabungkan baris pantun
					const pantunText = pantun.map(bait => bait.join('\n')).join('\n\n');

					await fetch(baseUrl + '/api/sendText', {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json',
							'X-Api-Key': APIkey,
						},
						body: JSON.stringify({
							chatId: chatId,
							reply_to: reply_to,
							text: pantunText,
							session: session,
						}),
					});
					return new Response(JSON.stringify({ status: 'pantun sent', pantun: pantunText }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			if (text === '/button' && chatId && reply_to) {
				try {
					// Ambil pantun acak
					const pantunArr = pantunList;
					const idx = Math.floor(Math.random() * pantunArr.length);
					const pantun = pantunArr[idx];
					// Gabungkan baris pantun
					const pantunText = pantun.map(bait => bait.join('\n')).join('\n\n');

					await fetch(baseUrl + '/api/sendText', {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json',
							'X-Api-Key': APIkey,
						},
						body: JSON.stringify({
							chatId: chatId,
							header: "How are you?",
								"headerImage": {
									"mimetype": "image/jpeg",
									"filename": "filename.jpg",
									"url": "https://github.com/devlikeapro/waha/raw/core/examples/waha.jpg"
								},
							footer: "If you have any questions, please send it in the chat",
							buttons: [
								{
									"type": "reply",
									"text": "I am good!"
								},
								{
									"type": "call",
									"text": "Call us",
									"phoneNumber": "+1234567890"
								},
								{
									"type": "copy",
									"text": "Copy code",
									"copyCode": "4321"
								},
								{
									"type": "url",
									"text": "How did you do that?",
									"url": "https://waha.devlike.pro"
								}
							],
							reply_to: reply_to,
							text: pantunText,
							session: session,
						}),
					});
					return new Response(JSON.stringify({ status: 'pantun sent', pantun: pantunText }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			// Command /doaharian
			if (text === '/doaharian' && chatId && reply_to) {
				try {
					const doaArr = doaHarianList;
					const idx = Math.floor(Math.random() * doaArr.length);
					const doa = doaArr[idx];
					const doaText = `📿 *${doa.title}*\n\n${doa.arabic}\n\n_${doa.latin}_\n\n${doa.translation}`;

					await fetch(baseUrl + '/api/sendText', {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json',
							'X-Api-Key': APIkey,
						},
						body: JSON.stringify({
							chatId: chatId,
							reply_to: reply_to,
							text: doaText,
							session: session,
						}),
					});
					return new Response(JSON.stringify({ status: 'doa sent', doa: doaText }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			// Command /bitcoin
			if (text === '/bitcoin' && chatId && reply_to) {
				try {
					const resp = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
					const data: { bitcoin?: { usd?: number } } = await resp.json();
					const price = data && data.bitcoin && typeof data.bitcoin.usd === 'number' ? data.bitcoin.usd : undefined;
					let msg;
					if (price !== undefined) {
						msg = `💰 Harga Bitcoin saat ini: $${price} USD`;
					} else {
						msg = 'Gagal mengambil harga Bitcoin.';
					}
					await fetch(baseUrl + '/api/sendText', {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json',
							'X-Api-Key': APIkey,
						},
						body: JSON.stringify({
							chatId: chatId,
							reply_to: reply_to,
							text: msg,
							session: session,
						}),
					});
					return new Response(JSON.stringify({ status: 'bitcoin sent', price: price }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			// Command /math
			if (text === '/math' && chatId && reply_to) {
				try {
					const questions = generateMathQuestions(3);
					const mathQuiz = formatMathQuiz(questions);
					
					// Store questions in a simple in-memory store (ideally use database)
					const quizKey = `${chatId}_${reply_to}_math`;
					// You would store questions[quizKey] = questions in a database
					
					await fetch(baseUrl + '/api/sendText', {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json',
							'X-Api-Key': APIkey,
						},
						body: JSON.stringify({
							chatId: chatId,
							reply_to: reply_to,
							text: mathQuiz,
							session: session,
						}),
					});
					return new Response(JSON.stringify({ status: 'math quiz sent', questions: questions }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			// if (text === "/list-tugas" && chatId && reply_to && PersonalIds.includes(participant)) {
			//   try {
			//     const result = await handleLihatTugas(baseUrl, session, APIkey, chatId, reply_to, participant, env["db-tugas"]);
			//     return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
			//   } catch (e: any) {
			//     return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
			//   }
			// }

			if (text === '/dev' && chatId && reply_to) {
				try {
					const result = await handleDevInfo(baseUrl, session, APIkey, chatId, reply_to);
					return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			if (data.event === "group.v2.join") {
				await handleJoinGroupEvent(data, env);
				return new Response(JSON.stringify({ status: "group join processed" }), {
					status: 200,
					headers: { "Content-Type": "application/json", ...corsHeaders }
				});
			}

			return new Response(JSON.stringify({ status: 'received', event: data }), { status: 200, headers: corsHeaders });
		}

		return new Response('Not found', { status: 404, headers: corsHeaders });
	},

};


async function handleHelp(baseUrl: string, session: string, APIkey: string, chatId: string, reply_to: string) {
	const helpText = [
		'🤖 *Daftar Perintah Bot*',
		'',
		'/presensi - Mention semua anggota grup',
		'/malam - Kirim ucapan selamat malam (khusus admin)',
		'/pagi - Kirim ucapan selamat pagi (khusus admin)',
		'/ai <pertanyaan> - Tanya AI tentang tugas/kuliah',
		'/dev - Info developer',
		'/help - Tampilkan bantuan ini',
	].join('\n');

	const resp = await fetch(baseUrl + '/api/sendText', {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Api-Key': APIkey,
		},
		body: JSON.stringify({
			chatId,
			reply_to,
			text: helpText,
			session,
		}),
	});

	const result = await resp.json();
	return { status: 'help sent', result };
}

