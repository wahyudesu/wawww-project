/**
 * Command Registry
 * Central registration of all bot commands
 */

import { registerCommand } from './index';
import helpHandler from './handlers/help';
import tagallHandler from './handlers/tagall';
import pantunHandler from './handlers/pantun';
import doaharianHandler from './handlers/doaharian';
import bitcoinHandler from './handlers/bitcoin';
import mathHandler from './handlers/math';
import devHandler from './handlers/dev';
import kickHandler from './handlers/kick';
import addHandler from './handlers/add';
import closegroupHandler from './handlers/closegroup';
import opengroupHandler from './handlers/opengroup';
import debugadminHandler from './handlers/debugadmin';
import aiHandler from './handlers/ai';

// Register all commands
registerCommand('/help', { handler: helpHandler, description: 'Show all commands' });
registerCommand('/tagall', { handler: tagallHandler, description: 'Mention all group members' });
registerCommand('/pantun', { handler: pantunHandler, description: 'Random pantun' });
registerCommand('/doaharian', { handler: doaharianHandler, description: 'Random daily prayer' });
registerCommand('/bitcoin', { handler: bitcoinHandler, description: 'Check Bitcoin price' });
registerCommand('/math', { handler: mathHandler, description: 'Math quiz' });
registerCommand('/dev', { handler: devHandler, description: 'Developer info' });
registerCommand('/kick', { handler: kickHandler, adminOnly: true, description: 'Kick member (admin only)' });
registerCommand('/add', { handler: addHandler, adminOnly: true, description: 'Add member (admin only)' });
registerCommand('/closegroup', {
	handler: closegroupHandler,
	adminOnly: true,
	description: 'Close group (admin only)',
});
registerCommand('/opengroup', {
	handler: opengroupHandler,
	adminOnly: true,
	description: 'Open group (admin only)',
});
registerCommand('/debugadmin', {
	handler: debugadminHandler,
	description: 'Debug admin status',
});
registerCommand('/ai', { handler: aiHandler, description: 'AI assistant' });
