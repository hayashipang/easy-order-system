'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiCall } from '@/lib/api';

interface Order {
  id: string;
  userPhone: string;
  totalAmount: number;
  status: string;
  deliveryType: string;
  notes?: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem?: {
      name: string;
    };
  }>;
}

function OrderConfirmationPageContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const phone = searchParams.get('phone');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await apiCall(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      case 'CANCELLED': return '已取消';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-orange-100 text-orange-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'DELIVERED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入訂單中...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error || '訂單不存在'}</p>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">訂單確認</h1>
              <p className="text-gray-600 mt-1">您的訂單已成功提交</p>
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="text-green-500 text-4xl mr-4">✅</div>
            <div>
              <h2 className="text-xl font-semibold text-green-900 mb-1">訂單提交成功！</h2>
              <p className="text-green-700">
                您的訂單已成功提交，我們會盡快處理您的訂單。
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                訂單編號: #{order.id.substring(0, 8)}
              </h3>
              <p className="text-gray-600">下單時間: {new Date(order.createdAt).toLocaleString('zh-TW')}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                NT$ {order.totalAmount.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">訂單項目:</h4>
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

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">配送方式:</span>
              <span className="ml-2 font-medium">{order.deliveryType}</span>
            </div>
            {order.notes && (
              <div>
                <span className="text-gray-600">備註:</span>
                <span className="ml-2">{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">付款說明</h3>
          <div className="text-blue-800 space-y-2">
            <p>• 請將款項匯至指定帳戶</p>
            <p>• 匯款時請在備註中填寫您的匯款末五碼</p>
            <p>• 匯款完成後，我們會盡快確認並開始製作您的訂單</p>
            <p>• 如有任何問題，請聯繫客服</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href={`/orders/customer?phone=${phone}`}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            繼續點餐
          </Link>
          <Link
            href="/"
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors text-center"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmationPageContent />
    </Suspense>
  );
}
