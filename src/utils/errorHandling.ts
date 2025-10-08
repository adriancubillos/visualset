/**
 * Extracts error message from API response
 * Handles multiple response formats:
 * - { error: "message" }
 * - { error: { message: "message" } }
 * - { message: "message" }
 */
export async function extractErrorMessage(
  response: Response,
  defaultMessage: string
): Promise<string> {
  try {
    const errorData = await response.json();
    
    // Handle different error response formats
    if (typeof errorData?.error === 'string') {
      return errorData.error;
    } else if (errorData?.error?.message) {
      return errorData.error.message;
    } else if (errorData?.message) {
      return errorData.message;
    }
    
    return defaultMessage;
  } catch {
    // If JSON parsing fails, use default message
    return defaultMessage;
  }
}

/**
 * Gets error message from Error object or returns default
 */
export function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}
