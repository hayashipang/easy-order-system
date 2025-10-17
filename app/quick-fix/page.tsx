'use client';

import { useState } from 'react';
import { apiCall } from '@/lib/api';

export default function QuickFixPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, status: 'success' | 'error' | 'warning', data: any) => {
    setResults(prev => [...prev, { test, status, data, timestamp: new Date().toISOString() }]);
  };

  const quickDiagnosis = async () => {
    setLoading(true);
    setResults([]);

    // 1. 快速健康檢查
    try {
      const healthResponse = await apiCall('/api/health');
      const healthData = await healthResponse.json();
      addResult('服務狀態', healthResponse.ok ? 'success' : 'error', {
        status: healthData.status,
        environment: healthData.environment,
        version: healthData.version
      });
    } catch (error) {
      addResult('服務狀態', 'error', { error: '服務無法訪問' });
    }

    // 2. 資料庫連接測試
    try {
      const dbResponse = await apiCall('/api/test-db');
      const dbData = await dbResponse.json();
      addResult('資料庫連接', dbResponse.ok ? 'success' : 'error', {
        success: dbData.success,
        message: dbData.message,
        counts: dbData.counts
      });
    } catch (error) {
      addResult('資料庫連接', 'error', { error: '資料庫連接失敗' });
    }

    // 3. 環境變數檢查
    try {
      const envResponse = await apiCall('/api/test-env');
      const envData = await envResponse.json();
      addResult('環境變數', envResponse.ok ? 'success' : 'warning', {
        databaseUrl: envData.databaseUrl,
        deployment: envData.deployment,
        environment: envData.environment
      });
    } catch (error) {
      addResult('環境變數', 'error', { error: '無法檢查環境變數' });
    }

    // 4. 關鍵 API 測試
    const apis = [
      { name: 'Orders API', endpoint: '/api/orders' },
      { name: 'Settings API', endpoint: '/api/settings' },
      { name: 'Menu API', endpoint: '/api/menu' }
    ];

    for (const api of apis) {
      try {
        const response = await apiCall(api.endpoint);
        const data = await response.json();
        addResult(api.name, response.ok ? 'success' : 'error', {
          status: response.status,
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : 'N/A'
        });
      } catch (error) {
        addResult(api.name, 'error', { error: 'API 調用失敗' });
      }
    }

    setLoading(false);
  };

  const emergencyFix = async () => {
    setLoading(true);
    
    try {
      const fixResponse = await apiCall('/api/fix-cloud-500', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'full-diagnosis',
          secretKey: 'fix-cloud-500-secret'
        }),
      });

      const fixData = await fixResponse.json();
      addResult('緊急修復', fixResponse.ok ? 'success' : 'error', fixData);
    } catch (error) {
      addResult('緊急修復', 'error', { error: '修復失敗' });
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🚨 緊急修復工具</h1>
            <p className="text-gray-600">昨天能用今天不行的快速診斷</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={quickDiagnosis}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  診斷中...
                </>
              ) : (
                <>
                  🔍 快速診斷
                </>
              )}
            </button>
            
            <button
              onClick={emergencyFix}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  修復中...
                </>
              ) : (
                <>
                  🛠️ 緊急修復
                </>
              )}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">診斷結果</h2>
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

          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2">🚨 昨天能用今天不行的常見原因</h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• <strong>Vercel Postgres 連接中斷</strong> - 資料庫服務重啟或連接池耗盡</li>
              <li>• <strong>環境變數丟失</strong> - Vercel 環境變數被意外清除</li>
              <li>• <strong>Functions 冷啟動</strong> - 長時間未使用導致服務休眠</li>
              <li>• <strong>Vercel 使用限制</strong> - 達到免費方案限制</li>
              <li>• <strong>Prisma 客戶端問題</strong> - 需要重新生成</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">⚡ 快速解決步驟</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. 點擊「快速診斷」查看問題</li>
              <li>2. 點擊「緊急修復」自動修復</li>
              <li>3. 如果修復失敗，檢查 Vercel 控制台</li>
              <li>4. 確認環境變數設置正確</li>
              <li>5. 必要時重新部署</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
