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
    
    // For production, ALWAYS use relative URLs (same domain as frontend)
    // This ensures we never accidentally call external APIs
    return ''; // Empty string means relative URL
  };

  const baseUrl = getApiBaseUrl();
  
  // Remove trailing slash from base URL and leading slash from endpoint
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = cleanBaseUrl ? `${cleanBaseUrl}/${cleanEndpoint}` : `/${cleanEndpoint}`;
  
  console.log('API Call:', url, 'Base URL:', baseUrl); // Debug log - Vercel only
  
  return fetch(url, options);
};
