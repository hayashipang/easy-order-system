'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';

export default function HealthPage() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [data, setData] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await apiCall('/api/health');
      const healthData = await response.json();
      
      if (response.ok) {
        setStatus('healthy');
        setData(healthData);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
    
    setLastCheck(new Date().toLocaleString());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'checking' && (
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          )}
          {status === 'healthy' && (
            <div className="text-6xl mb-4">✅</div>
          )}
          {status === 'error' && (
            <div className="text-6xl mb-4">❌</div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'checking' && '檢查中...'}
          {status === 'healthy' && '系統正常'}
          {status === 'error' && '系統異常'}
        </h1>

        <p className="text-gray-600 mb-6">
          {status === 'checking' && '正在檢查系統狀態...'}
          {status === 'healthy' && '所有服務運行正常'}
          {status === 'error' && '系統出現問題，請稍後再試'}
        </p>

        {data && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">系統資訊</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>狀態:</strong> {data.status}</p>
              <p><strong>環境:</strong> {data.environment}</p>
              <p><strong>版本:</strong> {data.version}</p>
              <p><strong>時間:</strong> {new Date(data.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          最後檢查: {lastCheck}
        </div>

        <div className="mt-6">
          <button
            onClick={checkHealth}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新檢查
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          此頁面用於系統健康檢查和保持服務活躍
        </div>
      </div>
    </div>
  );
}
