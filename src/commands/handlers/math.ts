/**
 * /math Command Handler
 * Supports: /math, /math easy, /math medium, /math hard
 */

import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';
import { handleMathQuizCommand, type MathDifficulty } from '../../functions/math-quiz';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, text, replyTo } = context;

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

	await handleMathQuizCommand(client, chatId, replyTo, 3, difficulty);

	return new Response(JSON.stringify({ status: 'math quiz sent', difficulty }), { status: 200 });
};

export default handler;
