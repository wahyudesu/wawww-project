/**
 * Math Quiz Handler - Interactive math quiz with list messages
 * Uses WahaChatClient for consistent messaging
 */

import { WahaChatClient, type ListSection, type ListRow } from './lib/chatting';

// ==================== TYPES ====================

export type MathDifficulty = 'easy' | 'medium' | 'hard';

export interface MathQuestion {
	question: string;
	options: string[];
	correctAnswer: number; // Index of correct answer (0-3)
}

export interface MathQuizState {
	questions: MathQuestion[];
	currentQuestion: number;
	chatId: string;
	userId: string;
}

// ==================== MATH QUIZ GENERATION ====================

/**
 * Generate random math questions with difficulty levels
 * @param count Number of questions to generate
 * @param difficulty Difficulty level: 'easy', 'medium', or 'hard'
 */
export function generateMathQuestions(count: number = 3, difficulty: MathDifficulty = 'medium'): MathQuestion[] {
	const questions: MathQuestion[] = [];
	const operations = ['+', '-', '×'];

	for (let i = 0; i < count; i++) {
		const operation = operations[Math.floor(Math.random() * operations.length)];
		let num1: number;
		let num2: number;
		let correctAnswer: number;
		let question: string;

		// Adjust number ranges based on difficulty
		switch (difficulty) {
			case 'easy':
				// Easy: Simple numbers (1-20 for +/-, 1-10 for ×)
				switch (operation) {
					case '+':
						num1 = Math.floor(Math.random() * 20) + 1;
						num2 = Math.floor(Math.random() * 20) + 1;
						correctAnswer = num1 + num2;
						question = `${num1} + ${num2} = ?`;
						break;
					case '-':
						num1 = Math.floor(Math.random() * 20) + 5;
						num2 = Math.floor(Math.random() * num1);
						correctAnswer = num1 - num2;
						question = `${num1} - ${num2} = ?`;
						break;
					case '×':
						num1 = Math.floor(Math.random() * 10) + 1;
						num2 = Math.floor(Math.random() * 10) + 1;
						correctAnswer = num1 * num2;
						question = `${num1} × ${num2} = ?`;
						break;
					default:
						num1 = Math.floor(Math.random() * 20) + 1;
						num2 = Math.floor(Math.random() * 20) + 1;
						correctAnswer = num1 + num2;
						question = `${num1} + ${num2} = ?`;
				}
				break;

			case 'medium':
				// Medium: Medium numbers (1-100 for +/-, 1-12 for ×)
				switch (operation) {
					case '+':
						num1 = Math.floor(Math.random() * 100) + 1;
						num2 = Math.floor(Math.random() * 100) + 1;
						correctAnswer = num1 + num2;
						question = `${num1} + ${num2} = ?`;
						break;
					case '-':
						num1 = Math.floor(Math.random() * 100) + 10;
						num2 = Math.floor(Math.random() * num1);
						correctAnswer = num1 - num2;
						question = `${num1} - ${num2} = ?`;
						break;
					case '×':
						num1 = Math.floor(Math.random() * 12) + 1;
						num2 = Math.floor(Math.random() * 12) + 1;
						correctAnswer = num1 * num2;
						question = `${num1} × ${num2} = ?`;
						break;
					default:
						num1 = Math.floor(Math.random() * 100) + 1;
						num2 = Math.floor(Math.random() * 100) + 1;
						correctAnswer = num1 + num2;
						question = `${num1} + ${num2} = ?`;
				}
				break;

			case 'hard':
				// Hard: Larger numbers (1-500 for +/-, 1-20 for ×) and include division
				const includeDivision = Math.random() > 0.5;

				if (includeDivision) {
					// Division: Generate clean division problems
					num2 = Math.floor(Math.random() * 12) + 2;
					correctAnswer = Math.floor(Math.random() * 20) + 1;
					num1 = num2 * correctAnswer;
					question = `${num1} ÷ ${num2} = ?`;
				} else {
					switch (operation) {
						case '+':
							num1 = Math.floor(Math.random() * 500) + 100;
							num2 = Math.floor(Math.random() * 500) + 100;
							correctAnswer = num1 + num2;
							question = `${num1} + ${num2} = ?`;
							break;
						case '-':
							num1 = Math.floor(Math.random() * 500) + 100;
							num2 = Math.floor(Math.random() * num1);
							correctAnswer = num1 - num2;
							question = `${num1} - ${num2} = ?`;
							break;
						case '×':
							num1 = Math.floor(Math.random() * 20) + 10;
							num2 = Math.floor(Math.random() * 15) + 2;
							correctAnswer = num1 * num2;
							question = `${num1} × ${num2} = ?`;
							break;
						default:
							num1 = Math.floor(Math.random() * 500) + 100;
							num2 = Math.floor(Math.random() * 500) + 100;
							correctAnswer = num1 + num2;
							question = `${num1} + ${num2} = ?`;
					}
				}
				break;

			default:
				// Default to medium
				num1 = Math.floor(Math.random() * 100) + 1;
				num2 = Math.floor(Math.random() * 100) + 1;
				correctAnswer = num1 + num2;
				question = `${num1} + ${num2} = ?`;
		}

		// Generate wrong options
		const options = [correctAnswer];

		// Generate plausible wrong answers based on difficulty
		const offsetRange = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 15 : 30;

		while (options.length < 4) {
			const offset = Math.floor(Math.random() * offsetRange * 2) - offsetRange;
			const wrongAnswer = correctAnswer + offset;
			if (wrongAnswer !== correctAnswer && wrongAnswer >= 0 && !options.includes(wrongAnswer)) {
				options.push(wrongAnswer);
			}
		}

		// Shuffle options
		const shuffledOptions = options.sort(() => Math.random() - 0.5);
		const correctIndex = shuffledOptions.indexOf(correctAnswer);

		questions.push({
			question,
			options: shuffledOptions.map(String),
			correctAnswer: correctIndex,
		});
	}

	return questions;
}

// ==================== FORMAT FUNCTIONS ====================

/**
 * Format math quiz as text message (legacy)
 * @deprecated Use handleMathQuizWithList for interactive list messages
 */
export function formatMathQuiz(questions: MathQuestion[]): string {
	const lines = ['🧮 *Kuis Matematika*\n', 'Jawab pertanyaan berikut:'];

	questions.forEach((q, index) => {
		lines.push(`\n*Soal ${index + 1}:* ${q.question}`);
		q.options.forEach((opt, i) => {
			lines.push(`${String.fromCharCode(65 + i)}. ${opt}`);
		});
	});

	lines.push('\nKetik huruf jawaban (a, b, c, d)');
	return lines.join('\n');
}

// ==================== INTERACTIVE LIST HANDLERS ====================

/**
 * Convert math question to list format
 */
function mathQuestionToListSection(question: MathQuestion, questionNumber: number): ListSection {
	const rows: ListRow[] = question.options.map((option, index) => ({
		title: `${String.fromCharCode(65 + index)}. ${option}`,
		rowId: `math_q${questionNumber}_a${index}`,
		description: `Pilih jawaban ${String.fromCharCode(65 + index)}`,
	}));

	return {
		title: `🧮 Soal ${questionNumber}: ${question.question}`,
		rows,
	};
}

/**
 * Send math quiz as interactive list message
 * @param client WahaChatClient instance
 * @param chatId Target chat ID
 * @param replyToMessageId Message ID to reply to
 * @param questions Array of math questions
 * @param difficulty Difficulty level
 */
export async function sendMathQuizAsList(
	client: WahaChatClient,
	chatId: string,
	replyToMessageId: string,
	questions: MathQuestion[],
	difficulty: MathDifficulty = 'medium',
): Promise<any> {
	// Convert questions to list sections
	const sections: ListSection[] = questions.map((q, index) => mathQuestionToListSection(q, index + 1));

	// Difficulty emoji
	const difficultyEmoji = difficulty === 'easy' ? '😊' : difficulty === 'medium' ? '🤔' : '🔥';
	const difficultyLabel = difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Sulit';

	const listMessage = await client.sendList({
		chatId,
		title: `🧮 Kuis Matematika - ${difficultyLabel} ${difficultyEmoji}`,
		description: `Pilih jawaban yang benar dari ${questions.length} soal berikut:`,
		button: '📝 Pilih Jawaban',
		sections,
		reply_to: replyToMessageId,
	});

	return listMessage;
}

/**
 * Handle /math command with interactive list
 * @param client WahaChatClient instance
 * @param chatId Target chat ID
 * @param replyToMessageId Message ID to reply to
 * @param questionCount Number of questions (default: 3)
 * @param difficulty Difficulty level (default: 'medium')
 */
export async function handleMathQuizCommand(
	client: WahaChatClient,
	chatId: string,
	replyToMessageId: string,
	questionCount: number = 3,
	difficulty: MathDifficulty = 'medium',
): Promise<void> {
	const questions = generateMathQuestions(questionCount, difficulty);

	// Send as interactive list
	await sendMathQuizAsList(client, chatId, replyToMessageId, questions, difficulty);
}

// ==================== ANSWER CHECKING ====================

/**
 * Check if answer is correct
 * @param questions Math questions
 * @param questionIndex Question number (0-based)
 * @param answerIndex Selected answer (0-based)
 */
export function checkAnswer(questions: MathQuestion[], questionIndex: number, answerIndex: number): boolean {
	if (questionIndex < 0 || questionIndex >= questions.length) {
		return false;
	}

	return questions[questionIndex].correctAnswer === answerIndex;
}

/**
 * Get correct answer index for a question
 */
export function getCorrectAnswer(questions: MathQuestion[], questionIndex: number): number {
	if (questionIndex < 0 || questionIndex >= questions.length) {
		return -1;
	}

	return questions[questionIndex].correctAnswer;
}

/**
 * Format result message
 */
export function formatResultMessage(
	questions: MathQuestion[],
	userAnswers: number[],
): string {
	let correct = 0;

	questions.forEach((q, index) => {
		if (userAnswers[index] === q.correctAnswer) {
			correct++;
		}
	});

	const score = Math.round((correct / questions.length) * 100);

	const lines = [
		'📊 *Hasil Kuis Matematika*',
		'',
		`✅ Benar: ${correct}/${questions.length}`,
		`📈 Skor: ${score}%`,
		'',
	];

	if (score === 100) {
		lines.push('🎉 Sempurna! Kamu jago matematika!');
	} else if (score >= 75) {
		lines.push('👍 Bagus sekali! Pertahankan prestasimu!');
	} else if (score >= 50) {
		lines.push('💪 Lumayan! Terus berlatih ya!');
	} else {
		lines.push('📚 Jangan menyerah! Coba lagi ya!');
	}

	return lines.join('\n');
}

// ==================== LEGACY WRAPPER ====================
/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use handleMathQuizCommand with WahaChatClient instead
 */
export async function handleMathQuizCommandLegacy(
	baseUrl: string,
	session: string,
	apiKey: string,
	chatId: string,
	replyTo: string,
	questionCount: number = 3,
) {
	const { createManualWahaConfig } = await import('../config/waha');
	const config = createManualWahaConfig(baseUrl, apiKey, session);
	const client = new WahaChatClient(config);

	return await handleMathQuizCommand(client, chatId, replyTo, questionCount);
}

// ==================== BACKWARD COMPATIBILITY ====================
/**
 * Check math answers (legacy function for backward compatibility)
 */
export function checkMathAnswers(questions: MathQuestion[], answers: string[]): {
	correct: number;
	total: number;
	details: boolean[];
} {
	const details = answers.map((answer, index) => {
		const answerIndex = answer.toUpperCase().charCodeAt(0) - 65; // Convert 'a' to 0, 'b' to 1, etc.
		return checkAnswer(questions, index, answerIndex);
	});

	const correct = details.filter(Boolean).length;

	return {
		correct,
		total: questions.length,
		details,
	};
}
