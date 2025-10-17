'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useSystemSettings } from '@/lib/useSystemSettings';
import PromotionTextGrid from '@/components/PromotionTextGrid';

interface Order {
  id: string;
  userPhone: string;
  totalAmount: number;
  subtotalAmount: number | null;
  shippingFee: number | null;
  status: string;
  deliveryType: string;
  deliveryInfo: string;
  paymentMethod: string;
  paymentInfo: string;
  notes: string;
  estimatedDeliveryDate: string | null;
  promotionInfo: string | null;
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

interface PaymentForm {
  bankName: string;
  bankTransferLastFive: string;
}

function OrderDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  const phone = searchParams.get('phone');
  const { settings } = useSystemSettings();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<PaymentForm>({
    bankName: '',
    bankTransferLastFive: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const response = await apiCall(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('訂單不存在');
      }
      const orderData = await response.json();
      setOrder(orderData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    // 驗證表單
    if (!form.bankName || !form.bankName.trim()) {
      setError('請輸入銀行名稱');
      return;
    }
    if (!form.bankTransferLastFive || !form.bankTransferLastFive.trim()) {
      setError('請輸入匯款末五碼');
      return;
    }
    if (form.bankTransferLastFive.length !== 5) {
      setError('匯款末五碼必須是5位數字');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiCall(`/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankName: form.bankName?.trim() || '',
          bankTransferLastFive: form.bankTransferLastFive?.trim() || ''
        }),
      });

      if (!response.ok) {
        throw new Error('提交匯款資訊失敗');
      }

      setSuccess(true);
      // 重新載入訂單資訊
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失敗');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case '待匯款': return '待匯款';
      case '已匯款完成': return '已匯款完成';
      case '訂單成立': return '訂單成立';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待匯款': return 'bg-yellow-100 text-yellow-800';
      case '已匯款完成': return 'bg-blue-100 text-blue-800';
      case '訂單成立': return 'bg-green-100 text-green-800';
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

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link
            href={`/order-query?phone=${phone}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            返回訂單列表
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">訂單詳情</h1>
              <p className="text-gray-600 mt-1">訂單 #{order.id.substring(0, 8)}</p>
            </div>
            <Link
              href={`/order-query?phone=${phone}`}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← 返回訂單列表
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 訂單保留提醒 */}
        {(order.status === '待匯款' || order.status === 'PENDING') && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-orange-500 text-xl mr-3 mt-1">⏰</div>
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">訂單保留提醒</h3>
                <p className="text-orange-800 text-sm">
                  此訂單將於下單後3天自動取消，請盡快完成匯款以保留您的訂單。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 訂單資訊 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">訂單資訊</h2>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">基本資訊</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-600">訂單日期:</span> {new Date(order.createdAt).toLocaleString()}</p>
                <p><span className="font-medium text-gray-600">總金額:</span> <span className="text-green-600 font-bold">NT$ {order.totalAmount.toFixed(0)}</span></p>
                <p><span className="font-medium text-gray-600">取貨方式:</span> 
                  <span className="text-blue-600 font-medium ml-1">
                    {order.deliveryType === 'family_mart_store_to_store' ? '全家店到店' : '現場取貨'}
                  </span>
                </p>
                <p><span className="font-medium text-gray-600">
                  {order.deliveryType === 'family_mart_store_to_store' ? '全家店名:' : '取貨地址:'}
                </span> 
                  <span className="text-green-600 font-medium ml-1">
                    {order.deliveryType === 'family_mart_store_to_store' 
                      ? order.deliveryInfo 
                      : settings.store_address
                    }
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">訂單項目</h3>
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

            {/* 金額分解 */}
            <div className="mt-4">
              <h3 className="font-semibold text-gray-800 mb-3">金額分解</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {order.subtotalAmount && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">商品小計:</span>
                    <span className="font-medium">NT$ {order.subtotalAmount.toFixed(0)}</span>
                  </div>
                )}
                {order.shippingFee !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">運費:</span>
                    <span className="font-medium">
                      {order.shippingFee === 0 ? (
                        <span className="text-green-600">免運費</span>
                      ) : (
                        `NT$ ${order.shippingFee.toFixed(0)}`
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="font-semibold text-gray-800">總金額:</span>
                  <span className="font-bold text-lg">NT$ {order.totalAmount.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* 促銷信息顯示 */}
            {order.promotionInfo && (() => {
              try {
                const promotion = JSON.parse(order.promotionInfo);
                const hasAnyPromotion = promotion.hasFreeShipping || promotion.hasGift;
                
                if (!hasAnyPromotion) return null;

                return (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-800 mb-3">促銷優惠</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      {promotion.hasFreeShipping && promotion.hasGift && (
                        <div className="text-sm text-blue-800">
                          <div className="font-medium mb-1">✓ 已達免運費門檻</div>
                          <div>✓ 感謝您購買{promotion.totalBottles}瓶，贈送{promotion.giftProductName || '隨機'}{promotion.giftQuantity}瓶</div>
                        </div>
                      )}

                      {promotion.hasFreeShipping && !promotion.hasGift && (
                        <div className="text-sm text-blue-800">
                          <div className="font-medium">✓ 已達免運費門檻</div>
                        </div>
                      )}

                      {!promotion.hasFreeShipping && promotion.hasGift && (
                        <div className="text-sm text-blue-800">
                          <div>✓ 感謝您購買{promotion.totalBottles}瓶，贈送{promotion.giftProductName || '隨機'}{promotion.giftQuantity}瓶</div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              } catch (error) {
                return null;
              }
            })()}

            {/* 促銷文字獨立 Grid */}
            {order.promotionInfo && (() => {
              try {
                const promotion = JSON.parse(order.promotionInfo);
                if (promotion.promotionText) {
                  return (
                    <div className="mt-4">
                      <PromotionTextGrid 
                        promotionText={promotion.promotionText}
                      />
                    </div>
                  );
                }
              } catch (error) {
                return null;
              }
              return null;
            })()}
          </div>

          {order.notes && (
            <div className="p-4 bg-blue-50 rounded-md">
              <span className="font-medium text-blue-800">備註:</span>
              <span className="ml-2 text-blue-700">{order.notes}</span>
            </div>
          )}
        </div>

        {/* 匯款資訊表單 - 只有待匯款狀態才顯示 */}
        {order.status === '待匯款' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">填寫匯款資訊</h2>
            
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">匯款資訊提交成功！</h3>
                <p className="text-green-600 mb-4">您的匯款資訊已提交，請等待管理者確認。</p>
                <Link
                  href={`/order-query?phone=${phone}`}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  返回訂單列表
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    銀行名稱 *
                  </label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入銀行名稱 (例: 台灣銀行、中國信託、玉山銀行)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    匯款末五碼 *
                  </label>
                  <input
                    type="text"
                    value={form.bankTransferLastFive}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setForm({ ...form, bankTransferLastFive: value });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入5位數字"
                    maxLength={5}
                    minLength={5}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">請輸入銀行轉帳帳號的最後5位數字</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      提交中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      完成匯款
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* 已匯款完成或訂單成立的狀態顯示 */}
        {(order.status === '已匯款完成' || order.status === '訂單成立') && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">匯款資訊</h2>
            {order.paymentInfo ? (
              <div className="p-4 bg-green-50 rounded-md">
                <p className="text-green-800">
                  <span className="font-medium">匯款資訊:</span> {order.paymentInfo}
                </p>
                <p className="text-green-600 text-sm mt-2">
                  {order.status === '已匯款完成' ? '等待管理者確認中...' : '訂單已確認成立'}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">尚未填寫匯款資訊</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    }>
      <OrderDetailContent />
    </Suspense>
  );
}
