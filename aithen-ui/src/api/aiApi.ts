/**
 * AI Service API Endpoints
 * 
 * Provides API functions for AI chat and personality operations:
 * - chat: Non-streaming chat request
 * - chatStream: Streaming chat request (SSE)
 * - getPersonalities: List all available personalities
 * - getPersonality: Get a specific personality by ID
 */

import { post, streamPost, parseSSE, get, type ApiResponse, type StreamingResponse } from './index';

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Chat request payload
 */
export interface ChatRequest {
  messages: ChatMessage[];
  personality?: string;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Chat response (non-streaming)
 */
export interface ChatResponse {
  response: string;
}

/**
 * Personality interface
 */
export interface Personality {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  core_traits?: string[];
  example_dialogue?: Array<{
    user: string;
    assistant: string;
  }>;
  tone_guidelines?: {
    preferred_style: string;
    avoid: string[];
    include: string[];
  };
}

/**
 * SSE data chunk from streaming chat
 */
export interface ChatStreamChunk {
  content?: string;
  error?: string;
}

/**
 * Non-streaming chat request
 * 
 * @param request - Chat request with messages and optional personality
 * @returns Chat response
 * 
 * @example
 * ```ts
 * const response = await chat({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   personality: 'aithen_core'
 * });
 * console.log(response.data.response);
 * ```
 */
export const chat = async (
  request: ChatRequest
): Promise<ApiResponse<ChatResponse>> => {
  return post<ChatResponse>('/ai/chat', {
    ...request,
    stream: false,
  });
};

/**
 * Streaming chat request (SSE)
 * 
 * @param request - Chat request with messages and optional personality
 * @returns StreamingResponse with reader
 * 
 * @example
 * ```ts
 * const stream = await chatStream({
 *   messages: [{ role: 'user', content: 'Hello!' }],
 *   personality: 'aithen_core'
 * });
 * 
 * await parseSSE(stream.reader, (data) => {
 *   if (data.content) {
 *     console.log('Chunk:', data.content);
 *   }
 * });
 * ```
 */
export const chatStream = async (
  request: ChatRequest
): Promise<StreamingResponse> => {
  return streamPost('/ai/chat/stream', {
    ...request,
    stream: true,
  });
};

/**
 * Stream chat with callback helper
 * Convenience function that combines chatStream and parseSSE
 * 
 * @param request - Chat request
 * @param onChunk - Callback for each content chunk
 * @param onError - Optional error callback
 * @param onComplete - Optional completion callback
 * 
 * @example
 * ```ts
 * await streamChatWithCallback(
 *   { messages: [{ role: 'user', content: 'Hello!' }] },
 *   (content) => {
 *     console.log('Received:', content);
 *     // Update UI
 *   }
 * );
 * ```
 */
export const streamChatWithCallback = async (
  request: ChatRequest,
  onChunk: (content: string) => void,
  onError?: (error: Error) => void,
  onComplete?: () => void
): Promise<void> => {
  try {
    const stream = await chatStream(request);
    
    await parseSSE(
      stream.reader,
      (data: ChatStreamChunk) => {
        if (data.content) {
          onChunk(data.content);
        } else if (data.error) {
          if (onError) {
            onError(new Error(data.error));
          }
        }
      },
      onError,
      onComplete
    );
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    } else {
      throw error;
    }
  }
};

/**
 * Get all available personalities
 * 
 * @returns List of personality IDs
 * 
 * @example
 * ```ts
 * const response = await getPersonalities();
 * console.log('Available personalities:', response.data);
 * ```
 */
export const getPersonalities = async (): Promise<ApiResponse<string[]>> => {
  return get<string[]>('/ai/personalities');
};

/**
 * Get a specific personality by ID
 * 
 * @param id - Personality ID
 * @returns Personality details
 * 
 * @example
 * ```ts
 * const response = await getPersonality('aithen_core');
 * console.log('Personality:', response.data);
 * ```
 */
export const getPersonality = async (
  id: string
): Promise<ApiResponse<Personality>> => {
  return get<Personality>(`/ai/personalities/${id}`);
};

