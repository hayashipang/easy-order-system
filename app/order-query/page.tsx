'use client';

import { useState } from 'react';
import Link from 'next/link';
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

export default function OrderQueryPage() {
  const { settings } = useSystemSettings();
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentForms, setPaymentForms] = useState<Record<string, PaymentForm>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !phone.trim()) {
      setError('請輸入手機號碼');
      return;
    }

    if (!birthday || !birthday.trim()) {
      setError('請輸入出生年月日');
      return;
    }

    // 驗證手機號碼格式 (必須是10碼，以09開頭)
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('請輸入正確的手機號碼格式 (例: 0912345678)');
      return;
    }

    // 驗證生日格式 (必須是6碼數字)
    const birthdayRegex = /^\d{6}$/;
    if (!birthdayRegex.test(birthday)) {
      setError('請輸入正確的出生年月日格式 (例: 660111)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 先驗證用戶身份
      const verifyResponse = await apiCall('/api/customers/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.trim(),
          birthday: birthday.trim()
        }),
      });

      if (!verifyResponse.ok) {
        if (verifyResponse.status === 404) {
          setError('找不到該用戶，請確認手機號碼是否正確');
        } else if (verifyResponse.status === 401) {
          setError('出生年月日不正確，請重新輸入');
        } else {
          setError('身份驗證失敗，請稍後再試');
        }
        setOrders([]);
        return;
      }

      // 身份驗證成功，查詢訂單
      const response = await apiCall(`/api/orders?phone=${phone?.trim() || ''}`);
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
      
      // 初始化匯款表單狀態
      const initialForms: Record<string, PaymentForm> = {};
      data.forEach((order: Order) => {
        if (order.status === '待匯款' || order.status === 'PENDING') {
          initialForms[order.id] = {
            bankName: '',
            bankTransferLastFive: ''
          };
        }
      });
      setPaymentForms(initialForms);
      
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

  const handlePaymentSubmit = async (orderId: string) => {
    const form = paymentForms[orderId];
    if (!form) return;

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

    setSubmitting(prev => ({ ...prev, [orderId]: true }));
    setError(null);

    try {
      const response = await apiCall(`/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankName: form.bankName.trim(),
          bankTransferLastFive: form.bankTransferLastFive.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('提交匯款資訊失敗');
      }

      setSuccess(prev => ({ ...prev, [orderId]: true }));
      // 重新載入訂單列表
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失敗');
    } finally {
      setSubmitting(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const updatePaymentForm = (orderId: string, field: keyof PaymentForm, value: string) => {
    setPaymentForms(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value
      }
    }));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case '待匯款': return '待匯款';
      case '已匯款完成': return '已匯款完成';
      case '訂單成立': return '訂單成立';
      case 'PENDING': return '待確認';
      case 'CONFIRMED': return '已確認';
      case 'PREPARING': return '製作中';
      case 'READY': return '已完成';
      case 'DELIVERED': return '已送達';
      case 'COMPLETED': return '訂單成立';
      case 'CANCELLED': return '已取消';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待匯款': return 'bg-yellow-100 text-yellow-800';
      case '已匯款完成': return 'bg-blue-100 text-blue-800';
      case '訂單成立': return 'bg-green-100 text-green-800';
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
              <p className="text-gray-600 mt-1">輸入手機號碼和出生年月日查詢您的訂單</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">安全查詢訂單</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手機號碼 *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => {
                  // 只允許數字，並限制為10位
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhone(value);
                }}
                placeholder="請輸入手機號碼 (例: 0912345678)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-gray-300 text-black bg-white appearance-none"
                style={{
                  WebkitTextFillColor: '#000', // 修正 iOS Safari 白字問題
                }}
                maxLength={10}
                minLength={10}
                required
              />
              <p className="text-sm text-gray-500 mt-1">請輸入10位數字的手機號碼，您下單時使用的手機號碼</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出生年月日 *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={birthday}
                onChange={(e) => {
                  // 只允許數字，並限制為6位
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setBirthday(value);
                }}
                placeholder="請輸入出生年月日 (例: 660111)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-gray-300 text-black bg-white appearance-none"
                style={{
                  WebkitTextFillColor: '#000', // 修正 iOS Safari 白字問題
                }}
                maxLength={6}
                minLength={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1">請輸入6位數字的出生年月日 (例: 660111 表示民國66年1月11日)</p>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10 || birthday.length !== 6}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '查詢中...' : phone.length !== 10 || birthday.length !== 6 ? '請輸入完整的手機號碼和出生年月日' : '安全查詢訂單'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* 訂單保留提醒 */}
        {orders.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-orange-500 text-xl mr-3 mt-1">⏰</div>
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">訂單保留提醒</h3>
                <p className="text-orange-800 text-sm">
                  未付款訂單將於下單後3天自動取消，請盡快完成匯款以保留您的訂單。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 匯款帳號資訊 */}
        {orders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-500 text-xl mr-3 mt-1">🏦</div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-3">匯款帳號資訊</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-blue-800">銀行名稱：</span>
                      <span className="text-blue-900 font-semibold ml-2">台灣土地銀行 (005)</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-blue-800">帳號：</span>
                      <span className="text-blue-900 font-semibold ml-2">032005719941</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800">戶名：</span>
                      <span className="text-blue-900 font-semibold ml-2">林錦鶯</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm font-medium">
                    ⚠️ 注意：請務必填寫帳號末五碼以便核對
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      <span className="text-green-600 font-medium">
                        {order.deliveryType === 'family_mart_store_to_store' 
                          ? order.deliveryInfo 
                          : settings.store_address
                        }
                      </span>
                    </p>
                    <p><span className="font-medium">支付方式:</span> {order.paymentMethod === 'bank_transfer' ? '銀行轉帳' : '現金'}</p>
                    {order.paymentInfo && (
                      <p><span className="font-medium">匯款資訊:</span> <span className="text-green-600 font-medium">{order.paymentInfo}</span></p>
                    )}
                    {order.estimatedDeliveryDate && (
                      <p><span className="font-medium">預計出貨日期:</span> <span className="text-blue-600 font-medium">{new Date(order.estimatedDeliveryDate).toLocaleDateString()}</span></p>
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

                {/* 金額分解 */}
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">金額分解:</h4>
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
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">促銷優惠:</h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          {promotion.hasFreeShipping && promotion.hasGift && (
                            <div className="text-sm text-blue-800">
                              <div className="font-medium mb-1">✓ 已達免運費門檻</div>
                              <div>✓ 感謝您購買{promotion.totalBottles}瓶/包，贈送{promotion.giftProductName || '隨機'}{promotion.giftQuantity}瓶/包</div>
                            </div>
                          )}

                          {promotion.hasFreeShipping && !promotion.hasGift && (
                            <div className="text-sm text-blue-800">
                              <div className="font-medium">✓ 已達免運費門檻</div>
                            </div>
                          )}

                          {!promotion.hasFreeShipping && promotion.hasGift && (
                            <div className="text-sm text-blue-800">
                              <div>✓ 感謝您購買{promotion.totalBottles}瓶/包，贈送{promotion.giftProductName || '隨機'}{promotion.giftQuantity}瓶/包</div>
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
                        <div className="mb-4">
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

                {order.notes && (
                  <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                    <span className="font-medium">備註:</span>
                    <span className="ml-2">{order.notes}</span>
                  </div>
                )}

                {/* 匯款表單 - 待匯款或待確認狀態才顯示 */}
                {(order.status === '待匯款' || order.status === 'PENDING') && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {success[order.id] ? (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-green-800 mb-2">匯款資訊提交成功！</h4>
                        <p className="text-green-600 text-sm">您的匯款資訊已提交，請等待管理者確認。</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800">填寫匯款資訊</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            銀行名稱 *
                          </label>
                          <input
                            type="text"
                            value={paymentForms[order.id]?.bankName || ''}
                            onChange={(e) => updatePaymentForm(order.id, 'bankName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-gray-300 text-black bg-white appearance-none"
                            style={{
                              WebkitTextFillColor: '#000', // 修正 iOS Safari 白字問題
                            }}
                            placeholder="請輸入銀行名稱 (例: 台灣銀行、中國信託、玉山銀行)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            匯款末五碼 *
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={paymentForms[order.id]?.bankTransferLastFive || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                              updatePaymentForm(order.id, 'bankTransferLastFive', value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-gray-300 text-black bg-white appearance-none"
                            style={{
                              WebkitTextFillColor: '#000', // 修正 iOS Safari 白字問題
                            }}
                            placeholder="請輸入5位數字"
                            maxLength={5}
                          />
                          <p className="text-xs text-gray-500 mt-1">請輸入銀行轉帳帳號的最後5位數字</p>
                        </div>

                        <button
                          onClick={() => handlePaymentSubmit(order.id)}
                          disabled={submitting[order.id]}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {submitting[order.id] ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              提交中...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              完成匯款
                            </>
                          )}
                        </button>
                      </div>
                    )}
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
