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
