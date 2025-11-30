/**
 * Authentication API Endpoints
 * 
 * Provides API functions for authentication operations:
 * - login: Authenticate user and receive JWT token
 * - register: Create a new user account
 * - signout: Sign out the current user
 * - refresh: Refresh the JWT token
 */

import { post, get } from './api';
import { setToken, removeToken } from './auth';
import type { ApiResponse } from './types';

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  // Organization fields
  organization_name: string;
  organization_slug?: string;
  organization_description?: string;
  organization_website?: string;
  organization_email?: string;
  organization_phone?: string;
  organization_address?: string;
  organization_logo_url?: string;
}

/**
 * User information
 */
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication response (typically contains token and user info)
 */
export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string; // Optional refresh token
}

/**
 * Refresh token request payload (deprecated - no longer needed)
 * @deprecated The refresh endpoint now uses the current JWT token automatically
 */
export interface RefreshTokenRequest {
  refreshToken?: string; // Deprecated - not used anymore
}

/**
 * Login user and automatically store the token
 * 
 * @param credentials - User email and password
 * @returns Authentication response with token and user info
 * 
 * @example
 * ```ts
 * try {
 *   const response = await login({ email: 'user@example.com', password: 'password123' });
 *   console.log('Logged in:', response.data.user);
 * } catch (error) {
 *   console.error('Login failed:', error);
 * }
 * ```
 */
export const login = async (
  credentials: LoginRequest
): Promise<ApiResponse<AuthResponse>> => {
  const response = await post<AuthResponse>(
    '/auth/login',
    credentials,
    {
      skipAuth: true, // Login endpoint doesn't require authentication
    }
  );

  // Automatically store the token if present
  if (response.data.token) {
    setToken(response.data.token);
  }

  // Store refresh token if provided
  if (response.data.refreshToken && typeof window !== 'undefined') {
    try {
      localStorage.setItem('refresh_token', response.data.refreshToken);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
    }
  }

  return response;
};

/**
 * Register a new user account
 * 
 * @param userData - User registration data (email, password, name, etc.)
 * @returns Authentication response with token and user info
 * 
 * @example
 * ```ts
 * try {
 *   const response = await register({
 *     email: 'newuser@example.com',
 *     password: 'password123',
 *     name: 'John Doe'
 *   });
 *   console.log('Registered:', response.data.user);
 * } catch (error) {
 *   console.error('Registration failed:', error);
 * }
 * ```
 */
export const register = async (
  userData: RegisterRequest
): Promise<ApiResponse<AuthResponse>> => {
  const response = await post<AuthResponse>(
    '/auth/register',
    userData,
    {
      skipAuth: true, // Registration endpoint doesn't require authentication
    }
  );

  // Automatically store the token if present
  if (response.data.token) {
    setToken(response.data.token);
  }

  // Store refresh token if provided
  if (response.data.refreshToken && typeof window !== 'undefined') {
    try {
      localStorage.setItem('refresh_token', response.data.refreshToken);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
    }
  }

  return response;
};

/**
 * Sign out the current user
 * 
 * Removes the stored token and optionally calls the backend to invalidate the session.
 * 
 * @param invalidateOnServer - Whether to call the backend to invalidate the token (default: true)
 * @returns API response
 * 
 * @example
 * ```ts
 * try {
 *   await signout();
 *   console.log('Signed out successfully');
 * } catch (error) {
 *   console.error('Signout failed:', error);
 *   // Still remove token locally even if server call fails
 *   removeToken();
 * }
 * ```
 */
export const signout = async (
  invalidateOnServer: boolean = true
): Promise<ApiResponse<void>> => {
  try {
    if (invalidateOnServer) {
      // Call backend to invalidate the token
      await post<void>('/auth/logout', {}, {
        // Token will be included automatically
      });
    }
  } catch (error) {
    // Log error but continue with local cleanup
    console.warn('Server signout failed, continuing with local cleanup:', error);
  } finally {
    // Always remove tokens locally
    removeToken();
    
    // Remove refresh token if stored
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('refresh_token');
      } catch (error) {
        console.error('Failed to remove refresh token:', error);
      }
    }
  }

  // Return a success response even if server call failed
  return {
    data: undefined,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
  };
};

/**
 * Refresh the JWT token
 * 
 * Uses the current JWT token to get a new one. The token is automatically included from storage.
 * 
 * @returns New authentication response with refreshed token
 * 
 * @example
 * ```ts
 * try {
 *   const response = await refresh();
 *   console.log('Token refreshed');
 * } catch (error) {
 *   console.error('Token refresh failed:', error);
 *   // Redirect to login
 * }
 * ```
 */
export const refresh = async (): Promise<ApiResponse<{ token: string }>> => {
  // Token is automatically included via interceptor (skipAuth: false by default)
  const response = await post<{ token: string }>(
    '/auth/refresh',
    {},
    {
      // Token will be automatically added by interceptor
    }
  );

  // Update stored token if new token is provided
  if (response.data.token) {
    setToken(response.data.token);
  }

  return response;
};

/**
 * Get the current authenticated user
 * 
 * @returns Current user information
 * 
 * @example
 * ```ts
 * try {
 *   const response = await getCurrentUser();
 *   console.log('Current user:', response.data);
 * } catch (error) {
 *   console.error('Failed to get user:', error);
 *   // Token might be invalid, redirect to login
 * }
 * ```
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  // Token is automatically included via interceptor (skipAuth: false by default)
  return get<User>('/auth/me');
};

