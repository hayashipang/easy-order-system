// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  // Get API base URL at runtime
  const getApiBaseUrl = () => {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      // In development, check for custom API URL
      const customApiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (customApiUrl) {
        return customApiUrl;
      }
      return 'http://localhost:4000';
    }
    
    // For production, use Railway backend URL
    // Check if we have a custom API URL set
    const customApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (customApiUrl) {
      return customApiUrl;
    }
    
    // Fallback to Railway backend (if no custom URL is set)
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
