// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  // Get API base URL at runtime
  const getApiBaseUrl = () => {
    // Check if we have a custom API URL set (for local development)
    const customApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (customApiUrl) {
      return customApiUrl;
    }
    
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:4000';
    }
    
    // Default to Railway API URL for production
    return 'https://easy-order-system-production-0490.up.railway.app';
  };

  const baseUrl = getApiBaseUrl();
  
  // Remove trailing slash from base URL and leading slash from endpoint
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `${cleanBaseUrl}/${cleanEndpoint}`;
  
  console.log('API Call:', url); // Debug log
  
  return fetch(url, options);
};
