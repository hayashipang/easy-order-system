/**
 * Railway 環境的圖片處理工具
 * 由於 Railway 的檔案系統是暫時的，需要特殊處理
 */

export function isRailwayEnvironment(): boolean {
  return process.env.RAILWAY_PUBLIC_DOMAIN !== undefined || 
         process.env.RAILWAY_ENVIRONMENT !== undefined;
}

export function getRailwayImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // 如果已經是完整的 URL，直接返回
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // 在 Railway 環境中，圖片可能不存在，返回一個佔位符
  if (isRailwayEnvironment()) {
    // 檢查是否為 Railway 域名
    const isRailwayDomain = imagePath.includes('railway.app');
    if (isRailwayDomain) {
      // 返回一個佔位符圖片 URL
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="150" fill="#f3f4f6"/>
          <text x="100" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">
            圖片載入中...
          </text>
        </svg>
      `)}`;
    }
  }
  
  return imagePath;
}

export function createPlaceholderImage(text: string = '圖片載入中'): string {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f3f4f6"/>
      <text x="100" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">
        ${text}
      </text>
    </svg>
  `)}`;
}
