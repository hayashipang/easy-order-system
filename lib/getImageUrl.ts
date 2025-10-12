/**
 * 根據環境生成正確的圖片 URL
 */
export function getImageUrl(imagePath: string): string {
  // 如果已經是完整的 URL，直接返回
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // 根據環境決定基礎 URL
  let baseUrl = '';
  
  if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  } else if (process.env.RAILWAY_STATIC_URL) {
    baseUrl = process.env.RAILWAY_STATIC_URL;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  } else if (process.env.NODE_ENV === 'production') {
    // 在生產環境中，如果是 Railway 部署，使用已知的域名
    baseUrl = 'https://easy-order-system-production-0490.up.railway.app';
  }
  
  // 確保路徑以 / 開頭
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

/**
 * 客戶端使用的圖片 URL 生成函數
 */
export function getClientImageUrl(imagePath: string): string {
  // 如果已經是完整的 URL，直接返回
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // 在客戶端，使用相對路徑或當前域名
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  }
  
  // 服務端渲染時使用相對路徑
  return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
}
