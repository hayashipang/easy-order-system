'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';

export default function KeepAlivePage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [lastPing, setLastPing] = useState<string>('');
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [autoMode, setAutoMode] = useState(false);

  const pingServer = async () => {
    setStatus('running');
    try {
      const response = await apiCall('/api/keep-alive');
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setLastPing(new Date().toLocaleString());
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const startAutoPing = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    const id = setInterval(pingServer, 5 * 60 * 1000); // 每5分鐘
    setIntervalId(id);
    setAutoMode(true);
    pingServer(); // 立即執行一次
  };

  const stopAutoPing = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setAutoMode(false);
  };

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'running': return '🔄';
      default: return '⏸️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔄 保持服務活躍</h1>
            <p className="text-gray-600">防止 Vercel Functions 休眠</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 說明</h3>
            <p className="text-blue-800 text-sm">
              Vercel Functions 在長時間未使用後會進入休眠狀態，導致第一次請求很慢。
              這個工具會定期發送請求來保持服務活躍。
            </p>
          </div>

          <div className="text-center mb-6">
            <div className={`text-2xl font-bold ${getStatusColor()} mb-2`}>
              {getStatusIcon()} {status.toUpperCase()}
            </div>
            {lastPing && (
              <p className="text-sm text-gray-600">
                最後一次 ping: {lastPing}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={pingServer}
              disabled={status === 'running'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status === 'running' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Ping 中...
                </>
              ) : (
                <>
                  🏓 手動 Ping
                </>
              )}
            </button>
            
            <button
              onClick={autoMode ? stopAutoPing : startAutoPing}
              className={`px-6 py-3 rounded-lg text-white flex items-center justify-center ${
                autoMode 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {autoMode ? (
                <>
                  ⏹️ 停止自動 Ping
                </>
              ) : (
                <>
                  ▶️ 開始自動 Ping
                </>
              )}
            </button>
          </div>

          {autoMode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">🔄 自動模式運行中</h3>
              <p className="text-green-800 text-sm">
                每 5 分鐘自動發送一次 ping 請求，保持 Vercel Functions 活躍。
                建議在需要時開啟，不需要時關閉以節省資源。
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ 注意事項</h3>
            <ul className="text-yellow-800 text-sm space-y-1">
              <li>• 自動 ping 會消耗 Vercel 的使用量</li>
              <li>• 建議只在需要時開啟</li>
              <li>• 可以考慮升級到 Vercel Pro 方案</li>
              <li>• 或者使用外部監控服務</li>
            </ul>
          </div>

          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">🔗 外部監控服務</h3>
            <p className="text-gray-700 text-sm mb-2">
              您也可以使用外部服務來保持 Vercel Functions 活躍：
            </p>
            <ul className="text-gray-600 text-sm space-y-1">
              <li>• <strong>UptimeRobot</strong> - 免費監控服務</li>
              <li>• <strong>Pingdom</strong> - 網站監控</li>
              <li>• <strong>StatusCake</strong> - 免費監控</li>
              <li>• <strong>cron-job.org</strong> - 免費定時任務</li>
            </ul>
            <p className="text-gray-600 text-xs mt-2">
              設置這些服務每 5-10 分鐘訪問您的 <code>/api/keep-alive</code> 端點
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
