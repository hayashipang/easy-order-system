'use client';

import { useState } from 'react';

export default function DebugLoginPage() {
  const [phone, setPhone] = useState('0912345678');
  const [birthday, setBirthday] = useState('660111');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('測試登入:', { phone, birthday });
      
      const response = await fetch('/api/customers/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          birthday
        }),
      });

      const data = await response.json();
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        success: response.ok
      });

      console.log('API響應:', {
        status: response.status,
        data: data
      });

    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
      console.error('API錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('創建用戶:', { phone, birthday });
      
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          name: '測試用戶',
          email: `${phone}@test.com`,
          birthday
        }),
      });

      const data = await response.json();
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        success: response.ok
      });

      console.log('創建用戶響應:', {
        status: response.status,
        data: data
      });

    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
      console.error('創建用戶錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">登入調試頁面</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">測試數據</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手機號碼
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0912345678"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出生年月日
              </label>
              <input
                type="text"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="660111"
              />
            </div>
          </div>
          
          <div className="flex space-x-4 mt-6">
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '測試中...' : '測試登入'}
            </button>
            
            <button
              onClick={createUser}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '創建中...' : '創建用戶'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">結果</h2>
            
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
          <h3 className="font-semibold text-blue-900 mb-2">測試用戶數據</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div><strong>用戶1:</strong> 手機 0912345678, 生日 660111</div>
            <div><strong>用戶2:</strong> 手機 0987654321, 生日 750315</div>
          </div>
        </div>
      </div>
    </div>
  );
}
