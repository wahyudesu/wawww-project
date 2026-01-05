import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';

interface JikanAnime {
	mal_id: number;
	url: string;
	images: {
		jpg: {
			image_url: string;
			small_image_url: string;
			large_image_url: string;
		};
		webp: {
			image_url: string;
			small_image_url: string;
			large_image_url: string;
		};
	};
	title: string;
	title_english: string | null;
	title_japanese: string;
	episodes: number | null;
	status: string;
	airing: boolean;
	aired: {
		from: string | null;
		to: string | null;
		string: string;
	};
	rating: string;
	score: number | null;
	scored_by: number | null;
	rank: number | null;
	popularity: number | null;
	members: number | null;
	favorites: number | null;
	synopsis: string;
	background: string | null;
	season: string | null;
	year: number | null;
	broadcast: {
		day: string | null;
		time: string | null;
		timezone: string | null;
		string: string;
	};
	genres: Array<{
		mal_id: number;
		type: string;
		name: string;
		url: string;
	}>;
}

interface JikanResponse {
	pagination: {
		last_visible_page: number;
		has_next_page: boolean;
		current_page: number;
		items: {
			count: number;
			total: number;
			per_page: number;
		};
	};
	data: JikanAnime[];
}

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
	const { chatId, text, replyTo } = context;

	// Check if query is provided
	if (!text) {
		await client.sendText({
			chatId,
			text: '❌ Mohon masukkan nama anime yang ingin dicari.\n\nContoh: /anime Naruto',
			reply_to: replyTo,
		});
		return new Response(JSON.stringify({ status: 'error', message: 'No query provided' }), { status: 400 });
	}

	const query = text.replace('/anime', '').trim();

	try {
		// Call Jikan API to search anime
		const apiUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5&sfw=true`;
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`Jikan API error: ${response.status}`);
		}

		const data: JikanResponse = await response.json();

		if (!data.data || data.data.length === 0) {
			await client.sendText({
				chatId,
				text: `❌ Anime "${query}" tidak ditemukan.\n\nCoba gunakan kata kunci yang lebih spesifik atau judul dalam bahasa Jepang.`,
				reply_to: replyTo,
			});
			return new Response(JSON.stringify({ status: 'not found' }), { status: 404 });
		}

		// Get first result
		const anime = data.data[0];

		// Format genres
		const genreList = anime.genres.map((g) => g.name).join(', ');

		// Format additional info
		const infoParts = [
			`📺 *${anime.title}*`,
			anime.title_english ? `🇬🇧 ${anime.title_english}` : null,
			anime.title_japanese ? `🇯🇵 ${anime.title_japanese}` : null,
			'',
			'📖 *Synopsis:*',
			anime.synopsis ? anime.synopsis.substring(0, 500) + (anime.synopsis.length > 500 ? '...' : '') : 'Tidak ada synopsis',
			'',
			'📊 *Informasi:*',
			`⭐ Rating: ${anime.score ? anime.score.toFixed(2) : 'N/A'}${anime.scored_by ? ` (${anime.scored_by.toLocaleString()} users)` : ''}`,
			`📈 Rank: ${anime.rank ? `#${anime.rank}` : 'N/A'}`,
			`👥 Popularity: ${anime.popularity ? `#${anime.popularity}` : 'N/A'}`,
			`🎬 Episodes: ${anime.episodes || 'Unknown'}`,
			`📅 Status: ${anime.status}`,
			anime.season && anime.year ? `🗓️ Season: ${anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} ${anime.year}` : null,
			`📺 Aired: ${anime.aired.string}`,
			anime.rating ? `🔞 Rating: ${anime.rating}` : null,
			`🎭 Genre: ${genreList || 'N/A'}`,
			`🔗 [MyAnimeList](${anime.url})`,
		].filter((part): part is string => Boolean(part));

		const formattedInfo = infoParts.join('\n');

		// Send image first if available
		if (anime.images.jpg.image_url) {
			await client.sendImage({
				chatId,
				url: anime.images.jpg.large_image_url || anime.images.jpg.image_url,
				caption: formattedInfo,
			});
		} else {
			await client.sendText({
				chatId,
				text: formattedInfo,
				reply_to: replyTo,
			});
		}

		return new Response(JSON.stringify({ status: 'anime info sent' }), { status: 200 });
	} catch (error) {
		console.error('Error fetching anime data:', error);

		await client.sendText({
			chatId,
			text: '❌ Terjadi kesalahan saat mencari data anime. Silakan coba lagi nanti.',
			reply_to: replyTo,
		});

		return new Response(JSON.stringify({ status: 'error', message: 'Failed to fetch anime data' }), {
			status: 500,
		});
	}
};

export default handler;
