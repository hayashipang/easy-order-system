'use client';

import { useState } from 'react';

export default function CreateTable() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createTable = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-promotion-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to create table', details: error });
    } finally {
      setLoading(false);
    }
  };

  const createAllTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-all-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to create all tables', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">創建 promotion_settings 表</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">手動創建資料表</h2>
          <div className="space-x-4">
            <button
              onClick={createTable}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? '創建中...' : '創建 promotion_settings 表'}
            </button>
            <button
              onClick={createAllTables}
              disabled={loading}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? '創建中...' : '創建所有缺失的表'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">創建結果：</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
