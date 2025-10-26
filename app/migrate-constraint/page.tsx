'use client';

import { useState } from 'react';

export default function MigrateConstraintPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runMigration = async () => {
    setLoading(true);
    setResult('正在運行遷移...');
    
    try {
      const response = await fetch('/api/migrate-unique-constraint', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 遷移成功！\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ 遷移失敗：\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`❌ 錯誤：${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            資料庫約束遷移
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              此頁面用於更新 MenuItem 的唯一約束，從單一 name 約束改為複合 (name, productType) 約束。
            </p>
            
            <button
              onClick={runMigration}
              disabled={loading}
              className={`px-6 py-3 rounded-md font-medium ${
                loading
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? '運行中...' : '運行遷移'}
            </button>
          </div>
          
          {result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">結果：</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
