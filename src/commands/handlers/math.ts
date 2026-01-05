/**
 * /math Command Handler
 * Supports: /math, /math easy, /math medium, /math hard
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { generateMathQuestions, type MathDifficulty } from '../../functions/math-quiz';
import {
	startQuiz,
	getActiveQuiz,
	isOnCooldown,
	getRemainingCooldown,
	cleanupExpiredQuizzes,
} from './math-quiz-manager';

// Cleanup expired quizzes periodically
setInterval(cleanupExpiredQuizzes, 60 * 1000); // Every minute

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, text, replyTo } = context;

	// Cleanup expired quizzes
	cleanupExpiredQuizzes();

	// Parse difficulty from command
	let difficulty: MathDifficulty = 'medium';

	if (text) {
		const lowerText = text.toLowerCase();
		if (lowerText.includes('easy') || lowerText.includes('mudah')) {
			difficulty = 'easy';
		} else if (lowerText.includes('medium') || lowerText.includes('sedang')) {
			difficulty = 'medium';
		} else if (lowerText.includes('hard') || lowerText.includes('sulit')) {
			difficulty = 'hard';
		}
	}

	// Check if there's already an active quiz
	const existingQuiz = getActiveQuiz(chatId);
	if (existingQuiz) {
		await client.sendText({
			chatId,
			text: '⚠️ Masih ada kuis yang aktif! Selesaikan kuis terlebih dahulu.',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'quiz already active' }), { status: 200 });
	}

	// Check cooldown
	if (isOnCooldown(chatId)) {
		const remainingMinutes = Math.ceil(getRemainingCooldown(chatId) / 60);
		await client.sendText({
			chatId,
			text: `⏳ Cooldown! Tunggu ${remainingMinutes} menit lagi sebelum bisa kuis lagi.`,
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'on cooldown' }), { status: 200 });
	}

	// Generate questions (3 questions for the quiz)
	const questions = generateMathQuestions(3, difficulty);

	// Start quiz
	const startResult = startQuiz(chatId, questions, difficulty);

	if (!startResult.success) {
		await client.sendText({
			chatId,
			text: startResult.message || 'Gagal memulai kuis.',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'failed to start quiz' }), { status: 200 });
	}

	// Send the first question as an interactive list
	const question = questions[0];
	const difficultyEmoji = difficulty === 'easy' ? '😊' : difficulty === 'medium' ? '🤔' : '🔥';
	const difficultyLabel = difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Sulit';

	// Create list sections
	const sections = [
		{
			title: `🧮 Soal 1: ${question.question}`,
			rows: question.options.map((option, index) => ({
				title: `${String.fromCharCode(65 + index)}. ${option}`,
				rowId: `math_q1_a${index}`,
				description: `Pilih jawaban ${String.fromCharCode(65 + index)}`,
			})),
		},
	];

	await client.sendList({
		chatId,
		title: `🧮 Kuis Matematika - ${difficultyLabel} ${difficultyEmoji}`,
		description: `Pilih jawaban yang benar dari soal berikut:\n\n📝 Total soal: 3\n⏰ Waktu: 5 menit`,
		button: '📝 Pilih Jawaban',
		sections,
		reply_to: replyTo,
	});

	return new Response(JSON.stringify({ status: 'math quiz sent', difficulty }), { status: 200 });
};

export default handler;
