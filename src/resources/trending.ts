import type { HttpClient } from '../http.js';
import type { TrendingTopic, ApiResponse } from '../types.js';

export class TrendingResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get current trending topics.
   */
  async get(): Promise<ApiResponse<TrendingTopic[]>> {
    return this.http.request<TrendingTopic[]>({
      method: 'GET',
      path: '/trending',
    });
  }
}
