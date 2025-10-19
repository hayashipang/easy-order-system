'use client';

import { useState, useEffect } from 'react';

export default function TestMenuChanges() {
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null);

  useEffect(() => {
    // 獲取當前時間作為部署檢查
    setDeploymentInfo({
      timestamp: new Date().toISOString(),
      expectedTitle: '菜單瀏覽',
      expectedButton: '取購物/訂單查詢',
      deploymentTime: '2024-01-XX (最新修改)'
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">菜單修改測試頁面</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">預期修改內容</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">標題：</span>
              <span className="text-green-600 font-semibold">菜單瀏覽</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">按鈕：</span>
              <span className="text-green-600 font-semibold">取購物/訂單查詢</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-gray-700 w-32">手機優化：</span>
              <span className="text-green-600 font-semibold">已啟用</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">部署信息</h2>
          {deploymentInfo && (
            <div className="space-y-2 text-sm">
              <div>檢查時間: {deploymentInfo.timestamp}</div>
              <div>Git提交: b476c30 (優化菜單瀏覽頁面標題和手機端編排)</div>
              <div>部署狀態: 已部署到生產環境</div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">如果看不到修改</h2>
          <div className="space-y-2 text-sm">
            <div>1. 硬刷新頁面: Ctrl+F5 (Windows) 或 Cmd+Shift+R (Mac)</div>
            <div>2. 清除瀏覽器緩存</div>
            <div>3. 使用無痕模式</div>
            <div>4. 確認URL: https://easy-order-system-v3.vercel.app/menu-browse</div>
          </div>
        </div>

        <div className="flex space-x-4">
          <a 
            href="/menu-browse" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往菜單瀏覽頁面
          </a>
          <a 
            href="https://easy-order-system-v3.vercel.app/menu-browse" 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            生產環境菜單瀏覽
          </a>
        </div>
      </div>
    </div>
  );
}
