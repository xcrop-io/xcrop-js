/**
 * Base error class for all XCROP SDK errors.
 */
export class XCropError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly headers: Record<string, string>;

  constructor(
    message: string,
    status: number,
    code: string,
    headers: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'XCropError';
    this.status = status;
    this.code = code;
    this.headers = headers;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when authentication fails (401).
 */
export class AuthError extends XCropError {
  constructor(message: string, headers: Record<string, string> = {}) {
    super(message, 401, 'AUTH_ERROR', headers);
    this.name = 'AuthError';
  }
}

/**
 * Thrown when rate limit is exceeded (429).
 * Contains retry timing information.
 */
export class RateLimitError extends XCropError {
  public readonly retryAfter: number | null;
  public readonly remaining: number;
  public readonly limit: number;

  constructor(
    message: string,
    headers: Record<string, string> = {}
  ) {
    super(message, 429, 'RATE_LIMIT', headers);
    this.name = 'RateLimitError';
    this.retryAfter = headers['retry-after']
      ? parseInt(headers['retry-after'], 10)
      : null;
    this.remaining = parseInt(headers['x-ratelimit-remaining'] || '0', 10);
    this.limit = parseInt(headers['x-ratelimit-limit'] || '0', 10);
  }
}

/**
 * Thrown when a resource is not found (404).
 */
export class NotFoundError extends XCropError {
  constructor(message: string, headers: Record<string, string> = {}) {
    super(message, 404, 'NOT_FOUND', headers);
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when the request is forbidden (403).
 */
export class ForbiddenError extends XCropError {
  constructor(message: string, headers: Record<string, string> = {}) {
    super(message, 403, 'FORBIDDEN', headers);
    this.name = 'ForbiddenError';
  }
}
