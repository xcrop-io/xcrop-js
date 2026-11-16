import type { HttpClient } from '../http.js';
import type {
  Community,
  Tweet,
  User,
  PaginatedResponse,
  ApiResponse,
  CommunityTweetsParams,
  CommunityMembersParams,
  CommunityModeratorsParams,
} from '../types.js';

/**
 * X Communities data (details, timeline, members, moderators).
 *
 * `count` is a minimum on members and moderators: X serves whole pages, so a
 * response can hold more rows than requested.
 */
export class CommunitiesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get a community's profile.
   */
  async get(communityId: string): Promise<ApiResponse<Community>> {
    return this.http.request<Community>({
      method: 'GET',
      path: `/communities/${encodeURIComponent(communityId)}`,
    });
  }

  /**
   * Get tweets from a community's timeline (latest first, no `sort` option).
   */
  async tweets(
    communityId: string,
    params: CommunityTweetsParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/communities/${encodeURIComponent(communityId)}/tweets`,
      query: { count: params.count, cursor: params.cursor },
    });
  }

  /**
   * Get members of a community.
   */
  async members(
    communityId: string,
    params: CommunityMembersParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/communities/${encodeURIComponent(communityId)}/members`,
      query: { count: params.count, sort: params.sort, cursor: params.cursor },
    });
  }

  /**
   * Get moderators of a community. Rows carry `community_role`.
   */
  async moderators(
    communityId: string,
    params: CommunityModeratorsParams = {}
  ): Promise<PaginatedResponse<User>> {
    return this.http.request({
      method: 'GET',
      path: `/communities/${encodeURIComponent(communityId)}/moderators`,
      query: { count: params.count, sort: params.sort, cursor: params.cursor },
    });
  }
}
