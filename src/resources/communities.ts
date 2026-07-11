import type { HttpClient } from '../http.js';
import type {
  Community,
  Tweet,
  User,
  PaginatedResponse,
  ApiResponse,
  CommunityTweetsParams,
  CommunityMembersParams,
} from '../types.js';

/**
 * X Communities data.
 *
 * ⚠️ Beta: these endpoints are newly added to the platform and may
 * return a 503 (`ENDPOINT_IN_DEVELOPMENT`) while the backend is being
 * finished. Treat a 503 here as "not ready yet", not a hard failure.
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
   * Get tweets from a community's timeline.
   */
  async tweets(
    communityId: string,
    params: CommunityTweetsParams = {}
  ): Promise<PaginatedResponse<Tweet>> {
    return this.http.request({
      method: 'GET',
      path: `/communities/${encodeURIComponent(communityId)}/tweets`,
      query: { count: params.count, sort: params.sort, cursor: params.cursor },
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
}
