'use client';

import { useState } from 'react';
import { apiCall } from '@/lib/api';

export default function DebugCloudPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, status: 'success' | 'error', data: any) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toISOString() }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);

    // 1. 測試健康檢查
    try {
      const healthResponse = await apiCall('/api/health');
      const healthData = await healthResponse.json();
      addResult('Health Check', healthResponse.ok ? 'success' : 'error', healthData);
    } catch (error) {
      addResult('Health Check', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // 2. 測試資料庫連接
    try {
      const dbResponse = await apiCall('/api/test-db');
      const dbData = await dbResponse.json();
      addResult('Database Connection', dbResponse.ok ? 'success' : 'error', dbData);
    } catch (error) {
      addResult('Database Connection', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // 3. 測試環境變數
    try {
      const envResponse = await apiCall('/api/test-env');
      const envData = await envResponse.json();
      addResult('Environment Variables', envResponse.ok ? 'success' : 'error', envData);
    } catch (error) {
      addResult('Environment Variables', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // 4. 測試 Orders API
    try {
      const ordersResponse = await apiCall('/api/orders');
      const ordersData = await ordersResponse.json();
      addResult('Orders API', ordersResponse.ok ? 'success' : 'error', {
        status: ordersResponse.status,
        dataLength: Array.isArray(ordersData) ? ordersData.length : 'Not an array',
        sample: Array.isArray(ordersData) && ordersData.length > 0 ? ordersData[0] : ordersData
      });
    } catch (error) {
      addResult('Orders API', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // 5. 測試 Settings API
    try {
      const settingsResponse = await apiCall('/api/settings');
      const settingsData = await settingsResponse.json();
      addResult('Settings API', settingsResponse.ok ? 'success' : 'error', settingsData);
    } catch (error) {
      addResult('Settings API', 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    setLoading(false);
  };

  const runFix = async (action: string) => {
    setLoading(true);
    
    try {
      const fixResponse = await apiCall('/api/fix-cloud-500', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          secretKey: 'fix-cloud-500-secret'
        }),
      });

      const fixData = await fixResponse.json();
      addResult(`Fix: ${action}`, fixResponse.ok ? 'success' : 'error', fixData);
    } catch (error) {
      addResult(`Fix: ${action}`, 'error', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Vercel 部署診斷工具</h1>
          
          <div className="mb-6 space-y-4">
            <div>
              <button
                onClick={runDiagnostics}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-4"
              >
                {loading ? '診斷中...' : '開始診斷'}
              </button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">快速修復工具</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => runFix('full-diagnosis')}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  完整診斷與修復
                </button>
                <button
                  onClick={() => runFix('regenerate-prisma')}
                  disabled={loading}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  重新生成 Prisma
                </button>
                <button
                  onClick={() => runFix('migrate-database')}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  執行資料庫遷移
                </button>
                <button
                  onClick={() => runFix('test-database-connection')}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  測試資料庫連接
                </button>
              </div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">診斷結果</h2>
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${
                      result.status === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.test}
                    </h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.status === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status === 'success' ? '✅ 成功' : '❌ 失敗'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    時間: {new Date(result.timestamp).toLocaleString()}
                  </div>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Vercel 常見問題解決方案</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 如果資料庫連接失敗，檢查 Vercel Postgres 的環境變數設置</li>
              <li>• 如果 Orders API 失敗，可能是 Prisma schema 不同步，需要執行 migration</li>
              <li>• 如果環境變數缺失，檢查 Vercel 控制台的環境變數設置</li>
              <li>• 如果所有 API 都失敗，可能是 Vercel Functions 超時或資源不足</li>
              <li>• 檢查 Vercel 控制台的 Functions 日誌查看具體錯誤</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Vercel 環境變數檢查清單</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• DATABASE_URL 或 POSTGRES_PRISMA_URL 必須設置</li>
              <li>• 確保 Vercel Postgres 服務已正確連接</li>
              <li>• 檢查 VERCEL_ENV 是否為 production</li>
              <li>• 確認 Prisma 客戶端已正確生成</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
