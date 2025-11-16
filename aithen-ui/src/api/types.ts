/**
 * API Types and Interfaces
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type AuthType = 'bearer' | 'api-key';

export interface ApiRequestConfig extends RequestInit {
  /**
   * Skip authentication headers (useful for public endpoints)
   */
  skipAuth?: boolean;
  
  /**
   * Custom authentication token (overrides default token getter)
   */
  token?: string;
  
  /**
   * Custom API key (for future API key support)
   */
  apiKey?: string;
  
  /**
   * Authentication type to use
   */
  authType?: AuthType;
  
  /**
   * Request timeout in milliseconds
   * Note: Timeout is not applied to streaming requests
   */
  timeout?: number;
  
  /**
   * Enable streaming response (returns ReadableStream instead of parsed JSON)
   */
  stream?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
}

/**
 * Token getter function type
 * Should return the JWT token or null if not available
 */
export type TokenGetter = () => string | null;

/**
 * API key getter function type
 * Should return the API key or null if not available
 */
export type ApiKeyGetter = () => string | null;

/**
 * Streaming response interface
 */
export interface StreamingResponse {
  response: Response;
  reader: ReadableStreamDefaultReader<Uint8Array>;
  /**
   * Cancel the stream
   */
  cancel: () => void;
}

/**
 * SSE (Server-Sent Events) data parser callback
 * Called for each parsed SSE event
 */
export type SSEDataCallback = (data: any, event?: string) => void;

/**
 * Raw stream chunk callback
 * Called for each raw chunk from the stream
 */
export type StreamChunkCallback = (chunk: Uint8Array) => void;

/**
 * Stream error callback
 */
export type StreamErrorCallback = (error: Error) => void;

/**
 * Stream complete callback
 */
export type StreamCompleteCallback = () => void;

