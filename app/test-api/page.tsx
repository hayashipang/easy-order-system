'use client';

import { useState } from 'react';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('開始測試API...');
      
      const response = await fetch('/api/customers/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '0938090857',
          birthday: '660111'
        }),
      });

      console.log('API響應狀態:', response.status);
      console.log('API響應頭:', response.headers);

      const data = await response.json();
      console.log('API響應數據:', data);

      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        success: response.ok
      });

    } catch (error) {
      console.error('API錯誤:', error);
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API測試頁面</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">測試 /api/customers/verify</h2>
          
          <button
            onClick={testApi}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '測試中...' : '測試API'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">測試結果</h2>
            
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="space-y-2">
                <div>
                  <strong>狀態碼:</strong> {result.status}
                </div>
                <div>
                  <strong>狀態文字:</strong> {result.statusText}
                </div>
                <div>
                  <strong>成功:</strong> {result.success ? '是' : '否'}
                </div>
                {result.error && (
                  <div>
                    <strong>錯誤:</strong> {result.error}
                  </div>
                )}
                <div>
                  <strong>響應數據:</strong>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">測試說明</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div>• 這個頁面會測試 /api/customers/verify API</div>
            <div>• 使用固定的測試數據：手機 0938090857, 生日 660111</div>
            <div>• 請打開瀏覽器開發者工具查看詳細日誌</div>
          </div>
        </div>
      </div>
    </div>
  );
}
