'use client';

export default function TestEnvSimple() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">環境變數測試</h1>
      <div className="space-y-2">
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
        <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || '未設置'}</p>
        <p><strong>VERCEL_URL:</strong> {process.env.VERCEL_URL || '未設置'}</p>
      </div>
    </div>
  );
}
