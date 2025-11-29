/**
 * Session Storage Handlers
 * 
 * Manages user session data in browser sessionStorage
 */

import type { User } from '@/api/authApi';

const SESSION_STORAGE_KEY = 'aithen_user_session';

/**
 * User session data structure
 */
export interface UserSession {
  user: User;
  timestamp: number; // When the session was created/updated
}

/**
 * Store user data in session storage
 * 
 * @param user - User object to store
 * @returns void
 */
export function setUserSession(user: User): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const sessionData: UserSession = {
      user,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to store user session:', error);
  }
}

/**
 * Get user data from session storage
 * 
 * @returns User object or null if not found
 */
export function getUserSession(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) {
      return null;
    }

    const parsed: UserSession = JSON.parse(sessionData);
    return parsed.user;
  } catch (error) {
    console.error('Failed to retrieve user session:', error);
    return null;
  }
}

/**
 * Get full session data from session storage
 * 
 * @returns UserSession object or null if not found
 */
export function getFullSession(): UserSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData) as UserSession;
  } catch (error) {
    console.error('Failed to retrieve full session:', error);
    return null;
  }
}

/**
 * Clear user session from session storage
 * 
 * @returns void
 */
export function clearUserSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear user session:', error);
  }
}

/**
 * Check if user session exists
 * 
 * @returns boolean indicating if session exists
 */
export function hasUserSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY) !== null;
  } catch (error) {
    console.error('Failed to check user session:', error);
    return false;
  }
}

/**
 * Update user data in session storage (partial update)
 * 
 * @param updates - Partial user object with fields to update
 * @returns void
 */
export function updateUserSession(updates: Partial<User>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentSession = getFullSession();
    if (!currentSession) {
      console.warn('No existing session to update');
      return;
    }

    const updatedUser: User = {
      ...currentSession.user,
      ...updates,
    };

    setUserSession(updatedUser);
  } catch (error) {
    console.error('Failed to update user session:', error);
  }
}
