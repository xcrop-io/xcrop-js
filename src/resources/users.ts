import type { HttpClient } from '../http.js';
import type {
  User,
  Tweet,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  UserRelationship,
} from '../types.js';

const DEFAULT_MAX_PAGES = 100;

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get a user profile by username.
   */
  async get(username: string): Promise<ApiResponse<User>> {
    return this.http.request<User>({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}`,
    });
  }

  /**
   * Get a user's tweets.
   */
  async tweets(
    username: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/tweets`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get a user's mentions.
   */
  async mentions(
    username: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/mentions`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get a user's followers.
   */
  async followers(
    username: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/followers`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get users that a user is following.
   */
  async following(
    username: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/following`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get a user's replies.
   */
  async replies(
    username: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/replies`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get a user's media tweets.
   */
  async media(
    username: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/media`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get a user's verified (blue) followers.
   */
  async verifiedFollowers(
    username: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/verified-followers`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get a user's liked tweets.
   */
  async likes(
    username: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/likes`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Batch lookup multiple users by username (max 100).
   */
  async batch(usernames: string[]): Promise<ApiResponse<User[]>> {
    return this.http.request<User[]>({
      method: 'POST',
      path: '/users/batch',
      body: { usernames },
    });
  }

  /**
   * Check follow relationship between two users.
   */
  async relationship(
    source: string,
    target: string
  ): Promise<ApiResponse<UserRelationship>> {
    return this.http.request<UserRelationship>({
      method: 'GET',
      path: '/users/relationship',
      query: { source, target },
    });
  }

  /**
   * Follow a user. Requires a connected X account.
   */
  async follow(username: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.http.request<{ success: boolean }>({
      method: 'POST',
      path: `/users/${encodeURIComponent(username)}/follow`,
    });
  }

  /**
   * Unfollow a user. Requires a connected X account.
   */
  async unfollow(username: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.http.request<{ success: boolean }>({
      method: 'DELETE',
      path: `/users/${encodeURIComponent(username)}/follow`,
    });
  }
}

// ─── Pagination Helpers ──────────────────────────────────────────

type PaginatedMethod<T> = (
  username: string,
  params: PaginationParams
) => Promise<PaginatedResponse<T>>;

/**
 * Async generator that auto-paginates a user-based paginated endpoint.
 * @param maxPages Safety limit to prevent infinite loops (default 100).
 */
export async function* paginateUser<T>(
  method: PaginatedMethod<T>,
  username: string,
  params: PaginationParams = {},
  maxPages: number = DEFAULT_MAX_PAGES
): AsyncGenerator<T, void, undefined> {
  let cursor: string | undefined = params.cursor;
  let hasNext = true;
  let page = 0;

  while (hasNext && page < maxPages) {
    const response = await method(username, { ...params, cursor });
    const items = response.data;

    for (const item of items) {
      yield item;
    }

    cursor = response.meta.cursor;
    hasNext = !!response.meta.has_next && !!cursor;
    page++;
  }
}
