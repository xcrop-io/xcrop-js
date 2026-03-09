import type { HttpClient } from '../http.js';
import type { Tweet, StreamEvent } from '../types.js';

type StreamCallback<T> = (data: T) => void;

type RealtimeEvent = StreamEvent | 'close';

interface RealtimeStreamListeners {
  tweet: StreamCallback<Tweet>[];
  error: StreamCallback<Error>[];
  close: StreamCallback<void>[];
}

/**
 * Real-time SSE stream from the /stream endpoint.
 *
 * Usage:
 * ```ts
 * const stream = client.stream.connect();
 * stream.on('tweet', (tweet) => console.log(tweet));
 * stream.on('error', (err) => console.error(err));
 * // Later:
 * stream.close();
 * ```
 */
export class RealtimeStream {
  private listeners: RealtimeStreamListeners = { tweet: [], error: [], close: [] };
  private abortController: AbortController;
  private started = false;

  constructor(private readonly http: HttpClient) {
    this.abortController = new AbortController();
    queueMicrotask(() => this.start());
  }

  on(event: 'tweet', callback: StreamCallback<Tweet>): this;
  on(event: 'error', callback: StreamCallback<Error>): this;
  on(event: 'close', callback: StreamCallback<void>): this;
  on(event: RealtimeEvent, callback: StreamCallback<any>): this {
    const key = event as keyof RealtimeStreamListeners;
    if (this.listeners[key]) {
      (this.listeners[key] as StreamCallback<unknown>[]).push(callback);
    }
    return this;
  }

  /**
   * Remove an event listener.
   */
  off(event: 'tweet', callback: StreamCallback<Tweet>): this;
  off(event: 'error', callback: StreamCallback<Error>): this;
  off(event: 'close', callback: StreamCallback<void>): this;
  off(event: RealtimeEvent, callback: StreamCallback<any>): this {
    const key = event as keyof RealtimeStreamListeners;
    if (this.listeners[key]) {
      const arr = this.listeners[key] as StreamCallback<unknown>[];
      const idx = arr.indexOf(callback);
      if (idx !== -1) arr.splice(idx, 1);
    }
    return this;
  }

  close(): void {
    this.abortController.abort();
    this.emit('close', undefined as unknown as void);
  }

  private async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    try {
      const response = await this.http.requestRaw({
        method: 'GET',
        path: '/stream',
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
            this.processLine(line.trim());
          }
        }
      } catch (readErr) {
        // If aborted by .close(), swallow the error
        if (this.abortController.signal.aborted) return;
        throw readErr;
      }
    } catch (err) {
      if (!this.abortController.signal.aborted) {
        this.emit('error', err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  private processLine(line: string): void {
    if (!line || line.startsWith(':')) return;

    if (line.startsWith('data: ')) {
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.data) {
          this.emit('tweet', parsed.data as Tweet);
        }
      } catch {
        // ignore
      }
    }
  }

  private emit(event: 'tweet', data: Tweet): void;
  private emit(event: 'error', data: Error): void;
  private emit(event: 'close', data: void): void;
  private emit(event: string, data: unknown): void {
    const key = event as keyof RealtimeStreamListeners;
    const callbacks = this.listeners[key];
    if (callbacks) {
      for (const cb of callbacks) {
        (cb as StreamCallback<unknown>)(data);
      }
    }
  }
}

export class StreamResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Connect to the real-time SSE stream.
   */
  connect(): RealtimeStream {
    return new RealtimeStream(this.http);
  }
}
