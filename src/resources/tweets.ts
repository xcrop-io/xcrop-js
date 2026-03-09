import type { HttpClient } from '../http.js';
import type {
  Tweet,
  User,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  CreateTweetParams,
  ReplyTweetParams,
  QuoteTweetParams,
  WriteResult,
  InteractionCheckResult,
} from '../types.js';

const DEFAULT_MAX_PAGES = 100;

export class TweetsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get a single tweet by ID.
   */
  async get(tweetId: string): Promise<ApiResponse<Tweet>> {
    return this.http.request<Tweet>({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}`,
    });
  }

  /**
   * Get the conversation thread for a tweet.
   */
  async conversation(
    tweetId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}/conversation`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get quote tweets of a tweet.
   */
  async quotes(
    tweetId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}/quotes`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get users who liked a tweet.
   */
  async likers(
    tweetId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}/likers`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get users who retweeted a tweet.
   */
  async retweeters(
    tweetId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}/retweeters`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Batch lookup multiple tweets by ID (max 100).
   */
  async batch(tweetIds: string[]): Promise<ApiResponse<Tweet[]>> {
    return this.http.request<Tweet[]>({
      method: 'POST',
      path: '/tweets/batch',
      body: { tweet_ids: tweetIds },
    });
  }

  // ─── Write Operations ────────────────────────────────────────

  /**
   * Create a new tweet. Requires a connected X account.
   */
  async create(params: CreateTweetParams): Promise<ApiResponse<WriteResult>> {
    return this.http.request<WriteResult>({
      method: 'POST',
      path: '/tweets/create',
      body: { text: params.text },
    });
  }

  /**
   * Reply to a tweet. Requires a connected X account.
   */
  async reply(params: ReplyTweetParams): Promise<ApiResponse<WriteResult>> {
    return this.http.request<WriteResult>({
      method: 'POST',
      path: '/tweets/reply',
      body: { tweet_id: params.tweet_id, text: params.text },
    });
  }

  /**
   * Quote a tweet. Requires a connected X account.
   */
  async quote(params: QuoteTweetParams): Promise<ApiResponse<WriteResult>> {
    return this.http.request<WriteResult>({
      method: 'POST',
      path: '/tweets/quote',
      body: { tweet_id: params.tweet_id, text: params.text },
    });
  }

  /**
   * Delete a tweet. Requires a connected X account.
   */
  async delete(tweetId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.http.request<{ success: boolean }>({
      method: 'DELETE',
      path: `/tweets/${encodeURIComponent(tweetId)}`,
    });
  }

  // ─── Actions ──────────────────────────────────────────────────

  /**
   * Like a tweet. Requires a connected X account.
   */
  async like(tweetId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.http.request<{ success: boolean }>({
      method: 'POST',
      path: `/tweets/${encodeURIComponent(tweetId)}/like`,
    });
  }

  /**
   * Unlike a tweet. Requires a connected X account.
   */
  async unlike(tweetId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.http.request<{ success: boolean }>({
      method: 'DELETE',
      path: `/tweets/${encodeURIComponent(tweetId)}/like`,
    });
  }

  /**
   * Retweet a tweet. Requires a connected X account.
   */
  async retweet(tweetId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.http.request<{ success: boolean }>({
      method: 'POST',
      path: `/tweets/${encodeURIComponent(tweetId)}/retweet`,
    });
  }

  /**
   * Unretweet a tweet. Requires a connected X account.
   */
  async unretweet(tweetId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.http.request<{ success: boolean }>({
      method: 'DELETE',
      path: `/tweets/${encodeURIComponent(tweetId)}/retweet`,
    });
  }

  // ─── Interaction Checks ───────────────────────────────────────

  /**
   * Check if a user liked a tweet.
   * Note: May be unavailable as X has hidden likes.
   */
  async checkLike(
    tweetId: string,
    username: string
  ): Promise<ApiResponse<InteractionCheckResult>> {
    return this.http.request<InteractionCheckResult>({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}/check-like`,
      query: { username },
    });
  }

  /**
   * Check if a user retweeted a tweet.
   */
  async checkRetweet(
    tweetId: string,
    username: string
  ): Promise<ApiResponse<InteractionCheckResult>> {
    return this.http.request<InteractionCheckResult>({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}/check-retweet`,
      query: { username },
    });
  }

  /**
   * Check if a user replied to a tweet.
   */
  async checkReply(
    tweetId: string,
    username: string
  ): Promise<ApiResponse<InteractionCheckResult>> {
    return this.http.request<InteractionCheckResult>({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}/check-reply`,
      query: { username },
    });
  }

  /**
   * Check if a user quoted a tweet.
   */
  async checkQuote(
    tweetId: string,
    username: string
  ): Promise<ApiResponse<InteractionCheckResult>> {
    return this.http.request<InteractionCheckResult>({
      method: 'GET',
      path: `/tweets/${encodeURIComponent(tweetId)}/check-quote`,
      query: { username },
    });
  }
}

// ─── Pagination Helpers ──────────────────────────────────────────

type TweetPaginatedMethod<T> = (
  id: string,
  params: PaginationParams
) => Promise<PaginatedResponse<T>>;

/**
 * Async generator that auto-paginates a tweet-based paginated endpoint.
 * @param maxPages Safety limit to prevent infinite loops (default 100).
 */
export async function* paginateTweet<T>(
  method: TweetPaginatedMethod<T>,
  id: string,
  params: PaginationParams = {},
  maxPages: number = DEFAULT_MAX_PAGES
): AsyncGenerator<T, void, undefined> {
  let cursor: string | undefined = params.cursor;
  let hasNext = true;
  let page = 0;

  while (hasNext && page < maxPages) {
    const response = await method(id, { ...params, cursor });
    const items = response.data;

    for (const item of items) {
      yield item;
    }

    cursor = response.meta.cursor;
    hasNext = !!response.meta.has_next && !!cursor;
    page++;
  }
}
