'use client';

import { useEffect, useState } from 'react';

export default function DebugEnv() {
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    // 檢查所有相關的環境變數
    const vars = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
      RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
    };
    setEnvVars(vars);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">環境變數調試</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">環境變數值：</h2>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded w-48">{key}:</span>
                <span className="font-mono bg-blue-100 px-2 py-1 rounded ml-2">
                  {value ?? '未設置'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-semibold mb-4">API 調用測試：</h2>
          <button
            onClick={async () => {
              try {
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
                console.log('Response status:', response.status);
                console.log('Response URL:', response.url);
              } catch (error) {
                console.error('Error:', error);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            測試 API 調用
          </button>
        </div>
      </div>
    </div>
  );
}
