/**
 * Centralized API Module
 * 
 * This module provides a centralized API client with:
 * - Conditional base URL based on environment variables
 * - JWT Bearer token authentication (with future API key support)
 * - All HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Extensible architecture for domain-specific API modules
 * 
 * Usage:
 * ```ts
 * import { get, post, put, del } from '@/api';
 * 
 * // Simple GET request
 * const response = await get('/users');
 * 
 * // POST with data
 * const response = await post('/users', { name: 'John' });
 * 
 * // With custom config
 * const response = await get('/users', { 
 *   timeout: 5000,
 *   skipAuth: true 
 * });
 * ```
 * 
 * Creating domain-specific API modules:
 * ```ts
 * import { createApiClient } from '@/api';
 * 
 * const userApi = createApiClient({ timeout: 10000 });
 * 
 * export const getUser = (id: string) => userApi.get(`/users/${id}`);
 * export const createUser = (data: UserData) => userApi.post('/users', data);
 * ```
 */

// Core API methods
export {
  get,
  post,
  put,
  patch,
  del,
  createApiClient,
  // Streaming methods
  stream,
  streamPost,
  streamGet,
  parseSSE,
  streamRaw,
} from './api';

// Authentication utilities
export {
  getToken,
  setToken,
  removeToken,
  getApiKey,
  setApiKey,
  removeApiKey,
  setTokenGetter,
  setApiKeyGetter,
} from './auth';

// Configuration
export {
  getBaseUrl,
  getDefaultHeaders,
  DEFAULT_TIMEOUT,
} from './config';

// Authentication API endpoints
export {
  login,
  register,
  signout,
  refresh,
  getCurrentUser,
} from './authApi';

export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  User,
} from './authApi';

// AI API endpoints
export {
  chat,
  chatStream,
  streamChatWithCallback,
  getPersonalities,
  getPersonality,
} from './aiApi';

export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  Personality,
  ChatStreamChunk,
} from './aiApi';

// Chat API endpoints
export {
  createChat,
  getChat,
  getChats,
  updateChat,
  deleteChat,
  addMessage,
} from './chatApi';

export type {
  Chat,
  ChatMessage as ChatApiMessage,
  CreateChatRequest,
  UpdateChatRequest,
  ChatWithMessages,
} from './chatApi';

// Knowledge Base API endpoints
export {
  getKnowledgeBases,
  getKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  getKnowledgeBaseFiles,
  uploadKnowledgeBaseFiles,
  deleteKnowledgeBaseFile,
  trainKnowledgeBase,
  getKnowledgeBaseVersions,
  deleteKnowledgeBaseVersion,
} from './knowledgeBaseApi';

export type {
  KnowledgeBase,
  KnowledgeBaseFile,
  KnowledgeBaseVersion,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
} from './knowledgeBaseApi';

// Types
export type {
  ApiRequestConfig,
  ApiResponse,
  ApiError,
  HttpMethod,
  AuthType,
  TokenGetter,
  ApiKeyGetter,
  // Streaming types
  StreamingResponse,
  SSEDataCallback,
  StreamChunkCallback,
  StreamErrorCallback,
  StreamCompleteCallback,
} from './types';
