/**
 * 根據環境生成正確的圖片 URL
 */
export function getImageUrl(imagePath: string): string {
  // 如果已經是完整的 URL，檢查是否需要轉換
  if (imagePath.startsWith('http')) {
    // 如果是 Railway 的 /uploads/ 路徑，轉換為 /api/static/
    if (imagePath.includes('railway.app') && imagePath.includes('/uploads/')) {
      const fileName = imagePath.split('/uploads/')[1];
      const baseUrl = imagePath.split('/uploads/')[0];
      return `${baseUrl}/api/static/${fileName}`;
    }
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
  
  // 在 Railway 環境中，使用 API 路由來服務靜態文件
  if (baseUrl.includes('railway.app') && imagePath.startsWith('/uploads/')) {
    const fileName = imagePath.replace('/uploads/', '');
    return `${baseUrl}/api/static/${fileName}`;
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
