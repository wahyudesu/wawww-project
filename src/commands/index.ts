/**
 * Command Registry & Router
 * Centralized command registration and routing
 */

import type { WahaChatClient } from '../functions/lib/chatting';

export interface CommandContext {
	chatId: string;
	replyTo: string;
	participant?: string;
	text?: string;
	env?: any;
}

export interface CommandHandler {
	(client: WahaChatClient, context: CommandContext): Promise<Response>;
}

export interface CommandDefinition {
	handler: CommandHandler;
	adminOnly?: boolean;
	groupOnly?: boolean;
	description?: string;
}

// Command registry
const commands = new Map<string, CommandDefinition>();

export function registerCommand(command: string, definition: CommandDefinition) {
	commands.set(command, definition);
}

export function getCommand(command: string): CommandDefinition | undefined {
	return commands.get(command);
}

export function getAllCommands(): Map<string, CommandDefinition> {
	return commands;
}

/**
 * Parse command from message text
 * Returns [command, args] tuple
 */
export function parseCommand(text: string): [string, string] | null {
	if (!text.startsWith('/')) return null;

	const parts = text.split(' ');
	const command = parts[0];
	const args = text.slice(command.length).trim();

	return [command, args];
}
