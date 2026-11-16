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
  /** Conversation: tweets above a mid-thread tweet, oldest first (not billed). */
  thread_context?: Tweet[];
  /** Conversation: the sort order that was applied. */
  sort?: string;
  /** users.batch / batchByIds: requested items X did not return. */
  not_found?: string[];
  /** users.batch / batchByIds: items whose lookup failed (retry these). */
  failed?: string[];
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  /** Extra detail on 404s, e.g. `suspended`, `deactivated`, `not_found`. */
  reason?: string;
}

/**
 * Error codes the API returns in `code`. The list is open: new codes can
 * appear, so keep a fallback branch when switching on it.
 */
export type XCropErrorCode =
  | 'NOT_FOUND'
  | 'USER_SUSPENDED'
  | 'USER_UNAVAILABLE'
  | 'BAD_COMMUNITY_ID'
  | 'BAD_TIME_WINDOW'
  | 'BAD_USER_ID'
  | 'BAD_SORT'
  | 'BAD_CURSOR'
  | 'INTERNAL_ERROR'
  | (string & {});

// ─── Pagination ──────────────────────────────────────────────────

export interface PaginationParams {
  count?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ApiMeta;
}

/**
 * Time window for endpoints that support it (user mentions, tweet quotes,
 * tweet conversation, list tweets). Unix seconds or an ISO date string.
 */
export interface TimeWindowParams {
  since?: string | number;
  until?: string | number;
}

/** Any `users.*` route can address the user by numeric id instead of username. */
export interface UserLookupParams {
  /** Numeric X user id. Same as passing `id:<digits>` as the username. */
  user_id?: string;
}

export interface UserPaginationParams extends PaginationParams, UserLookupParams {}

/** followers / following / verifiedFollowers. */
export interface UserListParams extends UserPaginationParams {
  /**
   * Also return suspended / deactivated accounts as rows
   * `{ id, unavailable: true, unavailable_reason, ...other fields null }`.
   * Not billed.
   */
  include_unavailable?: boolean;
}

export interface UserMentionsParams extends UserPaginationParams, TimeWindowParams {}

export interface TweetQuotesParams extends PaginationParams, TimeWindowParams {}

export interface ConversationParams extends PaginationParams, TimeWindowParams {
  /**
   * `latest` (default, newest first), `relevance` or `likes`.
   * `popular` / `engagement` are accepted aliases of `relevance`.
   */
  sort?: 'latest' | 'relevance' | 'likes' | 'popular' | 'engagement';
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

  // Fields below are nullable: null means X did not send it, never false/0.
  followers?: number | null;
  following?: number | null;
  tweets_count?: number | null;
  listed?: number | null;
  verified_type?: string | null;
  profile_image?: string | null;
  website?: string | null;
  banner_image?: string | null;
  likes_count?: number | null;
  media_count?: number | null;
  can_dm?: boolean | null;
  pinned_tweet_ids?: string[] | null;
  /** True when the account carries X's "Automated by" bot label. */
  automated?: boolean | null;
  automated_by?: string | null;
  affiliation?: UserAffiliation | null;
  /** Community member / moderator rows only: Admin | Moderator | Member. */
  community_role?: string;
  /** Only on rows from `include_unavailable=true`: the account is suspended or deactivated. */
  unavailable?: boolean;
  unavailable_reason?: string | null;
  [key: string]: unknown;
}

export interface UserAffiliation {
  label: string | null;
  username: string | null;
  badge_url: string | null;
}

export interface CheckFollowResult {
  source: string;
  target: string;
  /** Does `source` follow `target`? */
  source_follows_target: boolean;
  /** Does `target` follow `source`? */
  target_follows_source: boolean;
  [key: string]: unknown;
}

// ─── Qualification Check Types (airdrop/giveaway gating) ─────────

export interface QualifiedAccountParams {
  /** Minimum follower count required. */
  min_followers?: number;
  /** Minimum account age in days. */
  min_age_days?: number;
}

export interface QualifiedAccountResult {
  username: string;
  qualified: boolean;
  followers: number;
  accountAgeDays: number;
  minFollowers: number;
  minAgeDays: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface QualifiedNameParams {
  /** Text the display name must contain. */
  contains: string;
  /** Where the text must appear in the display name. Defaults to 'anywhere'. */
  position?: 'anywhere' | 'left' | 'right';
}

export interface QualifiedNameResult {
  username: string;
  qualified: boolean;
  name: string;
  contains: string;
  position: string;
  [key: string]: unknown;
}

// ─── Follower IDs (bulk) ──────────────────────────────────────────

export interface FollowersIdsParams {
  /** Number of IDs to return, up to 5000. Defaults to 5000. */
  count?: number;
  cursor?: string;
  /** Numeric X user id, instead of the username. */
  user_id?: string;
}

export interface FollowersIdsMeta {
  total?: number;
  has_next_page?: boolean;
  next_cursor?: string | null;
  latency_ms?: number;
  [key: string]: unknown;
}

export interface FollowersIdsResponse {
  data: string[];
  meta: FollowersIdsMeta;
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

  /** Permalink, https://x.com/<username>/status/<id>. */
  url?: string | null;
  /** Client name the tweet was posted from. */
  source?: string | null;
  metrics?: TweetMetrics;
  in_reply_to?: TweetInReplyTo | null;
  /** Reposted original, nested one level deep. */
  retweeted_tweet?: Tweet | null;
  /** True when `text` is a long post (over 280 characters), returned in full. */
  is_long_post?: boolean;
  entities?: TweetEntities | null;
  possibly_sensitive?: boolean | null;
  edit?: TweetEdit | null;
  has_community_notes?: boolean | null;
  place?: TweetPlace | null;
  card?: TweetCard | null;
  [key: string]: unknown;
}

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  bookmarks: number;
}

export interface TweetInReplyTo {
  tweet_id: string | null;
  user_id: string | null;
  username: string | null;
}

export interface TweetEntities {
  urls: Array<{ url: string | null; expanded_url: string | null; display_url: string | null }>;
  mentions: Array<{ id: string | null; username: string | null; name: string | null }>;
  hashtags: string[];
  symbols: string[];
}

export interface TweetEdit {
  is_edited: boolean;
  edit_tweet_ids: string[] | null;
  /** ISO timestamp until which the tweet can still be edited. */
  editable_until: string | null;
}

export interface TweetPlace {
  full_name: string | null;
  country: string | null;
  country_code: string | null;
}

export interface TweetCard {
  name: string | null;
  url: string | null;
  title: string | null;
  poll: unknown;
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

export interface TrendingParams {
  /** Country/region for trends. Defaults to 'Worldwide'. */
  country?: string;
}

export interface TrendingTopic {
  name: string;
  /** 1-based position in the trending list. */
  rank?: number;
  /** Always null: X no longer publishes post counts for trends. */
  volume?: null;
  tweet_count?: number;
  domain?: string;
  context?: string;
  [key: string]: unknown;
}

// ─── Community Types ─────────────────────────────────────────────

export interface Community {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
  moderator_count?: number | null;
  created_at?: string | null;
  join_policy?: string | null;
  invites_policy?: string | null;
  is_nsfw?: boolean | null;
  question?: string | null;
  topic?: { id: string | null; name: string | null } | null;
  search_tags?: string[];
  banner_image?: string | null;
  rules?: Array<{ name: string; description: string }>;
  creator?: User | null;
  admin?: User | null;
  members_preview?: unknown[];
  /** https://x.com/i/communities/<id> */
  url?: string | null;
  [key: string]: unknown;
}

export interface CommunityTweetsParams extends PaginationParams {
  /**
   * @deprecated The timeline has no sort option (latest first); only
   * `latest` is accepted and other values return BAD_SORT.
   */
  sort?: 'latest' | 'popular' | 'engagement';
}

export interface CommunityMembersParams extends PaginationParams {
  /** `default` or `name`. (`followers` is no longer accepted: BAD_SORT.) */
  sort?: 'default' | 'name' | 'followers';
}

export interface CommunityModeratorsParams extends PaginationParams {
  sort?: 'default' | 'name';
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

export interface AccountCredits {
  plan: string;
  /** Plan allowance for the current period. */
  plan_credits: number;
  plan_used: number;
  plan_remaining: number;
  /** Separate top-up balance, spent after the plan allowance runs out. */
  topup_remaining: number;
  total_remaining: number;
  /** ISO timestamps of the current quota period. */
  period_start: string;
  period_end: string;
  rate_limit_per_minute: number;
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
