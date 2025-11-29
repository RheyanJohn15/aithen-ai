/**
 * Centralized API Client
 * Provides HTTP methods and request handling with authentication
 */

import { getBaseUrl, getDefaultHeaders, DEFAULT_TIMEOUT } from './config';
import { getAuthHeaders } from './auth';
import type {
  ApiRequestConfig,
  ApiResponse,
  ApiError,
  HttpMethod,
  AuthType,
  StreamingResponse,
  SSEDataCallback,
  StreamChunkCallback,
  StreamErrorCallback,
  StreamCompleteCallback,
} from './types';

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
const createTimeoutPromise = (timeout: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
  });
};

/**
 * Build the full URL from a path
 */
const buildUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Handle API response and parse JSON
 */
const handleResponse = async <T = any>(
  response: Response
): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  let data: T;
  if (isJson) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text as any;
  }

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
};

/**
 * Handle API errors
 */
const handleError = (error: any, response?: Response): ApiError => {
  if (response) {
    return {
      message: `API Error: ${response.statusText}`,
      status: response.status,
      statusText: response.statusText,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'Unknown error occurred',
  };
};

/**
 * Check if a path should skip authentication
 * Only /auth/login and /auth/register are public
 */
const shouldSkipAuth = (path: string, skipAuth: boolean): boolean => {
  if (skipAuth) return true;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register'];
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return publicRoutes.some(route => normalizedPath === route || normalizedPath.startsWith(route + '?'));
};

/**
 * Make an HTTP request
 */
const request = async <T = any>(
  method: HttpMethod,
  path: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> => {
  const {
    skipAuth: explicitSkipAuth = false,
    token,
    apiKey,
    authType = 'bearer',
    timeout = DEFAULT_TIMEOUT,
    stream = false,
    headers: customHeaders = {},
    ...fetchConfig
  } = config;

  // If streaming, use the stream method instead
  if (stream) {
    throw new Error('Use stream() method for streaming requests instead of setting stream: true');
  }

  // Determine if auth should be skipped (explicit or public route)
  const skipAuth = shouldSkipAuth(path, explicitSkipAuth);

  // Build headers
  const defaultHeaders = getDefaultHeaders();
  const headers: HeadersInit = {
    ...defaultHeaders,
    ...customHeaders,
  };

  // Add authentication headers if not skipped
  // This acts as an interceptor - automatically adds token to all authenticated routes
  if (!skipAuth) {
    const authHeaders = getAuthHeaders(authType, token, apiKey);
    Object.assign(headers, authHeaders);
  }

  // Build request config
  const requestConfig: RequestInit = {
    method,
    headers,
    ...fetchConfig,
  };

  // Build URL
  const url = buildUrl(path);

  try {
    // Create timeout promise
    const timeoutPromise = createTimeoutPromise(timeout);

    // Make request with timeout
    let response: Response;
    try {
      response = await Promise.race([
        fetch(url, requestConfig),
        timeoutPromise,
      ]) as Response;
    } catch (fetchError: any) {
      // Handle network errors, CORS errors, etc.
      const error: ApiError = {
        message: fetchError.message || 'Network error: Failed to fetch',
        status: 0,
        statusText: 'Network Error',
      };
      
      // Add more context for common errors
      if (fetchError.message?.includes('Failed to fetch')) {
        error.message = `Cannot connect to API at ${url}. Make sure the server is running.`;
      }
      
      throw error;
    }

    // Handle non-ok responses
    if (!response.ok) {
      const error = handleError(null, response);
      try {
        const errorData = await response.json();
        error.data = errorData;
      } catch {
        // If response is not JSON, ignore
      }
      throw error;
    }

    return handleResponse<T>(response);
  } catch (error: any) {
    // Re-throw if it's already an ApiError
    if (error.status !== undefined || (error.message && !error.stack)) {
      throw error;
    }

    // Otherwise, wrap it
    throw handleError(error);
  }
};

/**
 * Make a streaming HTTP request
 */
const streamRequest = (
  method: HttpMethod,
  path: string,
  config: ApiRequestConfig = {}
): Promise<StreamingResponse> => {
  const {
    skipAuth: explicitSkipAuth = false,
    token,
    apiKey,
    authType = 'bearer',
    headers: customHeaders = {},
    ...fetchConfig
  } = config;

  // Determine if auth should be skipped (explicit or public route)
  const skipAuth = shouldSkipAuth(path, explicitSkipAuth);

  // Build headers
  const defaultHeaders = getDefaultHeaders();
  const headers: HeadersInit = {
    ...defaultHeaders,
    ...customHeaders,
  };

  // Add authentication headers if not skipped
  // This acts as an interceptor - automatically adds token to all authenticated routes
  if (!skipAuth) {
    const authHeaders = getAuthHeaders(authType, token, apiKey);
    Object.assign(headers, authHeaders);
  }

  // Build request config
  const requestConfig: RequestInit = {
    method,
    headers,
    ...fetchConfig,
  };

  // Build URL
  const url = buildUrl(path);

  return fetch(url, requestConfig).then((response) => {
    // Handle non-ok responses
    if (!response.ok) {
      const error = handleError(null, response);
      throw error;
    }

    // Get the reader from the response body
    const body = response.body;
    if (!body) {
      throw new Error('Response body is not available for streaming');
    }

    const reader = body.getReader();

    return {
      response,
      reader,
      cancel: () => {
        reader.cancel();
      },
    };
  });
};

/**
 * GET request
 */
export const get = <T = any>(
  path: string,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> => {
  return request<T>('GET', path, config);
};

/**
 * POST request
 */
export const post = <T = any>(
  path: string,
  data?: any,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> => {
  return request<T>('POST', path, {
    ...config,
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PUT request
 */
export const put = <T = any>(
  path: string,
  data?: any,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> => {
  return request<T>('PUT', path, {
    ...config,
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * PATCH request
 */
export const patch = <T = any>(
  path: string,
  data?: any,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> => {
  return request<T>('PATCH', path, {
    ...config,
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * DELETE request
 */
export const del = <T = any>(
  path: string,
  config?: ApiRequestConfig
): Promise<ApiResponse<T>> => {
  return request<T>('DELETE', path, config);
};

/**
 * Stream request - returns a ReadableStream reader
 * 
 * @param method - HTTP method
 * @param path - API path
 * @param config - Request configuration
 * @returns StreamingResponse with reader and cancel method
 * 
 * @example
 * ```ts
 * const stream = await stream('POST', '/chat/stream', {
 *   body: JSON.stringify({ message: 'Hello' })
 * });
 * 
 * const decoder = new TextDecoder();
 * while (true) {
 *   const { done, value } = await stream.reader.read();
 *   if (done) break;
 *   const chunk = decoder.decode(value);
 *   console.log(chunk);
 * }
 * ```
 */
export const stream = (
  method: HttpMethod,
  path: string,
  config?: ApiRequestConfig
): Promise<StreamingResponse> => {
  return streamRequest(method, path, config);
};

/**
 * Stream POST request
 */
export const streamPost = (
  path: string,
  data?: any,
  config?: ApiRequestConfig
): Promise<StreamingResponse> => {
  return streamRequest('POST', path, {
    ...config,
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Stream GET request
 */
export const streamGet = (
  path: string,
  config?: ApiRequestConfig
): Promise<StreamingResponse> => {
  return streamRequest('GET', path, config);
};

/**
 * Parse Server-Sent Events (SSE) stream
 * 
 * @param reader - ReadableStream reader
 * @param onData - Callback for each SSE data event
 * @param onError - Optional error callback
 * @param onComplete - Optional completion callback
 * 
 * @example
 * ```ts
 * const stream = await streamPost('/chat/stream', { message: 'Hello' });
 * 
 * await parseSSE(stream.reader, (data) => {
 *   console.log('Received:', data);
 * });
 * ```
 */
const parseSSE = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onData: SSEDataCallback,
  onError?: StreamErrorCallback,
  onComplete?: StreamCompleteCallback
): Promise<void> => {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (onComplete) onComplete();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) continue;

        // Parse SSE format: "data: {...}" or "event: name\ndata: {...}"
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.substring(6); // Remove 'data: ' prefix
          
          // Check for [DONE] signal
          if (data === '[DONE]' || data.trim() === '[DONE]') {
            if (onComplete) onComplete();
            return;
          }

          try {
            // Try to parse as JSON
            const parsed = JSON.parse(data);
            onData(parsed);
          } catch (e) {
            // If not JSON, pass as string
            onData(data);
          }
        } else if (trimmedLine.startsWith('event: ')) {
          // Handle event type (can be used for future enhancements)
          const eventType = trimmedLine.substring(7);
          // Event type will be passed to onData callback if needed
        }
      }
    }
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } else {
      throw error;
    }
  }
};

/**
 * Stream raw chunks (non-SSE)
 * 
 * @param reader - ReadableStream reader
 * @param onChunk - Callback for each chunk
 * @param onError - Optional error callback
 * @param onComplete - Optional completion callback
 */
const streamRaw = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: StreamChunkCallback,
  onError?: StreamErrorCallback,
  onComplete?: StreamCompleteCallback
): Promise<void> => {
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (onComplete) onComplete();
        break;
      }

      onChunk(value);
    }
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } else {
      throw error;
    }
  }
};

/**
 * Create an API client instance with custom configuration
 * Useful for creating domain-specific API modules
 */
export const createApiClient = (baseConfig?: ApiRequestConfig) => {
  return {
    get: <T = any>(path: string, config?: ApiRequestConfig) =>
      get<T>(path, { ...baseConfig, ...config }),
    
    post: <T = any>(path: string, data?: any, config?: ApiRequestConfig) =>
      post<T>(path, data, { ...baseConfig, ...config }),
    
    put: <T = any>(path: string, data?: any, config?: ApiRequestConfig) =>
      put<T>(path, data, { ...baseConfig, ...config }),
    
    patch: <T = any>(path: string, data?: any, config?: ApiRequestConfig) =>
      patch<T>(path, data, { ...baseConfig, ...config }),
    
    delete: <T = any>(path: string, config?: ApiRequestConfig) =>
      del<T>(path, { ...baseConfig, ...config }),
    
    stream: (method: HttpMethod, path: string, config?: ApiRequestConfig) =>
      stream(method, path, { ...baseConfig, ...config }),
    
    streamPost: (path: string, data?: any, config?: ApiRequestConfig) =>
      streamPost(path, data, { ...baseConfig, ...config }),
    
    streamGet: (path: string, config?: ApiRequestConfig) =>
      streamGet(path, { ...baseConfig, ...config }),
  };
};

// Export types for use in other modules
export type {
  ApiRequestConfig,
  ApiResponse,
  ApiError,
  HttpMethod,
  AuthType,
  StreamingResponse,
  SSEDataCallback,
  StreamChunkCallback,
  StreamErrorCallback,
  StreamCompleteCallback,
};

// Export streaming utilities
export { parseSSE, streamRaw };
