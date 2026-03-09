import type { HttpClient } from '../http.js';
import type { Tweet, ApiResponse, KolTimelineParams } from '../types.js';

export class KolResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get a merged timeline from multiple KOL accounts.
   *
   * @param params.usernames - Array of usernames to include
   * @param params.count - Number of tweets per user (default 20)
   */
  async timeline(
    params: KolTimelineParams
  ): Promise<ApiResponse<Tweet[]>> {
    return this.http.request<Tweet[]>({
      method: 'GET',
      path: '/kol/timeline',
      query: {
        usernames: params.usernames.join(','),
        count: params.count,
      },
    });
  }
}
