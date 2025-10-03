export type ApiErrorOptions = {
  code: string; // machine-readable code
  message: string; // human-friendly
  status?: number; // optional HTTP status
  details?: unknown;
};

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: unknown;

  constructor({ code, message, status = 400, details }: ApiErrorOptions) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function mapErrorToResponse(err: unknown) {
  if (isApiError(err)) {
    return {
      body: { error: { code: err.code, message: err.message, details: err.details } },
      status: err.status,
    };
  }

  return {
    body: { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    status: 500,
  };
}
