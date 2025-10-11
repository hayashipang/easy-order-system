// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  // Get API base URL at runtime
  const getApiBaseUrl = () => {
    // Always use Railway API URL in production (Vercel deployment)
    if (typeof window !== 'undefined') {
      // Client-side: use Railway API URL
      return 'https://easy-order-system-production-0490.up.railway.app';
    }
    // Server-side: check environment variable
    return process.env.NEXT_PUBLIC_API_URL || 'https://easy-order-system-production-0490.up.railway.app';
  };

  const baseUrl = getApiBaseUrl();
  
  // Remove trailing slash from base URL and leading slash from endpoint
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `${cleanBaseUrl}/${cleanEndpoint}`;
  
  console.log('API Call:', url); // Debug log
  
  return fetch(url, options);
};
