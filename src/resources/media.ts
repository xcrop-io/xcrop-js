import type { HttpClient } from '../http.js';
import type { ApiResponse, UploadMediaParams, UploadMediaResult } from '../types.js';

export class MediaResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Upload an image, GIF or short video with the connected X account (max 5 MB
   * decoded; 100 credits). Pass the returned `media_id` in
   * `tweets.create({ media_ids: [...] })`.
   */
  async upload(params: UploadMediaParams): Promise<ApiResponse<UploadMediaResult>> {
    const body: Record<string, unknown> = { base64: params.base64 };
    if (params.mime_type) body.mime_type = params.mime_type;

    return this.http.request<UploadMediaResult>({
      method: 'POST',
      path: '/media/upload',
      body,
    });
  }
}
