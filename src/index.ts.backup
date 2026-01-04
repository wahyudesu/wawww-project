import { getWorkerEnv, PersonalIds } from './config/env';
import {
	mentionAll,
	basicCommands,
	checkToxic,
	getToxicWarning,
	handleDevInfoLegacy,
	handleBitcoinCommandLegacy,
	handleMathQuizCommandLegacy,
	handleKickCommandLegacy,
	handleAddCommandLegacy,
	generateMathQuestions,
	formatMathQuiz,
	checkMathAnswers,
	isAdmin,
	kickMember,
	addMember,
	closeGroup,
	openGroup,
} from './functions';
import pantunList from './data/pantun.json';
import doaHarianList from './data/doaharian.json';

// import assignmentCron from './cron/assignment-cron';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { handleJoinGroupEvent } from './functions/lib/in-group';

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
			if (data.event === 'group.v2.participants') {
				const groupPayload = data.payload;
				if (groupPayload.type === 'join' && groupPayload.group && groupPayload.participants) {
					const groupId = groupPayload.group.id;
					const joinedParticipants = groupPayload.participants;

					for (const participant of joinedParticipants) {
						const participantId = participant.id;
						const welcomeMessage = `👋 Selamat datang @${participantId.replace('@c.us', '')}!\n\nSemoga betah dan aktif ya! 😊`;

						try {
							await fetch(baseUrl + '/api/sendText', {
								method: 'POST',
								headers: {
									accept: 'application/json',
									'Content-Type': 'application/json',
									'X-Api-Key': APIkey,
								},
								body: JSON.stringify({
									chatId: groupId,
									text: welcomeMessage,
									session: session,
									mentions: [participantId],
								}),
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
					const db = env.DB;
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
					const pantunText = pantun.map((bait) => bait.join('\n')).join('\n\n');

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
					await fetch(baseUrl + '/api/sendText', {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'Content-Type': 'application/json',
							'X-Api-Key': APIkey,
						},
						body: JSON.stringify({
							chatId: chatId,
							header: 'How are you?',
							body: 'Tell us how are you please 🙏',
							footer: 'If you have any questions, please send it in the chat',
							buttons: [
								{
									type: 'reply',
									text: 'I am good!',
								},
								{
									type: 'call',
									text: 'Call us',
									phoneNumber: '+1234567890',
								},
								{
									type: 'copy',
									text: 'Copy code',
									copyCode: '4321',
								},
								{
									type: 'url',
									text: 'How did you do that?',
									url: 'https://waha.devlike.pro',
								},
							],
							reply_to: reply_to,
							session: session,
						}),
					});
					return new Response(JSON.stringify({ status: 'button sent' }), {
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
					await handleBitcoinCommandLegacy(baseUrl, session, APIkey, chatId, reply_to);
					return new Response(JSON.stringify({ status: 'bitcoin sent' }), {
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
					await handleMathQuizCommandLegacy(baseUrl, session, APIkey, chatId, reply_to, 3);
					return new Response(JSON.stringify({ status: 'math quiz sent' }), {
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

			// Command /kick - Kick member (admin only)
			if (text?.startsWith('/kick') && chatId && reply_to && participant) {
				try {
					const targetNumber = text.replace('/kick', '').trim();
					await handleKickCommandLegacy(baseUrl, session, APIkey, chatId, participant, targetNumber, reply_to);
					return new Response(JSON.stringify({ status: 'kick command processed' }), {
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

			// Command /add - Add member (admin only)
			if (text?.startsWith('/add') && chatId && reply_to && participant) {
				try {
					const targetNumbers = text
						.replace('/add', '')
						.trim()
						.split(/[\s,]+/)
						.filter((n: string) => n);
					await handleAddCommandLegacy(baseUrl, session, APIkey, chatId, participant, targetNumbers, reply_to);
					return new Response(JSON.stringify({ status: 'add command processed' }), {
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

			// Command /closegroup - Close group (admin only)
			if (text === '/closegroup' && chatId && reply_to && participant) {
				try {
					// Check if user is admin
					const adminCheck = await isAdmin(baseUrl, session, chatId, participant, APIkey);
					if (!adminCheck) {
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
								text: '❌ Maaf, hanya admin yang bisa menggunakan perintah ini.',
								session: session,
							}),
						});
						return new Response(JSON.stringify({ status: 'access denied' }), {
							status: 200,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						});
					}

					const result = await closeGroup(baseUrl, session, chatId, APIkey);

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
							text: '🔒 Grup telah ditutup. Hanya admin yang dapat mengirim pesan.',
							session: session,
						}),
					});

					return new Response(JSON.stringify({ status: 'group closed', result }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
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
							text: `❌ Gagal menutup grup: ${e.message}`,
							session: session,
						}),
					});
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			// Command /opengroup - Open group (admin only)
			if (text === '/opengroup' && chatId && reply_to && participant) {
				try {
					// Check if user is admin
					const adminCheck = await isAdmin(baseUrl, session, chatId, participant, APIkey);
					if (!adminCheck) {
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
								text: '❌ Maaf, hanya admin yang bisa menggunakan perintah ini.',
								session: session,
							}),
						});
						return new Response(JSON.stringify({ status: 'access denied' }), {
							status: 200,
							headers: { 'Content-Type': 'application/json', ...corsHeaders },
						});
					}

					const result = await openGroup(baseUrl, session, chatId, APIkey);

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
							text: '🔓 Grup telah dibuka. Semua anggota dapat mengirim pesan.',
							session: session,
						}),
					});

					return new Response(JSON.stringify({ status: 'group opened', result }), {
						status: 200,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				} catch (e: any) {
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
							text: `❌ Gagal membuka grup: ${e.message}`,
							session: session,
						}),
					});
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			// Command /debugadmin - Check admin status (for debugging)
			if (text === '/debugadmin' && chatId && reply_to && participant) {
				try {
					// Get raw participants data to debug
					const response = await fetch(`${baseUrl}/api/${session}/groups/${chatId}/participants`, {
						method: 'GET',
						headers: {
							accept: '*/*',
							'X-Api-Key': APIkey,
						},
					});

					if (!response.ok) {
						throw new Error(`Failed to fetch participants: ${response.statusText}`);
					}

					const participantsJson = (await response.json()) as any[];

					// Find current user in participants
					const currentUser = participantsJson.find((p: any) => {
						const phoneId = p.jid || p.id;
						const formattedId = phoneId?.replace('@s.whatsapp.net', '@c.us') || '';
						const normalizedUserId = participant.replace('@s.whatsapp.net', '@c.us');
						return formattedId === normalizedUserId || p.id === normalizedUserId || phoneId === normalizedUserId;
					});

					const adminCheck = await isAdmin(baseUrl, session, chatId, participant, APIkey);

					// Create detailed debug info
					let debugInfo = `🔍 *Debug Admin Status*\n\n`;
					debugInfo += `📱 *Your ID:* ${participant}\n`;
					debugInfo += `👑 *Admin Status:* ${adminCheck ? '✅ Admin' : '❌ Not Admin'}\n`;
					debugInfo += `🏠 *Group ID:* ${chatId}\n\n`;

					if (currentUser) {
						debugInfo += `🔍 *Your User Data:*\n`;
						debugInfo += `\`\`\`\n${JSON.stringify(currentUser, null, 2)}\n\`\`\`\n\n`;

						debugInfo += `📋 *All Possible Admin Fields:*\n`;
						Object.keys(currentUser).forEach((key) => {
							const value = currentUser[key];
							const isLikelyAdmin =
								key.toLowerCase().includes('admin') ||
								key.toLowerCase().includes('role') ||
								key.toLowerCase().includes('rank') ||
								key.toLowerCase().includes('level') ||
								(typeof value === 'string' && value.toLowerCase().includes('admin'));

							debugInfo += `${isLikelyAdmin ? '👑' : '📝'} ${key}: ${JSON.stringify(value)}\n`;
						});
					} else {
						debugInfo += `❌ *User not found in participants list!*\n\n`;
						debugInfo += `👥 *All Participants:* (${participantsJson.length})\n`;
						(participantsJson as any[]).slice(0, 5).forEach((p: any, i: number) => {
							const phoneId = p.jid || p.id;
							const formattedId = phoneId?.replace('@s.whatsapp.net', '@c.us') || '';
							debugInfo += `${i + 1}. ${formattedId} - Role: ${p.role || p.rank || 'N/A'}\n`;
						});
						if ((participantsJson as any[]).length > 5) {
							debugInfo += `... and ${(participantsJson as any[]).length - 5} more\n`;
						}
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
							text: debugInfo,
							session: session,
						}),
					});

					return new Response(JSON.stringify({ status: 'debug info sent', isAdmin: adminCheck, currentUser }), {
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

			if (text === '/dev' && chatId && reply_to) {
				try {
					const result = await handleDevInfoLegacy(baseUrl, session, APIkey, chatId, reply_to);
					return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), {
						status: 500,
						headers: { 'Content-Type': 'application/json', ...corsHeaders },
					});
				}
			}

			if (data.event === 'group.v2.join') {
				await handleJoinGroupEvent(data, env);
				return new Response(JSON.stringify({ status: 'group join processed' }), {
					status: 200,
					headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
		'📋 *Umum*',
		'/tagall - Mention semua anggota grup',
		'/ai <pertanyaan> - Tanya AI tentang tugas/kuliah',
		'/pantun - Dapatkan pantun acak',
		'/doaharian - Dapatkan doa harian',
		'/bitcoin - Cek harga Bitcoin',
		'/math - Kuis matematika',
		'/dev - Info developer',
		'/help - Tampilkan bantuan ini',
		'',
		'👑 *Admin Only*',
		'/kick <nomor> - Kick member dari grup',
		'/add <nomor1,nomor2> - Tambahkan member ke grup',
		'/closegroup - Tutup grup (hanya admin yang bisa chat)',
		'/opengroup - Buka grup (semua bisa chat)',
		'/debugadmin - Cek status admin (debug)',
		'',
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
