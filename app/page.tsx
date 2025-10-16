'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import LoginConfirmationModal from '@/components/LoginConfirmationModal';

export default function HomePage() {
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  // 檢查用戶是否存在
  const checkUserExists = async (phone: string) => {
    try {
      const response = await apiCall(`/api/customers/${phone}`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // 處理表單提交 - 現在只做格式驗證和顯示確認彈跳視窗
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 驗證手機號碼格式
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('請輸入正確的手機號碼格式 (例: 0912345678)');
      return;
    }

    // 驗證生日格式
    const birthdayRegex = /^\d{6}$/;
    if (!birthdayRegex.test(birthday)) {
      setError('請輸入正確的出生年月日格式 (例: 660111)');
      return;
    }

    // 直接顯示確認彈跳視窗
    setShowModal(true);
  };

  // 處理確認登入
  const handleConfirmLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 先嘗試驗證現有用戶
      const verifyResponse = await apiCall('/api/customers/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          birthday
        }),
      });

      if (verifyResponse.ok) {
        // 驗證成功，跳轉到點餐頁面
        setShowModal(false);
        // 預載入菜單數據
        preloadMenuData();
        router.push(`/orders/customer?phone=${phone}`);
        return;
      }

      // 如果驗證失敗，檢查是否是用戶不存在
      if (verifyResponse.status === 404) {
        // 用戶不存在，創建新用戶
        const createResponse = await apiCall('/api/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone,
            name: '',
            email: `${phone}@customer.local`,
            birthday
          }),
        });

        if (!createResponse.ok) {
          throw new Error('創建客戶失敗');
        }

        // 跳轉到點餐頁面
        setShowModal(false);
        // 預載入菜單數據
        preloadMenuData();
        router.push(`/orders/customer?phone=${phone}`);
      } else {
        // 生日錯誤
        throw new Error('出生年月日不正確，請重新輸入');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗');
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  // 處理修改資訊
  const handleEditInfo = () => {
    setShowModal(false);
    setError(null);
  };

  // 預載入菜單數據
  const preloadMenuData = () => {
    // 在背景預載入菜單數據，不等待結果
    apiCall('/api/menu')
      .then(response => {
        if (response.ok) {
          console.log('菜單數據預載入成功');
        }
      })
      .catch(err => {
        console.log('菜單數據預載入失敗:', err);
      });
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GreenWin Order</h1>
          <p className="text-gray-600">果然盈點餐系統</p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4">
              <img
                src="/logo.jpg"
                alt="GreenWin Order Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">安全登入</h2>
            <p className="text-gray-600">輸入手機號碼和出生年月日開始點餐</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出生年月日 *
              </label>
              <input
                type="text"
                value={birthday}
                onChange={(e) => {
                  // 只允許數字，並限制為6位
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setBirthday(value);
                }}
                placeholder="請輸入出生年月日 (例: 660111)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
                minLength={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                請輸入6位數字的出生年月日 (例: 660111 表示民國66年1月11日)
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phone.length !== 10 || birthday.length !== 6}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  處理中...
                </>
              ) : phone.length !== 10 || birthday.length !== 6 ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  請輸入完整的手機號碼和出生年月日
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  安全登入
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Cards - Horizontal Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Inquiry Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <a href="/order-query" className="block hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">訂單查詢/匯款確認</h3>
              <p className="text-sm text-gray-600">查看您的訂單狀態，或上傳匯款資訊以完成付款</p>
            </a>
          </div>

          {/* LINE Official Customer Service Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <a 
              href="https://lin.ee/Q5GleTr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                {/* LINE Icon */}
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">果然盈Line官方客服</h3>
              <p className="text-sm text-gray-600">有任何問題歡迎聯繫我們</p>
            </a>
          </div>
        </div>

        {/* Login Confirmation Modal */}
        <LoginConfirmationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmLogin}
          onEdit={handleEditInfo}
          phone={phone}
          birthday={birthday}
          loading={loading}
        />
      </div>
    </div>
  );
}
