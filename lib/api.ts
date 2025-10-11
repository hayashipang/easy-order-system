// API configuration
const getApiBaseUrl = () => {
  // In production, use Railway API URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://easy-order-system-production-0490.up.railway.app';
  }
  // In development, use local API
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  // Remove trailing slash from base URL and leading slash from endpoint
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `${baseUrl}/${cleanEndpoint}`;
  return fetch(url, options);
};
