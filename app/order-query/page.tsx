'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  userPhone: string;
  totalAmount: number;
  status: string;
  deliveryType: string;
  deliveryInfo: string;
  paymentMethod: string;
  paymentInfo: string;
  notes: string;
  estimatedDeliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem?: {
      name: string;
      description: string;
      price: number;
    };
  }>;
}

export default function OrderQueryPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('請輸入手機號碼');
      return;
    }

    // 驗證手機號碼格式 (必須是10碼，以09開頭)
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('請輸入正確的手機號碼格式 (例: 0912345678)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders?phone=${phone.trim()}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('找不到該手機號碼的訂單');
        } else {
          throw new Error('查詢失敗，請稍後再試');
        }
        setOrders([]);
        return;
      }
      const data = await response.json();
      setOrders(data);
      
      if (data.length === 0) {
        setError('找不到該手機號碼的訂單');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢失敗，請檢查網路連接');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '待確認';
      case 'CONFIRMED': return '已確認';
      case 'PREPARING': return '製作中';
      case 'READY': return '已完成';
      case 'DELIVERED': return '已送達';
      case 'COMPLETED': return '訂單成立';
      case 'CANCELLED': return '已取消';
      default: return '未知狀態';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-orange-100 text-orange-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'DELIVERED': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">訂單查詢</h1>
              <p className="text-gray-600 mt-1">輸入手機號碼查詢您的訂單</p>
            </div>
            <Link
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← 返回首頁
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 查詢表單 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">查詢訂單</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
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
              <p className="text-sm text-gray-500 mt-1">請輸入10位數字的手機號碼，您下單時使用的手機號碼</p>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '查詢中...' : phone.length !== 10 ? '請輸入完整的手機號碼' : '查詢訂單'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* 訂單列表 */}
        {orders.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">您的訂單</h2>
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">訂單 #{order.id.substring(0, 8)}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-gray-700 text-sm">
                  <div>
                    <p><span className="font-medium">訂單日期:</span> {new Date(order.createdAt).toLocaleString()}</p>
                    <p><span className="font-medium">總金額:</span> NT$ {order.totalAmount.toFixed(0)}</p>
                    <p><span className="font-medium">取貨方式:</span> 
                      <span className="text-blue-600 font-medium">
                        {order.deliveryType === 'family_mart_store_to_store' ? '全家店到店' : '現場取貨'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p><span className="font-medium">
                      {order.deliveryType === 'family_mart_store_to_store' ? '全家店名:' : '取貨地址:'}
                    </span> 
                      <span className="text-green-600 font-medium">{order.deliveryInfo}</span>
                    </p>
                    <p><span className="font-medium">支付方式:</span> {order.paymentMethod === 'bank_transfer' ? '銀行轉帳' : '現金'}</p>
                    {order.paymentInfo && (
                      <p><span className="font-medium">匯款資訊:</span> <span className="text-green-600 font-medium">{order.paymentInfo}</span></p>
                    )}
                    {order.estimatedDeliveryDate && (
                      <p><span className="font-medium">預計出貨日期:</span> {new Date(order.estimatedDeliveryDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">訂單項目:</h4>
                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <span className="font-medium">{item.menuItem?.name || '未知商品'}</span>
                        <span className="text-gray-600">
                          {item.quantity} × NT$ {item.price} = NT$ {(item.quantity * item.price).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                    <span className="font-medium">備註:</span>
                    <span className="ml-2">{order.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {orders.length === 0 && !loading && phone && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">沒有找到訂單</p>
            <p className="text-gray-400 text-sm mt-2">請確認手機號碼是否正確</p>
          </div>
        )}
      </div>
    </div>
  );
}
