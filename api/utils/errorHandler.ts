/**
 * Standardized API error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    public fields: Record<string, string> = {}
  ) {
    super(400, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error class
 */
export class AuthError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(401, 'AUTH_ERROR', message);
    this.name = 'AuthError';
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(403, 'FORBIDDEN', message);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends ApiError {
  constructor(
    message: string = 'Too many requests',
    public retryAfter: number = 60
  ) {
    super(429, 'RATE_LIMITED', message);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Internal server error class
 */
export class InternalError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_ERROR', message);
    this.name = 'InternalError';
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

/**
 * Log error with context
 * @param error - Error to log
 * @param context - Additional context
 */
export function logError(
  error: Error | ApiError,
  context: {
    endpoint?: string;
    method?: string;
    userId?: string;
    tenantId?: string;
    [key: string]: any;
  } = {}
): void {
  const timestamp = new Date().toISOString();
  const errorData = {
    timestamp,
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error instanceof ApiError && {
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    }),
    context,
  };

  console.error('[ERROR]', JSON.stringify(errorData, null, 2));

  // In production: Send to error tracking service (Sentry, Datadog, etc)
  if (process.env.NODE_ENV === 'production') {
    // sendToErrorTracker(errorData);
  }
}

/**
 * Format error response for API
 * @param error - Error to format
 * @returns Formatted error response
 */
export function formatErrorResponse(error: Error | ApiError) {
  if (error instanceof ApiError) {
    return {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && { fields: error.fields }),
        ...(error instanceof RateLimitError && { retryAfter: error.retryAfter }),
        ...(error.details && { details: error.details }),
      },
    };
  }

  // Unknown error - don't expose details in production
  return {
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Something went wrong'
          : error.message,
    },
  };
}

/**
 * Safe API handler wrapper
 * Automatically handles errors and logging
 */
export function createApiHandler<T extends any[], R>(
  handler: (req: any, res: any, ...args: T) => Promise<R>
) {
  return async (req: any, res: any, ...args: T): Promise<void> => {
    try {
      const context = {
        endpoint: req.path,
        method: req.method,
        userId: req.headers['x-user-id'],
        tenantId: req.headers['x-tenant-id'],
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      };

      await handler(req, res, ...args);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      logError(err, {
        endpoint: req.path,
        method: req.method,
        userId: req.headers['x-user-id'],
        tenantId: req.headers['x-tenant-id'],
      });

      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(formatErrorResponse(error));
      }

      // Internal error - don't expose details
      return res
        .status(500)
        .json(
          formatErrorResponse(
            new InternalError(
              process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message
            )
          )
        );
    }
  };
}

/**
 * Check if error is API error
 */
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: Error): number {
  if (error instanceof ApiError) {
    return error.statusCode;
  }
  return 500;
}
