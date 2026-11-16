import type { HttpClient } from '../http.js';
import type { ApiResponse, SendDmParams, SendDmResult } from '../types.js';

export class DmResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send a 1:1 direct message from the connected X account. Requires a
   * connected X account, write permission and a paid plan (100 credits).
   * Pass `username` (or `id:<digits>`) or `user_id`. A recipient whose DM
   * settings refuse this account throws `ForbiddenError` with code
   * `DM_NOT_ALLOWED`.
   */
  async send(params: SendDmParams): Promise<ApiResponse<SendDmResult>> {
    if (!params.username && !params.user_id) {
      throw new Error('username or user_id is required');
    }
    const body: Record<string, unknown> = { text: params.text };
    if (params.user_id) body.user_id = String(params.user_id);
    else if (params.username) body.username = params.username;

    return this.http.request<SendDmResult>({
      method: 'POST',
      path: '/dm/send',
      body,
    });
  }
}
