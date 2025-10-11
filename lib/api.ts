// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  // Get API base URL at runtime
  const getApiBaseUrl = () => {
    // In production, use Railway API URL
    if (process.env.NODE_ENV === 'production') {
      return process.env.NEXT_PUBLIC_API_URL || 'https://easy-order-system-production-0490.up.railway.app';
    }
    // In development, use local API
    return '';
  };

  const baseUrl = getApiBaseUrl();
  
  // If no base URL, use relative path (local development)
  if (!baseUrl) {
    return fetch(endpoint, options);
  }
  
  // Remove trailing slash from base URL and leading slash from endpoint
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `${cleanBaseUrl}/${cleanEndpoint}`;
  
  return fetch(url, options);
};
