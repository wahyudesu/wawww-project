/**
 * Media Download Service
 * Downloads media from social platforms using Cobalt API
 */

import type { MediaDownloadResult, CobaltApiResponse } from '../types';

export class MediaDownloadService {
	private cobaltApiUrl: string;

	constructor(cobaltApiUrl: string) {
		this.cobaltApiUrl = cobaltApiUrl;
	}

	/**
	 * Download media from URL
	 * Supports YouTube, TikTok, Instagram, Facebook, and more
	 */
	async downloadMedia(url: string): Promise<MediaDownloadResult | null> {
		if (!this.isSupportedUrl(url)) {
			console.log('Unsupported URL:', url);
			return null;
		}

		try {
			const response = await fetch(`${this.cobaltApiUrl}/api/json`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				body: JSON.stringify({
					url: url,
					vCodec: 'h264',
					vQuality: '720',
					aFormat: 'mp3',
				}),
			});

			if (!response.ok) {
				console.error('Cobalt API error:', response.statusText, response.status);
				return null;
			}

			const data: CobaltApiResponse = await response.json();

			return this.parseCobaltResponse(data, url);
		} catch (error) {
			console.error('Error downloading media:', error);
			return null;
		}
	}

	/**
	 * Check if URL is from a supported platform
	 */
	private isSupportedUrl(url: string): boolean {
		try {
			const parsedUrl = new URL(url);
			const hostname = parsedUrl.hostname.toLowerCase();

			// List of supported domains
			const supportedDomains = [
				'youtube.com',
				'youtu.be',
				'tiktok.com',
				'instagram.com',
				'facebook.com',
				'fb.watch',
				'x.com',
				'twitter.com',
				'reddit.com',
				'bilibili.com',
				'vimeo.com',
			];

			return supportedDomains.some((domain) => hostname.includes(domain));
		} catch {
			return false;
		}
	}

	/**
	 * Parse Cobalt API response
	 */
	private parseCobaltResponse(data: CobaltApiResponse, originalUrl: string): MediaDownloadResult | null {
		// Check if response is successful
		if (data.status === 'redirect' || data.status === 'stream') {
			if (!data.url) {
				console.error('Cobalt response missing URL');
				return null;
			}

			// Determine media type (default to video for most platforms)
			// In a real implementation, you might want to detect this from the URL or API response
			const type: 'video' | 'image' = 'video';

			return {
				type,
				url: data.url,
				filename: data.filename || this.generateFilename(originalUrl, type),
				caption: `📥 Media dari: ${originalUrl}`,
			};
		}

		console.error('Cobalt API returned error status:', data.status);
		return null;
	}

	/**
	 * Generate filename from URL
	 */
	private generateFilename(url: string, type: 'video' | 'image'): string {
		try {
			const parsedUrl = new URL(url);
			const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
			const lastPart = pathParts[pathParts.length - 1] || 'media';
			const extension = type === 'video' ? 'mp4' : 'jpg';
			return `${lastPart}.${extension}`;
		} catch {
			return type === 'video' ? 'video.mp4' : 'image.jpg';
		}
	}

	/**
	 * Get platform name from URL (for user feedback)
	 */
	getPlatformName(url: string): string {
		try {
			const parsedUrl = new URL(url);
			const hostname = parsedUrl.hostname.toLowerCase();

			if (hostname.includes('youtube') || hostname.includes('youtu.be')) return 'YouTube';
			if (hostname.includes('tiktok')) return 'TikTok';
			if (hostname.includes('instagram')) return 'Instagram';
			if (hostname.includes('facebook') || hostname.includes('fb.watch')) return 'Facebook';
			if (hostname.includes('x.com') || hostname.includes('twitter')) return 'Twitter/X';
			if (hostname.includes('reddit')) return 'Reddit';
			if (hostname.includes('bilibili')) return 'Bilibili';
			if (hostname.includes('vimeo')) return 'Vimeo';

			return 'unknown platform';
		} catch {
			return 'unknown platform';
		}
	}
}
