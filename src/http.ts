import {
  XCropError,
  AuthError,
  RateLimitError,
  NotFoundError,
  ForbiddenError,
} from './errors.js';
import type { ApiResponse, PaginatedResponse, RequestOptions, XCropOptions } from './types.js';

const DEFAULT_BASE_URL = 'https://xcrop.io/api/v2';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

/** SDK version — single source of truth */
export const SDK_VERSION = '1.0.0';
const USER_AGENT = `@xcrop/sdk/${SDK_VERSION}`;

/**
 * Low-level HTTP client with automatic retry, backoff, and error mapping.
 */
export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(options: XCropOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  /**
   * Execute a request with automatic retry on 429 and 5xx errors.
   * Returns the parsed JSON response with proper typing for both
   * single-item and paginated responses.
   */
  async request<T>(options: RequestOptions): Promise<ApiResponse<T>>;
  async request<T>(options: RequestOptions): Promise<PaginatedResponse<T>>;
  async request<T>(options: RequestOptions): Promise<ApiResponse<T> | PaginatedResponse<T>> {
    const { method, path, query, body, noRetry, signal } = options;

    const url = this.buildUrl(path, query);
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    };

    const maxAttempts = noRetry ? 1 : this.maxRetries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        // If an external signal is provided, link it
        if (signal) {
          if (signal.aborted) {
            clearTimeout(timeoutId);
            throw new XCropError('Request aborted', 0, 'ABORTED');
          }
          signal.addEventListener('abort', () => controller.abort(), { once: true });
        }

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseHeaders = extractHeaders(response.headers);

        if (response.ok) {
          const json = await response.json();
          return json as ApiResponse<T>;
        }

        // Parse error body
        let errorBody: { error?: string; code?: string } = {};
        try {
          errorBody = await response.json();
        } catch {
          // ignore parse errors
        }

        const errorMessage = errorBody.error ?? `HTTP ${response.status}`;
        const errorCode = errorBody.code ?? `HTTP_${response.status}`;

        // Non-retryable errors
        if (response.status === 401) {
          throw new AuthError(errorMessage, responseHeaders);
        }
        if (response.status === 403) {
          throw new ForbiddenError(errorMessage, responseHeaders);
        }
        if (response.status === 404) {
          throw new NotFoundError(errorMessage, responseHeaders);
        }

        // Retryable: 429 rate limit
        if (response.status === 429) {
          if (attempt < maxAttempts - 1) {
            const retryAfter = parseInt(responseHeaders['retry-after'] || '', 10);
            const delay = retryAfter > 0
              ? retryAfter * 1000
              : backoffDelay(attempt);
            await sleep(delay);
            continue;
          }
          throw new RateLimitError(errorMessage, responseHeaders);
        }

        // Retryable: 5xx server errors
        if (response.status >= 500) {
          if (attempt < maxAttempts - 1) {
            await sleep(backoffDelay(attempt));
            continue;
          }
          throw new XCropError(errorMessage, response.status, errorCode, responseHeaders);
        }

        // Other 4xx — not retryable
        throw new XCropError(errorMessage, response.status, errorCode, responseHeaders);
      } catch (err) {
        if (err instanceof XCropError) throw err;

        // Abort / timeout
        if (err instanceof DOMException && err.name === 'AbortError') {
          if (attempt < maxAttempts - 1) {
            await sleep(backoffDelay(attempt));
            continue;
          }
          throw new XCropError(
            `Request timed out after ${this.timeout}ms`,
            0,
            'TIMEOUT'
          );
        }

        // Network errors — retry
        if (attempt < maxAttempts - 1) {
          await sleep(backoffDelay(attempt));
          continue;
        }

        throw new XCropError(
          (err as Error).message ?? 'Network error',
          0,
          'NETWORK_ERROR'
        );
      }
    }

    // Should never reach here
    throw new XCropError('Max retries exceeded', 0, 'MAX_RETRIES');
  }

  /**
   * Execute a request and return a raw Response for streaming.
   * Includes retry logic for 429/5xx (same as request()).
   * Timeout only applies to the initial connection, not to the stream body.
   */
  async requestRaw(options: RequestOptions): Promise<Response> {
    const { method, path, query, body, signal: externalSignal } = options;
    const url = this.buildUrl(path, query);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      'Accept': 'text/event-stream',
    };

    const maxAttempts = this.maxRetries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // For streaming: only timeout the initial connection, not the full stream
        const connectController = new AbortController();
        const connectTimeout = setTimeout(() => connectController.abort(), this.timeout);

        // Link external signal (for .close() cancellation)
        if (externalSignal) {
          if (externalSignal.aborted) {
            clearTimeout(connectTimeout);
            throw new XCropError('Request aborted', 0, 'ABORTED');
          }
          externalSignal.addEventListener('abort', () => connectController.abort(), { once: true });
        }

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: connectController.signal,
        });

        // Connection established — clear the connect timeout
        // The stream can now read for as long as needed
        clearTimeout(connectTimeout);

        if (response.ok) {
          return response;
        }

        const responseHeaders = extractHeaders(response.headers);
        let errorBody: { error?: string; code?: string } = {};
        try {
          errorBody = await response.json();
        } catch {
          // ignore
        }
        const msg = errorBody.error ?? `HTTP ${response.status}`;

        // Non-retryable
        if (response.status === 401) throw new AuthError(msg, responseHeaders);
        if (response.status === 403) throw new ForbiddenError(msg, responseHeaders);
        if (response.status === 404) throw new NotFoundError(msg, responseHeaders);

        // Retryable: 429
        if (response.status === 429) {
          if (attempt < maxAttempts - 1) {
            const retryAfter = parseInt(responseHeaders['retry-after'] || '', 10);
            const delay = retryAfter > 0 ? retryAfter * 1000 : backoffDelay(attempt);
            await sleep(delay);
            continue;
          }
          throw new RateLimitError(msg, responseHeaders);
        }

        // Retryable: 5xx
        if (response.status >= 500) {
          if (attempt < maxAttempts - 1) {
            await sleep(backoffDelay(attempt));
            continue;
          }
        }

        throw new XCropError(msg, response.status, errorBody.code ?? 'ERROR', responseHeaders);
      } catch (err) {
        if (err instanceof XCropError) throw err;

        if (err instanceof DOMException && err.name === 'AbortError') {
          // Check if it was an external abort (user called .close())
          if (externalSignal?.aborted) {
            throw new XCropError('Request aborted', 0, 'ABORTED');
          }
          if (attempt < maxAttempts - 1) {
            await sleep(backoffDelay(attempt));
            continue;
          }
          throw new XCropError(
            `Request timed out after ${this.timeout}ms`,
            0,
            'TIMEOUT'
          );
        }

        if (attempt < maxAttempts - 1) {
          await sleep(backoffDelay(attempt));
          continue;
        }

        throw new XCropError(
          (err as Error).message ?? 'Network error',
          0,
          'NETWORK_ERROR'
        );
      }
    }

    throw new XCropError('Max retries exceeded', 0, 'MAX_RETRIES');
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
}

function extractHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

function backoffDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s + jitter
  const base = Math.min(1000 * Math.pow(2, attempt), 10_000);
  const jitter = Math.random() * 500;
  return base + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
