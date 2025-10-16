'use client';

import { useState } from 'react';

interface Customer {
  id: string;
  phone: string;
  name: string;
  birthday: string;
  createdAt: string;
  updatedAt: string;
}

interface EditCustomerPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export default function EditCustomerPasswordModal({
  isOpen,
  onClose,
  customer,
  onSuccess
}: EditCustomerPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 驗證新密碼格式
    const passwordRegex = /^\d{6}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('密碼必須是6位數字 (例: 660111)');
      setLoading(false);
      return;
    }

    if (!reason.trim()) {
      setError('請填寫修改原因');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customer.phone}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword,
          reason: reason.trim(),
          adminId: 'admin' // 可以從 session 獲取
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '修改密碼失敗');
      }

      // 成功後關閉視窗並刷新列表
      onSuccess();
      onClose();
      setNewPassword('');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改密碼失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setNewPassword('');
      setReason('');
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              修改客戶密碼
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Customer Info */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">客戶姓名:</span>
                  <p className="text-gray-900">{customer.name || '未設定'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">手機號碼:</span>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">原密碼:</span>
                  <p className="text-gray-900 font-mono">{customer.birthday}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">註冊時間:</span>
                  <p className="text-gray-900">{new Date(customer.createdAt).toLocaleDateString('zh-TW')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新密碼 *
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => {
                // 只允許數字，並限制為6位
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setNewPassword(value);
              }}
              placeholder="請輸入6位數字密碼 (例: 660111)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={6}
              minLength={6}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              請輸入6位數字的出生年月日 (例: 660111 表示民國66年1月11日)
            </p>
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              修改原因 *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="請說明修改密碼的原因..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || newPassword.length !== 6 || !reason.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline mr-2"></div>
                  修改中...
                </>
              ) : (
                '確定修改'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
