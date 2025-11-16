/**
 * Authentication utilities for API requests
 */

import type { AuthType, TokenGetter, ApiKeyGetter } from './types';

/**
 * Default token storage key (can be customized)
 */
const DEFAULT_TOKEN_KEY = 'auth_token';
const DEFAULT_API_KEY_KEY = 'api_key';

/**
 * Default token getter - retrieves token from localStorage
 * Can be overridden by setting a custom token getter
 */
let tokenGetter: TokenGetter = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(DEFAULT_TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Default API key getter - retrieves API key from localStorage
 * Can be overridden by setting a custom API key getter
 */
let apiKeyGetter: ApiKeyGetter = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(DEFAULT_API_KEY_KEY);
  } catch {
    return null;
  }
};

/**
 * Set a custom token getter function
 */
export const setTokenGetter = (getter: TokenGetter): void => {
  tokenGetter = getter;
};

/**
 * Set a custom API key getter function
 */
export const setApiKeyGetter = (getter: ApiKeyGetter): void => {
  apiKeyGetter = getter;
};

/**
 * Get the current authentication token
 */
export const getToken = (): string | null => {
  return tokenGetter();
};

/**
 * Get the current API key
 */
export const getApiKey = (): string | null => {
  return apiKeyGetter();
};

/**
 * Set the authentication token in localStorage
 */
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEFAULT_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to set token:', error);
  }
};

/**
 * Set the API key in localStorage
 */
export const setApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEFAULT_API_KEY_KEY, key);
  } catch (error) {
    console.error('Failed to set API key:', error);
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEFAULT_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};

/**
 * Remove the API key from localStorage
 */
export const removeApiKey = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEFAULT_API_KEY_KEY);
  } catch (error) {
    console.error('Failed to remove API key:', error);
  }
};

/**
 * Get authentication headers based on auth type
 */
export const getAuthHeaders = (
  authType: AuthType = 'bearer',
  token?: string,
  apiKey?: string
): HeadersInit => {
  const headers: HeadersInit = {};

  if (authType === 'bearer') {
    const authToken = token || getToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  } else if (authType === 'api-key') {
    const key = apiKey || getApiKey();
    if (key) {
      headers['X-API-Key'] = key;
    }
  }

  return headers;
};

