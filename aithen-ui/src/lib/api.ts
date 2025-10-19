/**
 * Get the appropriate API URL based on environment configuration
 */
export const getApiUrl = (): string => {
  const useProdApi = process.env.NEXT_PUBLIC_USE_PROD_API === 'true';
  
  if (useProdApi) {
    return process.env.NEXT_PUBLIC_API_PROD || 'https://your-production-api.com/api';
  }
  
  return process.env.NEXT_PUBLIC_API_DEV || 'http://localhost:8080/api';
};

/**
 * Get API health check URL
 */
export const getApiHealthUrl = (): string => {
  return `${getApiUrl()}/ai/health`;
};

/**
 * Get API chat stream URL
 */
export const getApiChatStreamUrl = (): string => {
  return `${getApiUrl()}/ai/chat/stream`;
};

/**
 * Get API personalities URL
 */
export const getApiPersonalitiesUrl = (): string => {
  return `${getApiUrl()}/ai/personalities`;
};

/**
 * Get API personality by ID URL
 */
export const getApiPersonalityUrl = (id: string): string => {
  return `${getApiUrl()}/ai/personalities/${id}`;
};

/**
 * Check if we're using production API
 */
export const isUsingProdApi = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_PROD_API === 'true';
};

/**
 * Get current environment info for debugging
 */
export const getApiInfo = () => {
  return {
    useProdApi: isUsingProdApi(),
    apiUrl: getApiUrl(),
    devUrl: process.env.NEXT_PUBLIC_API_DEV,
    prodUrl: process.env.NEXT_PUBLIC_API_PROD,
  };
};
