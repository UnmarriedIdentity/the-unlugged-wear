// Shared error vocabulary + the API envelope (DOC/backend/13 §Error codes).
// Services throw AppError; guards turn it into the envelope. Anything else
// becomes INTERNAL_ERROR with no stack or message leaked to the caller.

export const ERROR_STATUS = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DUPLICATE_SKU: 409,
  STOCK_INSUFFICIENT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  REQUEST_IN_PROGRESS: 409,
  COUPON_EXPIRED: 422,
  COUPON_USED: 422,
  IDEMPOTENCY_KEY_REUSED: 422,
  RULE_VIOLATION: 422,
  AUTH_LOCKED: 423,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: ErrorDetail[];

  constructor(code: ErrorCode, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.details = details;
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

export interface ErrorEnvelope {
  error: { code: ErrorCode; message: string; details: ErrorDetail[] };
  requestId: string;
  timestamp: string;
}

export function toEnvelope(error: unknown, requestId: string): { status: number; body: ErrorEnvelope } {
  const known = isAppError(error)
    ? error
    : new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.');
  return {
    status: known.status,
    body: {
      error: { code: known.code, message: known.message, details: known.details },
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export const newRequestId = (): string => crypto.randomUUID();
