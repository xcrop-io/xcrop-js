import type { HttpClient } from '../http.js';
import type {
  Tweet,
  User,
  PaginationParams,
  PaginatedResponse,
  ListTweetsParams,
} from '../types.js';

const DEFAULT_MAX_PAGES = 100;

export class ListsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get tweets from a list. `include_replies: false` leaves replies out.
   */
  async tweets(
    listId: string,
    params: ListTweetsParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/lists/${encodeURIComponent(listId)}/tweets`,
      query: {
        count: params.count,
        cursor: params.cursor,
        since: params.since,
        until: params.until,
        include_replies: params.include_replies,
      },
    });
  }

  /**
   * Get members of a list.
   */
  async members(
    listId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/lists/${encodeURIComponent(listId)}/members`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get subscribers of a list.
   */
  async subscribers(
    listId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/lists/${encodeURIComponent(listId)}/subscribers`,
      query: { count: params.count, cursor: params.cursor },
    });
  }
}

/**
 * Async generator that auto-paginates a list-based paginated endpoint.
 * @param maxPages Safety limit to prevent infinite loops (default 100).
 */
export async function* paginateList<T, P extends PaginationParams = PaginationParams>(
  method: (listId: string, params: P) => Promise<PaginatedResponse<T>>,
  listId: string,
  params: P = {} as P,
  maxPages: number = DEFAULT_MAX_PAGES
): AsyncGenerator<T, void, undefined> {
  let cursor: string | undefined = params.cursor;
  let hasNext = true;
  let page = 0;

  while (hasNext && page < maxPages) {
    const response = await method(listId, { ...params, cursor });

    for (const item of response.data) {
      yield item;
    }

    cursor = response.meta.cursor;
    hasNext = !!response.meta.has_next && !!cursor;
    page++;
  }
}
