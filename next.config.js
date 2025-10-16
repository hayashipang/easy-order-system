/** @type {import('next').NextConfig} */
const nextConfig = {
  // 配置靜態文件服務
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/static/:path*',
      },
    ];
  },
  
  // 配置圖片優化
  images: {
    domains: [
      'easy-order-system.vercel.app',
      'web-production-6ebe9.up.railway.app',
      'easy-order-system-production-0490.up.railway.app'
    ],
    unoptimized: true, // 在 Railway 環境中禁用圖片優化
  },
  
  // 配置輸出 - 移除standalone模式以解決Railway部署問題
  // output: 'standalone',
  
  // 配置環境變數
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
