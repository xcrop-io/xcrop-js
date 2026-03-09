import type { HttpClient } from '../http.js';
import type {
  ConnectAccountParams,
  AccountStatus,
  ApiResponse,
} from '../types.js';

export class AccountResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Connect an X account using credentials or cookies.
   * Required for write operations (tweet, like, retweet, follow).
   */
  async connect(
    params: ConnectAccountParams
  ): Promise<ApiResponse<{ success: boolean }>> {
    const hasCredentials = params.username && params.password;
    const hasCookies = params.cookies?.auth_token && params.cookies?.ct0;

    if (!hasCredentials && !hasCookies) {
      throw new Error(
        'Either credentials (username + password) or cookies (auth_token + ct0) must be provided'
      );
    }

    const body: Record<string, unknown> = {};
    if (params.username) body.username = params.username;
    if (params.password) body.password = params.password;
    if (params.totp_secret) body.totp_secret = params.totp_secret;
    if (params.cookies) body.cookies = params.cookies;

    return this.http.request<{ success: boolean }>({
      method: 'POST',
      path: '/account/connect',
      body,
    });
  }

  /**
   * Check the current X account connection status.
   */
  async status(): Promise<ApiResponse<AccountStatus>> {
    return this.http.request<AccountStatus>({
      method: 'GET',
      path: '/account/status',
    });
  }

  /**
   * Disconnect the X account and remove stored credentials.
   */
  async disconnect(): Promise<ApiResponse<{ success: boolean }>> {
    return this.http.request<{ success: boolean }>({
      method: 'DELETE',
      path: '/account/disconnect',
    });
  }
}
