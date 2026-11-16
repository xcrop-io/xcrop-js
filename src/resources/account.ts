import type { HttpClient } from '../http.js';
import type {
  ConnectAccountParams,
  AccountStatus,
  AccountCredits,
  UpdateProfileParams,
  UpdateProfileResult,
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
   * Get the current credit balance (plan allowance plus top-ups). Free.
   */
  async credits(): Promise<ApiResponse<AccountCredits>> {
    return this.http.request<AccountCredits>({
      method: 'GET',
      path: '/account/credits',
    });
  }

  /**
   * Edit the connected account's profile. Only the fields you send change
   * (name 50, description 160, location 30, url 100 characters; at least one).
   * Requires a connected X account and a paid plan (100 credits).
   */
  async updateProfile(
    params: UpdateProfileParams
  ): Promise<ApiResponse<UpdateProfileResult>> {
    const body: Record<string, unknown> = {};
    for (const key of ['name', 'description', 'location', 'url'] as const) {
      if (params[key] !== undefined) body[key] = params[key];
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Send at least one of: name, description, location, url');
    }
    return this.http.request<UpdateProfileResult>({
      method: 'POST',
      path: '/account/profile',
      body,
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
