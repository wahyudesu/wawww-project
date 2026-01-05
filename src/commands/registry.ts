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
import setHandler from './handlers/set';
import linkHandler from './handlers/link';
import animeHandler from './handlers/anime';
import { pagiHandler, siangHandler, malamHandler } from './handlers/greetings';

// Register all commands
registerCommand('/help', {
	handler: helpHandler,
	groupOnly: true,
	description: 'Show all commands',
});
registerCommand('/tagall', {
	handler: tagallHandler,
	groupOnly: true,
	description: 'Mention all group members',
});
registerCommand('/pagi', {
	handler: pagiHandler,
	groupOnly: true,
	description: 'Salam pagi',
});
registerCommand('/siang', {
	handler: siangHandler,
	groupOnly: true,
	description: 'Salam siang',
});
registerCommand('/malam', {
	handler: malamHandler,
	groupOnly: true,
	description: 'Salam malam',
});
registerCommand('/pantun', {
	handler: pantunHandler,
	groupOnly: true,
	description: 'Random pantun',
});
registerCommand('/doaharian', {
	handler: doaharianHandler,
	groupOnly: true,
	description: 'Random daily prayer',
});
registerCommand('/bitcoin', {
	handler: bitcoinHandler,
	groupOnly: true,
	description: 'Check Bitcoin price',
});
registerCommand('/math', {
	handler: mathHandler,
	groupOnly: true,
	description: 'Math quiz (medium)',
});
registerCommand('/math easy', {
	handler: mathHandler,
	groupOnly: true,
	description: 'Math quiz (easy)',
});
registerCommand('/math medium', {
	handler: mathHandler,
	groupOnly: true,
	description: 'Math quiz (medium)',
});
registerCommand('/math hard', {
	handler: mathHandler,
	groupOnly: true,
	description: 'Math quiz (hard)',
});
registerCommand('/dev', {
	handler: devHandler,
	groupOnly: true,
	description: 'Developer info',
});
registerCommand('/kick', {
	handler: kickHandler,
	adminOnly: true,
	groupOnly: true,
	description: 'Kick member (admin only)',
});
registerCommand('/add', {
	handler: addHandler,
	adminOnly: true,
	groupOnly: true,
	description: 'Add member (admin only)',
});
registerCommand('/closegroup', {
	handler: closegroupHandler,
	adminOnly: true,
	groupOnly: true,
	description: 'Close group (admin only)',
});
registerCommand('/opengroup', {
	handler: opengroupHandler,
	adminOnly: true,
	groupOnly: true,
	description: 'Open group (admin only)',
});
registerCommand('/debugadmin', {
	handler: debugadminHandler,
	groupOnly: true,
	description: 'Debug admin status',
});
registerCommand('/ai', {
	handler: aiHandler,
	groupOnly: true,
	description: 'AI assistant',
});
registerCommand('/set', {
	handler: setHandler,
	adminOnly: true,
	groupOnly: true,
	description: 'Manage group settings',
});
registerCommand('/link', {
	handler: linkHandler,
	groupOnly: true,
	description: 'Download media from YouTube, TikTok, Instagram, Facebook. Rate limited: 5/hour',
});
registerCommand('/anime', {
	handler: animeHandler,
	groupOnly: true,
	description: 'Search anime information from MyAnimeList',
});
