// Main client
export { XCrop } from './client.js';

// SDK version
export { SDK_VERSION } from './http.js';

// Error classes
export {
  XCropError,
  AuthError,
  RateLimitError,
  NotFoundError,
  ForbiddenError,
} from './errors.js';

// Resource classes (for advanced usage / type narrowing)
export { UsersResource } from './resources/users.js';
export { TweetsResource } from './resources/tweets.js';
export { SearchResource, SearchStream } from './resources/search.js';
export { ListsResource } from './resources/lists.js';
export { TrendingResource } from './resources/trending.js';
export { CommunitiesResource } from './resources/communities.js';
export { AccountResource } from './resources/account.js';
export { StreamResource, RealtimeStream } from './resources/stream.js';

// Types
export type {
  // Client
  XCropOptions,

  // API envelope
  ApiMeta,
  ApiResponse,
  ApiErrorResponse,
  PaginationParams,
  PaginatedResponse,

  // Data models
  User,
  CheckFollowResult,
  Tweet,
  Media,
  UrlEntity,
  List,
  TrendingTopic,
  TrendingParams,
  Community,

  // Request params
  SearchTweetsParams,
  SearchUsersParams,
  ConnectAccountParams,
  AccountStatus,
  CreateTweetParams,
  ReplyTweetParams,
  QuoteTweetParams,
  WriteResult,
  InteractionCheckResult,
  QualifiedAccountParams,
  QualifiedAccountResult,
  QualifiedNameParams,
  QualifiedNameResult,
  FollowersIdsParams,
  FollowersIdsMeta,
  FollowersIdsResponse,
  CommunityTweetsParams,
  CommunityMembersParams,
  StreamOptions,
  StreamEvent,
  RequestOptions,
} from './types.js';
