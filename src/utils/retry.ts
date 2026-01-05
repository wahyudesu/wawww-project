/**
 * Retry utility functions for API calls
 * Handles rate limiting (429) and server errors (5xx) with exponential backoff
 */

/**
 * Fetch with retry logic and exponential backoff
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in ms before first retry (default: 1000)
 * @returns Promise<Response>
 */
export async function fetchWithRetry(
	url: string,
	options: RequestInit,
	maxRetries = 3,
	initialDelay = 1000,
): Promise<Response> {
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		const response = await fetch(url, options);

		// If successful or not a rate limit error, return immediately
		if (response.ok) {
			return response;
		}

		// Check if it's a rate limit error (429) or server error (5xx)
		const status = response.status;
		const isRateLimit = status === 429;
		const isServerError = status >= 500;

		if (!isRateLimit && !isServerError) {
			// For other errors (4xx except 429), don't retry
			return response;
		}

		// Calculate delay with exponential backoff
		const delay = initialDelay * Math.pow(2, attempt);

		console.warn(
			`⚠️ Fetch failed (attempt ${attempt + 1}/${maxRetries}, status: ${status}). Retrying in ${delay}ms...`,
		);

		// Wait before retrying
		await new Promise((resolve) => setTimeout(resolve, delay));
	}

	// If all retries failed, throw the last error
	throw new Error(`Failed after ${maxRetries} retries`);
}
