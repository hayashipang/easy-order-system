'use client';

import { useEffect, useState } from 'react';

export default function DebugApi() {
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    // 檢查所有相關的環境變數
    const vars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      VERCEL_URL: process.env.VERCEL_URL,
    };
    
    console.log('Environment variables:', vars);
    setApiUrl(process.env.NEXT_PUBLIC_API_URL ?? '未設置');
  }, []);

  const testApiCall = async () => {
    try {
      // 直接測試 API 調用
      const response = await fetch('/api/customers/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: '0938090857',
          birthday: '660111'
        })
      });
      
      console.log('API Response:', response.status, response.url);
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API 調試</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">環境變數：</h2>
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
          <p><strong>NEXT_PUBLIC_API_URL:</strong> {apiUrl}</p>
          <p><strong>VERCEL_URL:</strong> {process.env.VERCEL_URL ?? '未設置'}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">API 測試：</h2>
          <button
            onClick={testApiCall}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            測試 API 調用
          </button>
        </div>
      </div>
    </div>
  );
}