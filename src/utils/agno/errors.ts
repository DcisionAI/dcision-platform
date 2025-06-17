export class AgnoError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AgnoError';
  }
}

export const ErrorCodes = {
  KNOWLEDGE_LOAD_FAILED: 'KNOWLEDGE_LOAD_FAILED',
  AGENT_INITIALIZATION_FAILED: 'AGENT_INITIALIZATION_FAILED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  STORAGE_ERROR: 'STORAGE_ERROR',
  VECTOR_DB_ERROR: 'VECTOR_DB_ERROR',
  MODEL_ERROR: 'MODEL_ERROR',
  SESSION_ERROR: 'SESSION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export function handleAgnoError(error: unknown, context: Record<string, any> = {}): never {
  if (error instanceof AgnoError) {
    throw error;
  }

  // Handle known error patterns
  if (error instanceof Error) {
    if (error.message.includes('knowledge')) {
      throw new AgnoError(
        'Failed to load knowledge base',
        ErrorCodes.KNOWLEDGE_LOAD_FAILED,
        { originalError: error.message, ...context }
      );
    }

    if (error.message.includes('storage')) {
      throw new AgnoError(
        'Storage operation failed',
        ErrorCodes.STORAGE_ERROR,
        { originalError: error.message, ...context }
      );
    }

    if (error.message.includes('vector')) {
      throw new AgnoError(
        'Vector database operation failed',
        ErrorCodes.VECTOR_DB_ERROR,
        { originalError: error.message, ...context }
      );
    }

    if (error.message.includes('model')) {
      throw new AgnoError(
        'Model operation failed',
        ErrorCodes.MODEL_ERROR,
        { originalError: error.message, ...context }
      );
    }
  }

  // Handle unknown errors
  throw new AgnoError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    { originalError: error, ...context }
  );
}

export function validateResponse<T>(
  response: unknown,
  validator: (data: unknown) => data is T,
  context: Record<string, any> = {}
): T {
  if (!validator(response)) {
    throw new AgnoError(
      'Invalid response structure',
      ErrorCodes.INVALID_RESPONSE,
      { response, ...context }
    );
  }
  return response;
} 