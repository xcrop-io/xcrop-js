import type { HttpClient } from '../http.js';
import type {
  User,
  Tweet,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  CheckFollowResult,
  QualifiedAccountParams,
  QualifiedAccountResult,
  QualifiedNameParams,
  QualifiedNameResult,
  FollowersIdsParams,
  FollowersIdsResponse,
  UserLookupParams,
  UserPaginationParams,
  UserListParams,
  UserMentionsParams,
  MuteResult,
  BlockResult,
} from '../types.js';

const DEFAULT_MAX_PAGES = 100;

/**
 * Path segment for a user route: the username, or `id:<user_id>` when only a numeric id was given (an empty segment
 * would hit `/users/` and never reach the user route).
 */
function userSeg(username: string, userId?: string | number): string {
  return username ? username : userId != null && String(userId) !== '' ? `id:${userId}` : username;
}

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get a user profile by username. Pass `id:<digits>` as the username (or
   * `{ user_id }`) to look a user up by numeric id.
   */
  async get(
    username: string,
    params: UserLookupParams = {}
  ): Promise<ApiResponse<User>> {
    return this.http.request<User>({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}`,
      query: { user_id: params.user_id },
    });
  }

  /**
   * Get a user's tweets.
   */
  async tweets(
    username: string,
    params: UserPaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/tweets`,
      query: { count: params.count, cursor: params.cursor, user_id: params.user_id },
    });
  }

  /**
   * Get a user's mentions.
   */
  async mentions(
    username: string,
    params: UserMentionsParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/mentions`,
      query: {
        count: params.count,
        cursor: params.cursor,
        user_id: params.user_id,
        since: params.since,
        until: params.until,
      },
    });
  }

  /**
   * Get a user's followers. With `include_unavailable: true`, suspended or
   * deactivated accounts also come back as rows `{ id, unavailable: true,
   * unavailable_reason, ...every other field null }` (not billed). Same
   * option on `following()` and `verifiedFollowers()`.
   */
  async followers(
    username: string,
    params: UserListParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/followers`,
      query: {
        count: params.count,
        cursor: params.cursor,
        user_id: params.user_id,
        include_unavailable: params.include_unavailable,
      },
    });
  }

  /**
   * Get users that a user is following.
   */
  async following(
    username: string,
    params: UserListParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/following`,
      query: {
        count: params.count,
        cursor: params.cursor,
        user_id: params.user_id,
        include_unavailable: params.include_unavailable,
      },
    });
  }

  /**
   * Get a user's replies.
   */
  async replies(
    username: string,
    params: UserPaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/replies`,
      query: { count: params.count, cursor: params.cursor, user_id: params.user_id },
    });
  }

  /**
   * Get a user's media tweets.
   */
  async media(
    username: string,
    params: UserPaginationParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/media`,
      query: { count: params.count, cursor: params.cursor, user_id: params.user_id },
    });
  }

  /**
   * Get a user's verified (blue) followers.
   */
  async verifiedFollowers(
    username: string,
    params: UserListParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/verified-followers`,
      query: {
        count: params.count,
        cursor: params.cursor,
        user_id: params.user_id,
        include_unavailable: params.include_unavailable,
      },
    });
  }

  /**
   * Get up to 5000 raw follower IDs (no profile metadata). Cheaper and
   * faster than `followers()` for large-scale ID harvesting.
   */
  async followersIds(
    username: string,
    params: FollowersIdsParams = {}
  ): Promise<FollowersIdsResponse> {
    return this.http.request<string[]>({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/followers-ids`,
      query: { count: params.count, cursor: params.cursor, user_id: params.user_id },
    }) as unknown as Promise<FollowersIdsResponse>;
  }

  /**
   * Get up to 5000 raw IDs of the accounts a user follows (no profile
   * metadata). Mirror of `followersIds()`.
   */
  async followingIds(
    username: string,
    params: FollowersIdsParams = {}
  ): Promise<FollowersIdsResponse> {
    return this.http.request<string[]>({
      method: 'GET',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/following-ids`,
      query: { count: params.count, cursor: params.cursor, user_id: params.user_id },
    }) as unknown as Promise<FollowersIdsResponse>;
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
   * Batch lookup multiple users by numeric id (max 100). Ids are sent as
   * strings; numbers above 2^53 lose precision in JavaScript, so pass those as
   * strings. Ids X does not return are listed in `meta.not_found`.
   */
  async batchByIds(ids: Array<string | number>): Promise<ApiResponse<User[]>> {
    return this.http.request<User[]>({
      method: 'POST',
      path: '/users/batch',
      body: { ids: ids.map((id) => String(id)) },
    });
  }

  /**
   * Check whether `source` follows `target` (and vice versa).
   */
  async checkFollow(
    source: string,
    target: string
  ): Promise<ApiResponse<CheckFollowResult>> {
    return this.http.request<CheckFollowResult>({
      method: 'GET',
      path: '/users/check-follow',
      query: { source, target },
    });
  }

  /**
   * Check if an account is eligible by minimum followers / account age.
   * For airdrop/giveaway gating.
   */
  async checkQualifiedAccount(
    username: string,
    params: QualifiedAccountParams = {}
  ): Promise<ApiResponse<QualifiedAccountResult>> {
    return this.http.request<QualifiedAccountResult>({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/check-qualified-account`,
      query: { min_followers: params.min_followers, min_age_days: params.min_age_days },
    });
  }

  /**
   * Check if a user's display name contains required text. For
   * airdrop/giveaway gating.
   */
  async checkQualifiedName(
    username: string,
    params: QualifiedNameParams
  ): Promise<ApiResponse<QualifiedNameResult>> {
    return this.http.request<QualifiedNameResult>({
      method: 'GET',
      path: `/users/${encodeURIComponent(username)}/check-qualified-name`,
      query: { contains: params.contains, position: params.position },
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

  /**
   * Mute a user with the connected X account (100 credits). Pass a username or
   * `id:<digits>` (or `{ user_id }`). `already` is true when already muted.
   */
  async mute(username: string, params: UserLookupParams = {}): Promise<ApiResponse<MuteResult>> {
    return this.http.request<MuteResult>({
      method: 'POST',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/mute`,
    });
  }

  /**
   * Unmute a user. Requires a connected X account.
   */
  async unmute(username: string, params: UserLookupParams = {}): Promise<ApiResponse<MuteResult>> {
    return this.http.request<MuteResult>({
      method: 'DELETE',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/mute`,
    });
  }

  /**
   * Block a user with the connected X account (100 credits). Pass a username or
   * `id:<digits>` (or `{ user_id }`).
   */
  async block(username: string, params: UserLookupParams = {}): Promise<ApiResponse<BlockResult>> {
    return this.http.request<BlockResult>({
      method: 'POST',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/block`,
    });
  }

  /**
   * Unblock a user. Requires a connected X account.
   */
  async unblock(username: string, params: UserLookupParams = {}): Promise<ApiResponse<BlockResult>> {
    return this.http.request<BlockResult>({
      method: 'DELETE',
      path: `/users/${encodeURIComponent(userSeg(username, params.user_id))}/block`,
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
