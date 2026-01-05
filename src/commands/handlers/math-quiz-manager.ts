/**
 * Math Quiz Manager
 * Manages active quizzes, cooldowns, and answer checking
 */

import type { MathQuestion, MathDifficulty } from '../../functions/math-quiz';

export interface ActiveQuiz {
	chatId: string;
	questions: MathQuestion[];
	currentQuestionIndex: number;
	difficulty: MathDifficulty;
	startTime: number;
	expiresAt: number;
	score: number; // Track correct answers
}

export interface QuizResult {
	isCorrect: boolean;
	correctAnswer: string;
	message: string;
	nextQuestion?: MathQuestion;
	quizCompleted?: boolean;
}

// In-memory storage for active quizzes
const activeQuizzes = new Map<string, ActiveQuiz>();

// Quiz cooldown storage (chatId -> last quiz end time)
const quizCooldowns = new Map<string, number>();

const QUIZ_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const QUIZ_EXPIRY_MS = 5 * 60 * 1000; // Quiz expires after 5 minutes

/**
 * Check if a group is on cooldown
 */
export function isOnCooldown(chatId: string): boolean {
	const lastQuizEnd = quizCooldowns.get(chatId);
	if (!lastQuizEnd) return false;

	const now = Date.now();
	const timeSinceLastQuiz = now - lastQuizEnd;

	return timeSinceLastQuiz < QUIZ_COOLDOWN_MS;
}

/**
 * Get remaining cooldown time in seconds
 */
export function getRemainingCooldown(chatId: string): number {
	const lastQuizEnd = quizCooldowns.get(chatId);
	if (!lastQuizEnd) return 0;

	const now = Date.now();
	const timeSinceLastQuiz = now - lastQuizEnd;
	const remaining = QUIZ_COOLDOWN_MS - timeSinceLastQuiz;

	return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Start a new quiz for a group
 */
export function startQuiz(
	chatId: string,
	questions: MathQuestion[],
	difficulty: MathDifficulty,
): { success: boolean; message?: string } {
	// Check cooldown
	if (isOnCooldown(chatId)) {
		const remainingMinutes = Math.ceil(getRemainingCooldown(chatId) / 60);
		return {
			success: false,
			message: `⏳ Cooldown! Tunggu ${remainingMinutes} menit lagi sebelum bisa kuis lagi.`,
		};
	}

	// Remove existing quiz if any
	const existingQuiz = activeQuizzes.get(chatId);
	if (existingQuiz) {
		activeQuizzes.delete(chatId);
	}

	// Create new quiz
	const quiz: ActiveQuiz = {
		chatId,
		questions,
		currentQuestionIndex: 0,
		difficulty,
		startTime: Date.now(),
		expiresAt: Date.now() + QUIZ_EXPIRY_MS,
		score: 0, // Initialize score
	};

	activeQuizzes.set(chatId, quiz);

	return { success: true };
}

/**
 * Get active quiz for a group
 */
export function getActiveQuiz(chatId: string): ActiveQuiz | undefined {
	const quiz = activeQuizzes.get(chatId);

	// Check if quiz has expired
	if (quiz && Date.now() > quiz.expiresAt) {
		activeQuizzes.delete(chatId);
		quizCooldowns.set(chatId, Date.now());
		return undefined;
	}

	return quiz;
}

/**
 * Check answer and provide feedback
 * @param chatId Group chat ID
 * @param selectedRowId Row ID from list selection (format: "math_q{questionNum}_a{answerNum}")
 */
export function checkAnswer(chatId: string, selectedRowId: string): QuizResult | null {
	const quiz = getActiveQuiz(chatId);

	if (!quiz) {
		return {
			isCorrect: false,
			correctAnswer: '',
			message: '⚠️ Tidak ada kuis aktif. Ketik /math untuk memulai kuis baru.',
		};
	}

	// Parse row ID
	// Format: "math_q1_a0" (question 1, answer 0)
	const match = selectedRowId.match(/math_q(\d+)_a(\d+)/);

	if (!match) {
		return {
			isCorrect: false,
			correctAnswer: '',
			message: '❌ Format jawaban tidak valid.',
		};
	}

	const questionNum = parseInt(match[1]) - 1; // Convert to 0-based
	const answerNum = parseInt(match[2]);

	// Validate question number
	if (questionNum !== quiz.currentQuestionIndex) {
		return {
			isCorrect: false,
			correctAnswer: '',
			message: '⚠️ Ini bukan soal yang sedang aktif.',
		};
	}

	// Get current question
	const question = quiz.questions[questionNum];
	const isCorrect = question.correctAnswer === answerNum;
	const correctAnswerText = question.options[question.correctAnswer];

	// Update score if correct
	if (isCorrect) {
		quiz.score++;
	}

	// Move to next question or end quiz
	if (quiz.currentQuestionIndex < quiz.questions.length - 1) {
		quiz.currentQuestionIndex++;
		const remainingQuestions = quiz.questions.length - quiz.currentQuestionIndex;
		const nextQuestion = quiz.questions[quiz.currentQuestionIndex];

		if (isCorrect) {
			return {
				isCorrect: true,
				correctAnswer: correctAnswerText,
				nextQuestion,
				message: `✅ Benar! ${correctAnswerText} adalah jawaban yang tepat!\n\n🎯 Soal tersisa: ${remainingQuestions}\n\nPilih jawaban untuk soal berikutnya:`,
			};
		} else {
			return {
				isCorrect: false,
				correctAnswer: correctAnswerText,
				nextQuestion,
				message: `❌ Yah, jawaban yang benar adalah: ${correctAnswerText}\n\n🎯 Soal tersisa: ${remainingQuestions}\n\nLanjut ke soal berikutnya:`,
			};
		}
	} else {
		// Quiz completed - show final score
		activeQuizzes.delete(chatId);
		quizCooldowns.set(chatId, Date.now());

		const finalScore = quiz.score;
		const totalQuestions = quiz.questions.length;
		const percentage = Math.round((finalScore / totalQuestions) * 100);

		let completionMessage = '';

		if (percentage === 100) {
			completionMessage = `🎉 SEMPURNA! Kamu menjawab semua soal dengan benar!\n\n`;
		} else if (percentage >= 66) {
			completionMessage = `👍 Bagus sekali! Kamu menjawab ${finalScore} dari ${totalQuestions} soal dengan benar!\n\n`;
		} else if (percentage >= 33) {
			completionMessage = `💪 Lumayan! Kamu menjawab ${finalScore} dari ${totalQuestions} soal dengan benar.\n\nTerus berlatih ya!\n\n`;
		} else {
			completionMessage = `📚 Kamu menjawab ${finalScore} dari ${totalQuestions} soal dengan benar.\n\nJangan menyerah! Coba lagi nanti.\n\n`;
		}

		return {
			isCorrect: isCorrect,
			correctAnswer: correctAnswerText,
			quizCompleted: true,
			message: `${completionMessage}🧮 Kuis selesai!\n\n⏰ Cooldown: 5 menit\nKetik /math untuk main lagi.`,
		};
	}
}

/**
 * Get current question for a group
 */
export function getCurrentQuestion(chatId: string): { question: MathQuestion; index: number } | null {
	const quiz = getActiveQuiz(chatId);
	if (!quiz) return null;

	return {
		question: quiz.questions[quiz.currentQuestionIndex],
		index: quiz.currentQuestionIndex,
	};
}

/**
 * Clean up expired quizzes (call periodically)
 */
export function cleanupExpiredQuizzes(): void {
	const now = Date.now();

	for (const [chatId, quiz] of activeQuizzes.entries()) {
		if (now > quiz.expiresAt) {
			activeQuizzes.delete(chatId);
			quizCooldowns.set(chatId, now);
		}
	}
}

/**
 * Get quiz statistics
 */
export function getQuizStats(chatId: string): {
	hasActiveQuiz: boolean;
	timeRemaining: number;
	currentQuestion: number;
	totalQuestions: number;
	difficulty: string;
	score: number;
} | null {
	const quiz = getActiveQuiz(chatId);

	if (!quiz) return null;

	return {
		hasActiveQuiz: true,
		timeRemaining: Math.max(0, Math.ceil((quiz.expiresAt - Date.now()) / 1000)),
		currentQuestion: quiz.currentQuestionIndex + 1,
		totalQuestions: quiz.questions.length,
		difficulty: quiz.difficulty,
		score: quiz.score,
	};
}
