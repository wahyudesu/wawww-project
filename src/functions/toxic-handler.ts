const TOXIC_WORDS = [
	'anjing',
	'babi',
	'bangsat',
	'kontol',
	'memek',
	'goblok',
	'tolol',
	'ngentot',
	'brengsek',
	'jancok',
	'jembod',
	'bajingan',
	'keparat',
	'nigger',
	// 'cok',
];

export function checkToxic(text: string): { isToxic: boolean; found: string[] } {
	const found = TOXIC_WORDS.filter((word) => text.toLowerCase().includes(word));
	return { isToxic: found.length > 0, found };
}

export function getToxicWarning(found: string[]): string {
	return `⚠️ Pesan kamu terdeteksi mengandung kata tidak pantas.\nMohon gunakan bahasa yang sopan!`;
}
