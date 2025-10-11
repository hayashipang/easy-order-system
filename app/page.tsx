'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

export default function HomePage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 驗證手機號碼格式
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('請輸入正確的手機號碼格式 (例: 0912345678)');
      setLoading(false);
      return;
    }

    try {
      // 檢查客戶是否存在
      const response = await apiCall('/api/customers');
      if (!response.ok) {
        throw new Error('無法連接到服務器');
      }

      const customers = await response.json();
      const existingCustomer = customers.find((customer: any) => customer.phone === phone);

      if (existingCustomer) {
        // 客戶存在，跳轉到點餐頁面
        router.push(`/orders/customer?phone=${phone}`);
      } else {
        // 客戶不存在，創建新客戶
        const createResponse = await apiCall('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone,
            name: '',
            email: `${phone}@customer.local`
          }),
        });

        if (!createResponse.ok) {
          throw new Error('創建客戶失敗');
        }

        // 跳轉到點餐頁面
        router.push(`/orders/customer?phone=${phone}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Easy Order</h1>
          <p className="text-gray-600">簡易點餐系統</p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">手機號碼登入</h2>
            <p className="text-gray-600">輸入手機號碼開始點餐</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手機號碼 *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  // 只允許數字，並限制為10位
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(value);
                }}
                placeholder="請輸入手機號碼 (例: 0912345678)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={10}
                minLength={10}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                請輸入10位數字的手機號碼 (例: 0912345678)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  處理中...
                </>
              ) : phone.length !== 10 ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  請輸入完整的手機號碼
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  開始點餐
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Inquiry Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <a href="/order-query" className="block hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">訂單查詢/取消</h3>
            <p className="text-sm text-gray-600">查詢訂單狀態或取消訂單</p>
          </a>
        </div>
      </div>
    </div>
  );
}
