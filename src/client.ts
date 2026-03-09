import { HttpClient } from './http.js';
import { UsersResource, paginateUser } from './resources/users.js';
import { TweetsResource, paginateTweet } from './resources/tweets.js';
import { SearchResource } from './resources/search.js';
import { ListsResource, paginateList } from './resources/lists.js';
import { TrendingResource } from './resources/trending.js';
import { KolResource } from './resources/kol.js';
import { AccountResource } from './resources/account.js';
import { StreamResource } from './resources/stream.js';
import type {
  XCropOptions,
  PaginationParams,
  Tweet,
  User,
} from './types.js';

type UserTweetsFn = UsersResource['tweets'] & {
  paginate(username: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
};

interface PaginateHelpers {
  userTweets(username: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
  userMentions(username: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
  userFollowers(username: string, params?: PaginationParams): AsyncGenerator<User, void, undefined>;
  userFollowing(username: string, params?: PaginationParams): AsyncGenerator<User, void, undefined>;
  userReplies(username: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
  userMedia(username: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
  userVerifiedFollowers(username: string, params?: PaginationParams): AsyncGenerator<User, void, undefined>;
  userLikes(username: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
  tweetConversation(tweetId: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
  tweetQuotes(tweetId: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
  tweetLikers(tweetId: string, params?: PaginationParams): AsyncGenerator<User, void, undefined>;
  tweetRetweeters(tweetId: string, params?: PaginationParams): AsyncGenerator<User, void, undefined>;
  listTweets(listId: string, params?: PaginationParams): AsyncGenerator<Tweet, void, undefined>;
  listMembers(listId: string, params?: PaginationParams): AsyncGenerator<User, void, undefined>;
  listSubscribers(listId: string, params?: PaginationParams): AsyncGenerator<User, void, undefined>;
}

/**
 * XCROP SDK client for the X/Twitter data intelligence API.
 *
 * @example
 * ```ts
 * import { XCrop } from '@xcrop/sdk';
 *
 * const client = new XCrop({ apiKey: 'xc_live_...' });
 * const user = await client.users.get('elonmusk');
 * ```
 */
export class XCrop {
  private readonly http: HttpClient;

  /** User profile, tweets, followers, and relationship endpoints. */
  public readonly users: UsersResource & { tweets: UserTweetsFn };
  /** Tweet data, write operations, interactions, and checks. */
  public readonly tweets: TweetsResource;
  /** Search tweets and users, with streaming support. */
  public readonly search: SearchResource;
  /** Twitter list data. */
  public readonly lists: ListsResource;
  /** Trending topics. */
  public readonly trending: TrendingResource;
  /** KOL (Key Opinion Leader) timeline. */
  public readonly kol: KolResource;
  /** X account connection management for write operations. */
  public readonly account: AccountResource;
  /** Real-time SSE stream. */
  public readonly stream: StreamResource;

  /** Pagination helper — auto-iterate through all pages. */
  public readonly paginate: PaginateHelpers;

  constructor(options: XCropOptions) {
    if (!options.apiKey) {
      throw new Error('apiKey is required');
    }

    this.http = new HttpClient(options);

    // Initialize resources
    const usersBase = new UsersResource(this.http);
    this.tweets = new TweetsResource(this.http);
    this.search = new SearchResource(this.http);
    this.lists = new ListsResource(this.http);
    this.trending = new TrendingResource(this.http);
    this.kol = new KolResource(this.http);
    this.account = new AccountResource(this.http);
    this.stream = new StreamResource(this.http);

    // Build users.tweets with nested .paginate()
    const boundTweets = usersBase.tweets.bind(usersBase);
    const tweetsFn = Object.assign(boundTweets, {
      paginate: (username: string, params?: PaginationParams) =>
        paginateUser<Tweet>(boundTweets, username, params),
    }) as UserTweetsFn;

    this.users = Object.assign(usersBase, { tweets: tweetsFn }) as UsersResource & { tweets: UserTweetsFn };

    // Build top-level paginate helpers
    this.paginate = {
      userTweets: (username: string, params?: PaginationParams) =>
        paginateUser<Tweet>(boundTweets, username, params),
      userMentions: (username: string, params?: PaginationParams) =>
        paginateUser<Tweet>(usersBase.mentions.bind(usersBase), username, params),
      userFollowers: (username: string, params?: PaginationParams) =>
        paginateUser<User>(usersBase.followers.bind(usersBase), username, params),
      userFollowing: (username: string, params?: PaginationParams) =>
        paginateUser<User>(usersBase.following.bind(usersBase), username, params),
      userReplies: (username: string, params?: PaginationParams) =>
        paginateUser<Tweet>(usersBase.replies.bind(usersBase), username, params),
      userMedia: (username: string, params?: PaginationParams) =>
        paginateUser<Tweet>(usersBase.media.bind(usersBase), username, params),
      userVerifiedFollowers: (username: string, params?: PaginationParams) =>
        paginateUser<User>(usersBase.verifiedFollowers.bind(usersBase), username, params),
      userLikes: (username: string, params?: PaginationParams) =>
        paginateUser<Tweet>(usersBase.likes.bind(usersBase), username, params),
      tweetConversation: (tweetId: string, params?: PaginationParams) =>
        paginateTweet<Tweet>(this.tweets.conversation.bind(this.tweets), tweetId, params),
      tweetQuotes: (tweetId: string, params?: PaginationParams) =>
        paginateTweet<Tweet>(this.tweets.quotes.bind(this.tweets), tweetId, params),
      tweetLikers: (tweetId: string, params?: PaginationParams) =>
        paginateTweet<User>(this.tweets.likers.bind(this.tweets), tweetId, params),
      tweetRetweeters: (tweetId: string, params?: PaginationParams) =>
        paginateTweet<User>(this.tweets.retweeters.bind(this.tweets), tweetId, params),
      listTweets: (listId: string, params?: PaginationParams) =>
        paginateList<Tweet>(this.lists.tweets.bind(this.lists), listId, params),
      listMembers: (listId: string, params?: PaginationParams) =>
        paginateList<User>(this.lists.members.bind(this.lists), listId, params),
      listSubscribers: (listId: string, params?: PaginationParams) =>
        paginateList<User>(this.lists.subscribers.bind(this.lists), listId, params),
    };
  }
}
