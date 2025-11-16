/**
 * API Configuration
 */

/**
 * Get the base API URL based on environment configuration
 */
export const getBaseUrl = (): string => {
  const useProdApi = process.env.NEXT_PUBLIC_USE_PROD_API === 'true';
  
  if (useProdApi) {
    return process.env.NEXT_PUBLIC_API_PROD || 'http://localhost:8080/api';
  }
  
  return process.env.NEXT_PUBLIC_API_DEV || 'http://localhost:8080/api';
};

/**
 * Default request timeout in milliseconds
 */
export const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Default headers for all requests
 */
export const getDefaultHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
};

