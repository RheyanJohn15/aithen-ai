/**
 * Authentication API Endpoints
 * 
 * Provides API functions for authentication operations:
 * - login: Authenticate user and receive JWT token
 * - register: Create a new user account
 * - signout: Sign out the current user
 * - refresh: Refresh the JWT token
 */

import { post } from './api';
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
  name?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Authentication response (typically contains token and user info)
 */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    [key: string]: any;
  };
  expiresIn?: number;
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
  refreshToken?: string; // Optional, can use stored refresh token
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
 * @param refreshTokenData - Optional refresh token (if not provided, uses stored refresh token)
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
export const refresh = async (
  refreshTokenData?: RefreshTokenRequest
): Promise<ApiResponse<AuthResponse>> => {
  // Get refresh token from parameter or localStorage
  let refreshToken = refreshTokenData?.refreshToken;
  
  if (!refreshToken && typeof window !== 'undefined') {
    try {
      refreshToken = localStorage.getItem('refresh_token') || undefined;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
    }
  }

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await post<AuthResponse>(
    '/auth/refresh',
    { refreshToken },
    {
      skipAuth: true, // Refresh endpoint typically doesn't require current token
    }
  );

  // Update stored token if new token is provided
  if (response.data.token) {
    setToken(response.data.token);
  }

  // Update refresh token if new one is provided
  if (response.data.refreshToken && typeof window !== 'undefined') {
    try {
      localStorage.setItem('refresh_token', response.data.refreshToken);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
    }
  }

  return response;
};

