/**
 * Chat API Endpoints
 * 
 * Provides API functions for chat operations:
 * - createChat: Create a new chat
 * - getChat: Get a chat by ID with messages
 * - getChats: Get all chats for the current user
 * - updateChat: Update a chat's title
 * - deleteChat: Delete a chat
 */

import { post, get, put, del } from './api';
import type { ApiResponse } from './types';

/**
 * Chat information
 */
export interface Chat {
  id: string; // Always string to avoid precision loss with large Snowflake IDs
  user_id: string; // Always string to avoid precision loss
  title: string;
  created_at: string;
  updated_at: string;
}

/**
 * Message in a chat
 */
export interface ChatMessage {
  id: string; // Always string to avoid precision loss
  chat_id: string; // Always string to avoid precision loss
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/**
 * Create chat request payload
 */
export interface CreateChatRequest {
  title?: string;
}

/**
 * Update chat request payload
 */
export interface UpdateChatRequest {
  title: string;
}

/**
 * Chat with messages response
 */
export interface ChatWithMessages {
  chat: Chat;
  messages: ChatMessage[];
}

/**
 * Create a new chat
 * 
 * @param title - Optional title for the chat
 * @returns Created chat
 * 
 * @example
 * ```ts
 * try {
 *   const response = await createChat({ title: 'My New Chat' });
 *   console.log('Chat created:', response.data);
 * } catch (error) {
 *   console.error('Failed to create chat:', error);
 * }
 * ```
 */
export const createChat = async (
  data?: CreateChatRequest
): Promise<ApiResponse<Chat>> => {
  return post<Chat>('/chats', data || {});
};

/**
 * Get a chat by ID with all messages
 * 
 * @param id - Chat ID
 * @returns Chat with messages
 * 
 * @example
 * ```ts
 * try {
 *   const response = await getChat(123);
 *   console.log('Chat:', response.data.chat);
 *   console.log('Messages:', response.data.messages);
 * } catch (error) {
 *   console.error('Failed to get chat:', error);
 * }
 * ```
 */
export const getChat = async (id: number | string): Promise<ApiResponse<ChatWithMessages>> => {
  // Keep as string to avoid precision loss with large Snowflake IDs
  return get<ChatWithMessages>(`/chats/${id}`);
};

/**
 * Get all chats for the current user
 * 
 * @returns Array of chats
 * 
 * @example
 * ```ts
 * try {
 *   const response = await getChats();
 *   console.log('Chats:', response.data);
 * } catch (error) {
 *   console.error('Failed to get chats:', error);
 * }
 * ```
 */
export const getChats = async (): Promise<ApiResponse<Chat[]>> => {
  return get<Chat[]>('/chats');
};

/**
 * Update a chat's title
 * 
 * @param id - Chat ID
 * @param title - New title
 * @returns Updated chat
 * 
 * @example
 * ```ts
 * try {
 *   const response = await updateChat(123, { title: 'Updated Title' });
 *   console.log('Chat updated:', response.data);
 * } catch (error) {
 *   console.error('Failed to update chat:', error);
 * }
 * ```
 */
export const updateChat = async (
  id: number,
  data: UpdateChatRequest
): Promise<ApiResponse<Chat>> => {
  return put<Chat>(`/chats/${id}`, data);
};

/**
 * Delete a chat
 * 
 * @param id - Chat ID
 * @returns Success response
 * 
 * @example
 * ```ts
 * try {
 *   await deleteChat(123);
 *   console.log('Chat deleted');
 * } catch (error) {
 *   console.error('Failed to delete chat:', error);
 * }
 * ```
 */
export const deleteChat = async (id: string): Promise<ApiResponse<void>> => {
  return del<void>(`/chats/${id}`);
};

/**
 * Add a message to a chat
 * 
 * @param chatId - Chat ID (string)
 * @param role - Message role ('user', 'assistant', or 'system')
 * @param content - Message content
 * @returns Created message
 */
export const addMessage = async (
  chatId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ApiResponse<ChatMessage>> => {
  return post<ChatMessage>(`/chats/${chatId}/messages`, { role, content });
};

