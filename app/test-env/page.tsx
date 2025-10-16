'use client';

export default function TestEnvPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const nodeEnv = process.env.NODE_ENV;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">環境變量測試</h1>
      <div className="space-y-4">
        <div>
          <strong>NODE_ENV:</strong> {nodeEnv}
        </div>
        <div>
          <strong>NEXT_PUBLIC_API_URL:</strong> {apiUrl ?? '未設置'}
        </div>
        <div>
          <strong>預期 API URL:</strong> 相對路徑（當前域名）
        </div>
        <div className="mt-4">
          <button 
            onClick={async () => {
              try {
                const response = await fetch('/api/menu');
                const data = await response.json();
                console.log('API Response:', data);
                alert('API 調用成功！檢查控制台查看響應。');
              } catch (error) {
                console.error('API Error:', error);
                alert('API 調用失敗！檢查控制台查看錯誤。');
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            測試 API 調用
          </button>
        </div>
      </div>
    </div>
  );
}
