// ─── Client Options ──────────────────────────────────────────────

export interface XCropOptions {
  /** API key (starts with xc_live_ or xc_test_) */
  apiKey: string;
  /** Base URL for the API. Defaults to https://xcrop.io/api/v2 */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000 */
  timeout?: number;
  /** Maximum number of retries on 429/5xx. Defaults to 3 */
  maxRetries?: number;
}

// ─── API Response Envelope ───────────────────────────────────────

export interface ApiMeta {
  latency_ms?: number;
  cached?: boolean;
  total?: number;
  cursor?: string;
  has_next?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
}

// ─── Pagination ──────────────────────────────────────────────────

export interface PaginationParams {
  count?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ApiMeta;
}

// ─── User Types ──────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  name: string;
  description?: string;
  profile_image_url?: string;
  profile_banner_url?: string;
  verified?: boolean;
  is_blue_verified?: boolean;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count?: number;
  created_at: string;
  location?: string;
  url?: string;
  pinned_tweet_id?: string;
  protected?: boolean;
  [key: string]: unknown;
}

export interface UserRelationship {
  source: string;
  target: string;
  following: boolean;
  followed_by: boolean;
  blocking?: boolean;
  muting?: boolean;
  [key: string]: unknown;
}

// ─── Tweet Types ─────────────────────────────────────────────────

export interface Tweet {
  id: string;
  text: string;
  author_id?: string;
  author?: User;
  created_at: string;
  like_count?: number;
  retweet_count?: number;
  reply_count?: number;
  quote_count?: number;
  bookmark_count?: number;
  view_count?: number;
  lang?: string;
  in_reply_to_tweet_id?: string;
  conversation_id?: string;
  quoted_tweet_id?: string;
  quoted_tweet?: Tweet;
  media?: Media[];
  urls?: UrlEntity[];
  hashtags?: string[];
  [key: string]: unknown;
}

export interface Media {
  type: string;
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
  alt_text?: string;
  [key: string]: unknown;
}

export interface UrlEntity {
  url: string;
  expanded_url: string;
  display_url: string;
  [key: string]: unknown;
}

// ─── Search Types ────────────────────────────────────────────────

export interface SearchTweetsParams {
  query: string;
  count?: number;
  sort?: 'latest' | 'popular' | 'engagement';
  cursor?: string;
  lang?: string;
  min_likes?: number;
  min_retweets?: number;
  exclude_replies?: boolean;
  exclude_retweets?: boolean;
  since?: string;
  until?: string;
  stream?: boolean;
}

export interface SearchUsersParams {
  query: string;
  count?: number;
}

// ─── List Types ──────────────────────────────────────────────────

export interface List {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
  subscriber_count?: number;
  created_at?: string;
  owner?: User;
  [key: string]: unknown;
}

// ─── Trending Types ──────────────────────────────────────────────

export interface TrendingTopic {
  name: string;
  tweet_count?: number;
  domain?: string;
  context?: string;
  [key: string]: unknown;
}

// ─── Account Types ───────────────────────────────────────────────

export interface ConnectAccountParams {
  username?: string;
  password?: string;
  totp_secret?: string;
  cookies?: {
    auth_token: string;
    ct0: string;
  };
}

export interface AccountStatus {
  connected: boolean;
  username?: string;
  [key: string]: unknown;
}

// ─── Write Types ─────────────────────────────────────────────────

export interface CreateTweetParams {
  text: string;
}

export interface ReplyTweetParams {
  tweet_id: string;
  text: string;
}

export interface QuoteTweetParams {
  tweet_id: string;
  text: string;
}

export interface WriteResult {
  success: boolean;
  tweet_id?: string;
  [key: string]: unknown;
}

// ─── Interaction Check ──────────────────────────────────────────

export interface InteractionCheckResult {
  found: boolean;
  tweet_id?: string;
  [key: string]: unknown;
}

// ─── KOL Types ───────────────────────────────────────────────────

export interface KolTimelineParams {
  usernames: string[];
  count?: number;
}

// ─── Stream Types ────────────────────────────────────────────────

export type StreamEvent = 'tweet' | 'done' | 'error';

export interface StreamOptions {
  query: string;
  count?: number;
  sort?: 'latest' | 'popular' | 'engagement';
  lang?: string;
  min_likes?: number;
  min_retweets?: number;
  exclude_replies?: boolean;
  exclude_retweets?: boolean;
  since?: string;
  until?: string;
}

// ─── HTTP Types ──────────────────────────────────────────────────

export interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown>;
  /** Skip automatic retry for this request */
  noRetry?: boolean;
  /** External abort signal (for stream cancellation) */
  signal?: AbortSignal;
}
