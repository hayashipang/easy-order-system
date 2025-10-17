'use client';

import { useState } from 'react';
import { apiCall } from '@/lib/api';

export default function FixDatabaseUrlPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, status: 'success' | 'error' | 'warning', data: any) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toISOString() }]);
  };

  const checkDatabaseUrl = async () => {
    setLoading(true);
    setResults([]);

    try {
      const envResponse = await apiCall('/api/test-env');
      const envData = await envResponse.json();
      
      if (envResponse.ok) {
        const databaseUrl = envData.environment.DATABASE_URL;
        const isRailway = databaseUrl && databaseUrl.includes('rlwy.net');
        const isVercel = databaseUrl && (databaseUrl.includes('vercel-storage.com') || databaseUrl.includes('vercel-db.com'));
        
        addResult('資料庫連接檢查', isRailway ? 'error' : isVercel ? 'success' : 'warning', {
          currentUrl: databaseUrl,
          isRailway,
          isVercel,
          recommendation: isRailway ? '需要更換為 Vercel Postgres' : isVercel ? '連接正常' : '需要檢查連接字串'
        });
      } else {
        addResult('資料庫連接檢查', 'error', { error: '無法檢查環境變數' });
      }
    } catch (error) {
      addResult('資料庫連接檢查', 'error', { error: '檢查失敗' });
    }

    setLoading(false);
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    
    try {
      const dbResponse = await apiCall('/api/test-db');
      const dbData = await dbResponse.json();
      
      addResult('資料庫連接測試', dbResponse.ok ? 'success' : 'error', {
        success: dbData.success,
        message: dbData.message,
        error: dbData.error || null
      });
    } catch (error) {
      addResult('資料庫連接測試', 'error', { error: '連接測試失敗' });
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-800 bg-green-100';
      case 'error': return 'text-red-800 bg-red-100';
      case 'warning': return 'text-yellow-800 bg-yellow-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-red-600 mb-2">🚨 資料庫連接修復</h1>
            <p className="text-gray-600">修復 Railway 資料庫連接問題</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">❌ 問題診斷</h3>
            <p className="text-red-800 text-sm">
              您的 Vercel 部署正在嘗試連接 Railway 資料庫 (<code>nozomi.proxy.rlwy.net:51652</code>)，
              但這個資料庫無法連接。需要更換為 Vercel Postgres。
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={checkDatabaseUrl}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  檢查中...
                </>
              ) : (
                <>
                  🔍 檢查資料庫連接
                </>
              )}
            </button>
            
            <button
              onClick={testDatabaseConnection}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  測試中...
                </>
              ) : (
                <>
                  🧪 測試資料庫連接
                </>
              )}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">檢查結果</h2>
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {getStatusIcon(result.status)} {result.test}
                    </h3>
                    <span className="text-sm opacity-75">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="bg-white bg-opacity-50 p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🔧 修復步驟</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li><strong>1. 登入 Vercel 控制台</strong> - 進入您的專案</li>
              <li><strong>2. 創建 Vercel Postgres</strong> - Storage → Create Database → Postgres</li>
              <li><strong>3. 複製新的連接字串</strong> - 從 Vercel Postgres 獲取</li>
              <li><strong>4. 更新環境變數</strong> - Settings → Environment Variables → 更新 DATABASE_URL</li>
              <li><strong>5. 重新部署</strong> - Vercel 會自動重新部署</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ 重要提醒</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 更換資料庫會導致現有資料丟失</li>
              <li>• 建議先備份重要資料</li>
              <li>• 新資料庫需要重新執行 migration</li>
              <li>• 確保所有環境變數都正確設置</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✅ 預期結果</h3>
            <p className="text-sm text-green-800">
              修復完成後，您應該看到：
            </p>
            <ul className="text-sm text-green-800 space-y-1 mt-2">
              <li>• 資料庫連接檢查顯示 ✅ 成功</li>
              <li>• 資料庫連接測試顯示 ✅ 成功</li>
              <li>• API 調用不再出現 500 錯誤</li>
              <li>• 系統功能完全恢復</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
