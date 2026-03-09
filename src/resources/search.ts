import type { HttpClient } from '../http.js';
import type {
  Tweet,
  User,
  PaginatedResponse,
  ApiResponse,
  SearchTweetsParams,
  SearchUsersParams,
  StreamEvent,
} from '../types.js';

export class SearchResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Search for tweets.
   */
  async tweets(params: SearchTweetsParams): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'POST',
      path: '/search',
      body: buildSearchBody(params),
    });
  }

  /**
   * Search for users.
   */
  async users(params: SearchUsersParams): Promise<ApiResponse<User[]>> {
    return this.http.request<User[]>({
      method: 'POST',
      path: '/search/users',
      body: { query: params.query, count: params.count },
    });
  }

  /**
   * Stream search results via SSE. Returns an EventSource-like object.
   *
   * Usage:
   * ```ts
   * const stream = client.search.stream({ query: 'bitcoin', count: 500 });
   * stream.on('tweet', (tweet) => console.log(tweet));
   * stream.on('done', (meta) => console.log('finished', meta));
   * stream.on('error', (err) => console.error(err));
   * ```
   */
  stream(params: Omit<SearchTweetsParams, 'stream' | 'cursor'>): SearchStream {
    return new SearchStream(this.http, params);
  }
}

function buildSearchBody(params: SearchTweetsParams): Record<string, unknown> {
  const body: Record<string, unknown> = { query: params.query };
  if (params.count !== undefined) body.count = params.count;
  if (params.sort !== undefined) body.sort = params.sort;
  if (params.cursor !== undefined) body.cursor = params.cursor;
  if (params.lang !== undefined) body.lang = params.lang;
  if (params.min_likes !== undefined) body.min_likes = params.min_likes;
  if (params.min_retweets !== undefined) body.min_retweets = params.min_retweets;
  if (params.exclude_replies !== undefined) body.exclude_replies = params.exclude_replies;
  if (params.exclude_retweets !== undefined) body.exclude_retweets = params.exclude_retweets;
  if (params.since !== undefined) body.since = params.since;
  if (params.until !== undefined) body.until = params.until;
  if (params.stream !== undefined) body.stream = params.stream;
  return body;
}

// ─── SSE Search Stream ──────────────────────────────────────────

type StreamCallback<T> = (data: T) => void;

type SearchStreamEvent = StreamEvent | 'done';

interface StreamListeners {
  tweet: StreamCallback<Tweet>[];
  done: StreamCallback<Record<string, unknown>>[];
  error: StreamCallback<Error>[];
}

/**
 * SSE stream wrapper for search results.
 * Connects to the search endpoint with stream=true and emits events.
 */
export class SearchStream {
  private listeners: StreamListeners = { tweet: [], done: [], error: [] };
  private abortController: AbortController;
  private started = false;

  constructor(
    private readonly http: HttpClient,
    private readonly params: Omit<SearchTweetsParams, 'stream' | 'cursor'>
  ) {
    this.abortController = new AbortController();
    // Auto-start on next tick so listeners can be attached
    queueMicrotask(() => this.start());
  }

  /**
   * Register an event listener.
   */
  on(event: 'tweet', callback: StreamCallback<Tweet>): this;
  on(event: 'done', callback: StreamCallback<Record<string, unknown>>): this;
  on(event: 'error', callback: StreamCallback<Error>): this;
  on(event: SearchStreamEvent, callback: StreamCallback<any>): this {
    const key = event as keyof StreamListeners;
    if (this.listeners[key]) {
      (this.listeners[key] as StreamCallback<unknown>[]).push(callback);
    }
    return this;
  }

  /**
   * Remove an event listener.
   */
  off(event: 'tweet', callback: StreamCallback<Tweet>): this;
  off(event: 'done', callback: StreamCallback<Record<string, unknown>>): this;
  off(event: 'error', callback: StreamCallback<Error>): this;
  off(event: SearchStreamEvent, callback: StreamCallback<any>): this {
    const key = event as keyof StreamListeners;
    if (this.listeners[key]) {
      const arr = this.listeners[key] as StreamCallback<unknown>[];
      const idx = arr.indexOf(callback);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return this;
  }

  /**
   * Abort the stream.
   */
  close(): void {
    this.abortController.abort();
  }

  private async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    try {
      const body = buildSearchBody({ ...this.params, stream: true });
      const response = await this.http.requestRaw({
        method: 'POST',
        path: '/search',
        body,
        signal: this.abortController.signal,
      });

      if (!response.body) {
        this.emit('error', new Error('No response body for stream'));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            this.processSSELine(line);
          }
        }
      } catch (readErr) {
        // If aborted by .close(), swallow the error
        if (this.abortController.signal.aborted) return;
        throw readErr;
      }

      // Process remaining buffer
      if (buffer.trim()) {
        this.processSSELine(buffer);
      }
    } catch (err) {
      if (!this.abortController.signal.aborted) {
        this.emit('error', err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  private processSSELine(line: string): void {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) return;

    if (trimmed.startsWith('data: ')) {
      const jsonStr = trimmed.slice(6);
      try {
        const parsed = JSON.parse(jsonStr);

        if (parsed.type === 'tweet' && parsed.data) {
          this.emit('tweet', parsed.data as Tweet);
        } else if (parsed.type === 'done') {
          this.emit('done', (parsed.meta ?? parsed) as Record<string, unknown>);
        } else if (parsed.type === 'error') {
          this.emit('error', new Error(parsed.error ?? 'Stream error'));
        } else if (parsed.data && !parsed.type) {
          // Single tweet object without type wrapper
          this.emit('tweet', parsed.data as Tweet);
        }
      } catch {
        // Ignore malformed JSON lines
      }
    }
  }

  private emit(event: 'tweet', data: Tweet): void;
  private emit(event: 'done', data: Record<string, unknown>): void;
  private emit(event: 'error', data: Error): void;
  private emit(event: string, data: unknown): void {
    const key = event as keyof StreamListeners;
    const callbacks = this.listeners[key];
    if (callbacks) {
      for (const cb of callbacks) {
        (cb as StreamCallback<unknown>)(data);
      }
    }
  }
}
