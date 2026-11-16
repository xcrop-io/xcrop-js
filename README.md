# @xcrop/sdk

Official JavaScript/TypeScript SDK for the [XCROP API](https://xcrop.io), the X/Twitter data intelligence platform, covering 47 endpoints (profiles, tweets, search, lists, communities, account monitoring, and the Write API).

- Full TypeScript support with detailed types for all endpoints
- Auto-retry on rate limits (429) with exponential backoff
- Auto-retry on server errors (5xx), max 3 attempts
- Auto-pagination via async iterators
- SSE streaming support for search and real-time feeds
- ESM and CommonJS dual output
- Zero dependencies (uses native `fetch`)

## Requirements

- Node.js 18+ (native `fetch` required)

## Installation

```bash
npm install @xcrop/sdk
```

## Quick Start

```typescript
import { XCrop } from '@xcrop/sdk';

const client = new XCrop({ apiKey: 'xc_live_...' });

// Get a user profile
const { data: user } = await client.users.get('elonmusk');
console.log(user.name, user.followers_count);

// Get user tweets
const { data: tweets } = await client.users.tweets('elonmusk', { count: 50 });
```

## Configuration

```typescript
const client = new XCrop({
  apiKey: 'xc_live_...',      // Required
  baseUrl: 'https://...',      // Default: https://xcrop.io/api/v2
  timeout: 30000,              // Default: 30s
  maxRetries: 3,               // Default: 3 (for 429/5xx)
});
```

## Users

```typescript
// Profile
const { data: user } = await client.users.get('elonmusk');

// Tweets, mentions, replies, media
const { data: tweets } = await client.users.tweets('elonmusk', { count: 20 });
const { data: mentions } = await client.users.mentions('elonmusk');
const { data: replies } = await client.users.replies('elonmusk');
const { data: media } = await client.users.media('elonmusk');

// Followers & following
const { data: followers } = await client.users.followers('elonmusk', { count: 100 });
const { data: following } = await client.users.following('elonmusk');
const { data: verified } = await client.users.verifiedFollowers('elonmusk');

// Raw follower / following IDs (bulk, no profile metadata, up to 5000/call)
const { data: ids } = await client.users.followersIds('elonmusk', { count: 5000 });
const { data: followingIds } = await client.users.followingIds('elonmusk', { count: 5000 });

// Batch lookup (max 100), by username or by numeric id
const { data: users } = await client.users.batch(['elonmusk', 'jack', 'VitalikButerin']);
const { data: byId, meta } = await client.users.batchByIds(['44196397', '12']);
console.log(meta.not_found); // ids X did not return

// Any user route also takes a numeric id: `id:<digits>` or `user_id`
await client.users.get('id:44196397');
await client.users.tweets('ignored', { user_id: '44196397' });

// Time window on mentions (unix seconds or ISO date)
await client.users.mentions('elonmusk', { since: '2026-11-01', until: '2026-11-10' });

// Also return suspended/deactivated accounts (not billed). Those rows look like
// { id, unavailable: true, unavailable_reason, ...every other field null }
const { data: all } = await client.users.following('nasa', { include_unavailable: true });

// Check follow relationship
const { data: rel } = await client.users.checkFollow('elonmusk', 'jack');
console.log(rel.source_follows_target, rel.target_follows_source);

// Eligibility checks for airdrop/giveaway gating
const { data: qa } = await client.users.checkQualifiedAccount('elonmusk', {
  min_followers: 1000,
  min_age_days: 30,
});
const { data: qn } = await client.users.checkQualifiedName('elonmusk', {
  contains: 'crypto',
  position: 'anywhere', // 'anywhere' | 'left' | 'right'
});
```

User objects now include `location`, `website`, `banner_image`, `likes_count`,
`media_count`, `protected`, `can_dm`, `pinned_tweet_ids`, `automated`,
`automated_by` and `affiliation` (all nullable: `null` means X did not send it).
Community member and moderator rows add `community_role`.

## Tweets

```typescript
// Single tweet
const { data: tweet } = await client.tweets.get('1234567890');

// Conversation thread
const { data: thread } = await client.tweets.conversation('1234567890', { count: 50 });

// Quote tweets
const { data: quotes } = await client.tweets.quotes('1234567890');

// Batch lookup (max 100)
const { data: tweets } = await client.tweets.batch(['123', '456', '789']);

// Who reposted a tweet (billed per user returned)
const { data: retweeters } = await client.tweets.retweeters('1234567890', { count: 100 });

// Conversation: sort 'latest' (default) | 'relevance' | 'likes', plus a time window
const convo = await client.tweets.conversation('1234567890', { sort: 'likes', since: '2026-11-01' });
console.log(convo.meta.sort, convo.meta.thread_context); // tweets above a mid-thread tweet

// Time window on quotes and list tweets
await client.tweets.quotes('1234567890', { since: 1730419200 });
await client.lists.tweets('1234567890', { until: '2026-11-10' });
```

Tweets now carry `url`, `lang`, `source`, `in_reply_to`, `quoted_tweet`,
`retweeted_tweet`, `is_long_post`, `entities`, `possibly_sensitive`, `edit`,
`has_community_notes`, `place`, `card`, `metrics.quotes` and richer `author`
fields (`followers`, `verified`, `verified_type`, `profile_image`). `text` is
the full text of long posts.

## Communities

X Communities data. `count` is a minimum on members and moderators: X serves
whole pages, so a response can hold more rows than requested.

```typescript
const { data: community } = await client.communities.get('1708766018985501165');
const { data: tweets } = await client.communities.tweets('1708766018985501165', { count: 20 });
const { data: members } = await client.communities.members('1708766018985501165', { sort: 'name' });
const { data: mods } = await client.communities.moderators('1708766018985501165', { sort: 'default' });
```

## Search

```typescript
// Search tweets
const { data: results } = await client.search.tweets({
  query: 'bitcoin',
  count: 50,
  sort: 'latest',           // 'latest' | 'popular' | 'engagement'
  lang: 'en',
  min_likes: 10,
  exclude_replies: true,
  since: '2024-01-01',
  until: '2024-12-31',
});

// Search users
const { data: users } = await client.search.users({ query: 'crypto', count: 20 });
```

## Auto-Pagination

Use the `paginate` helper to automatically iterate through all pages:

```typescript
// Iterate all tweets
for await (const tweet of client.paginate.userTweets('elonmusk', { count: 100 })) {
  console.log(tweet.text);
}

// Also works with: client.users.tweets.paginate()
for await (const tweet of client.users.tweets.paginate('elonmusk', { count: 200 })) {
  console.log(tweet.id);
}

// All paginated endpoints:
client.paginate.userTweets(username, params)
client.paginate.userMentions(username, params)
client.paginate.userFollowers(username, params)
client.paginate.userFollowing(username, params)
client.paginate.userReplies(username, params)
client.paginate.userMedia(username, params)
client.paginate.userVerifiedFollowers(username, params)
client.paginate.tweetConversation(tweetId, params)
client.paginate.tweetQuotes(tweetId, params)
client.paginate.listTweets(listId, params)
client.paginate.listMembers(listId, params)
client.paginate.listSubscribers(listId, params)
client.paginate.communityTweets(communityId, params)
client.paginate.communityMembers(communityId, params)
```

## Streaming

### Search Stream (SSE)

```typescript
const stream = client.search.stream({ query: 'crypto', count: 500 });

stream.on('tweet', (tweet) => {
  console.log(tweet.text);
});

stream.on('done', (meta) => {
  console.log('Stream complete', meta);
});

stream.on('error', (err) => {
  console.error('Stream error', err);
});

// Close early
stream.close();
```

### Real-time Stream

```typescript
const stream = client.stream.connect();

stream.on('tweet', (tweet) => {
  console.log('New tweet:', tweet.text);
});

stream.on('error', (err) => {
  console.error(err);
});

// Close when done
stream.close();
```

## Write Operations

Write operations require a connected X account.

### Connect Account

```typescript
// Via credentials
await client.account.connect({
  username: 'myuser',
  password: 'mypass',
  totp_secret: 'ABCDEF123456',  // Optional 2FA
});

// Via cookies
await client.account.connect({
  cookies: {
    auth_token: '...',
    ct0: '...',
  },
});

// Check status
const { data: status } = await client.account.status();
console.log(status.connected, status.username);

// Disconnect
await client.account.disconnect();
```

### Create, Reply, Quote

```typescript
// Create tweet
const { data: result } = await client.tweets.create({ text: 'Hello world!' });
console.log(result.tweet_id);

// Reply
await client.tweets.reply({ tweet_id: '1234567890', text: 'Great thread!' });

// Quote
await client.tweets.quote({ tweet_id: '1234567890', text: 'Interesting take' });

// Delete
await client.tweets.delete('1234567890');
```

### Like, Retweet, Follow

```typescript
await client.tweets.like('1234567890');
await client.tweets.unlike('1234567890');

await client.tweets.retweet('1234567890');
await client.tweets.unretweet('1234567890');

await client.users.follow('elonmusk');
await client.users.unfollow('elonmusk');
```

## Interaction Checks

Check if a user interacted with a specific tweet (no connected account needed):

```typescript
const { data: retweeted } = await client.tweets.checkRetweet('1234567890', 'username');
const { data: replied } = await client.tweets.checkReply('1234567890', 'username');
const { data: quoted } = await client.tweets.checkQuote('1234567890', 'username');

console.log(retweeted.found); // boolean
```

## Lists

```typescript
const { data: tweets } = await client.lists.tweets('12345', { count: 50 });
const { data: members } = await client.lists.members('12345');
const { data: subs } = await client.lists.subscribers('12345');
```

## Trending

```typescript
// Trending topics (defaults to Worldwide)
const { data: trends } = await client.trending.get();
const { data: usTrends } = await client.trending.get({ country: 'United States' });
// Each row has a 1-based `rank`; `volume` is always null (X no longer publishes counts)
```

## Account Monitoring

Track specific X accounts over time (profile snapshots, tweet activity) via
the `users` and `search` endpoints above: poll `client.users.get()` /
`client.users.tweets()` on a schedule, or use `client.stream.connect()` for
real-time updates.

## Credits

```typescript
// Free call: current credit balance
const { data: credits } = await client.account.credits();
console.log(credits.total_remaining, credits.plan_remaining, credits.topup_remaining);
```

## Error Handling

```typescript
import { XCrop, AuthError, RateLimitError, NotFoundError, XCropError } from '@xcrop/sdk';

try {
  await client.users.get('nonexistent_user_12345');
} catch (err) {
  if (err instanceof NotFoundError) {
    // err.code: NOT_FOUND | USER_SUSPENDED | USER_UNAVAILABLE
    // err.reason: e.g. 'suspended', 'deactivated', 'not_found'
    console.log(`User not found: ${err.code} ${err.reason ?? ''}`);
  } else if (err instanceof AuthError) {
    console.log('Invalid API key');
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${err.retryAfter}s`);
    console.log(`Remaining: ${err.remaining}/${err.limit}`);
  } else if (err instanceof XCropError) {
    console.log(`API error: ${err.status} ${err.code} - ${err.message}`);
  }
}
```

Error codes returned in `err.code` (the list can grow, keep a fallback branch):
`NOT_FOUND`, `USER_SUSPENDED`, `USER_UNAVAILABLE` (with `err.reason`),
`BAD_COMMUNITY_ID`, `BAD_TIME_WINDOW`, `BAD_USER_ID`, `BAD_SORT`, `BAD_CURSOR`
and `INTERNAL_ERROR` (500). Suspended and unavailable accounts arrive as a
`NotFoundError` (404) with the matching code.

## Rate Limits

Per-minute request limits, by plan:

| Plan | Requests/min |
|------|---------------|
| Starter | 60 |
| Basic | 300 |
| Pro | 600 |
| Pay-as-You-Go | 300 |

Every plan (including the free Starter tier) can call all 47 endpoints. Plans
differ only by monthly credits, the rate limit above, and credit price. On a
429 the SDK auto-retries with backoff (see `RateLimitError` above for the
raw `retryAfter`/`remaining`/`limit` fields).

## Payment

Plans and credit top-ups are paid via cryptocurrency: USDT (BEP-20), USDC
(BEP-20), SOL, and POL. Card payments (Stripe) are coming soon. See
[xcrop.io/pricing](https://xcrop.io/pricing) for details.

## Response Format

All methods return the raw API response envelope:

```typescript
interface ApiResponse<T> {
  data: T;
  meta: {
    latency_ms?: number;
    cached?: boolean;
    total?: number;
    cursor?: string;    // For pagination
    has_next?: boolean; // More pages available
  };
}
```

## License

MIT
