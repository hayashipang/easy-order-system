'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

interface CartItem {
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
  };
}

interface CheckoutForm {
  customerName: string;
  phone: string;
  pickupMethod: string; // 取貨方式：'pickup' 或 'family_mart'
  storeName: string;
  deliveryAddress: string;
  bankName: string; // 新增銀行名稱欄位
  bankTransferLastFive: string;
  notes: string;
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phone = searchParams.get('phone');
  const cartData = searchParams.get('cart');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState<CheckoutForm>({
    customerName: '',
    phone: phone || '',
    pickupMethod: 'family_mart', // 預設為全家店到店
    storeName: '',
    deliveryAddress: '',
    bankName: '',
    bankTransferLastFive: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormPrefilled, setIsFormPrefilled] = useState(false);

  useEffect(() => {
    console.log('結帳頁面 - 接收到的購物車數據:', cartData);
    console.log('結帳頁面 - 購物車數據類型:', typeof cartData);
    
    if (cartData) {
      try {
        let parsedCart;
        
        // 嘗試直接解析為JSON（不進行URI解碼）
        try {
          parsedCart = JSON.parse(cartData);
          console.log('結帳頁面 - 直接JSON解析成功');
        } catch (jsonError) {
          // 如果直接解析失敗，嘗試URI解碼後再解析
          console.log('結帳頁面 - 直接JSON解析失敗，嘗試URI解碼');
          parsedCart = JSON.parse(decodeURIComponent(cartData));
        }
        
        console.log('結帳頁面 - 解析後的購物車:', parsedCart);
        setCart(parsedCart);
      } catch (err) {
        console.error('結帳頁面 - 購物車數據解析錯誤:', err);
        console.log('結帳頁面 - 原始數據:', cartData);
        setError('購物車數據錯誤');
      }
    } else {
      console.log('結帳頁面 - 沒有購物車數據');
    }
    
    // 獲取客戶信息並預填表單
    if (phone) {
      fetchCustomerInfo();
    }
  }, [cartData, phone]);

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  // 更新商品數量
  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // 如果數量為0或負數，從購物車中移除
      removeItem(menuItemId);
      return;
    }
    
    setCart(cart.map(item => 
      item.menuItemId === menuItemId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // 從購物車中移除商品
  const removeItem = (menuItemId: string) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  // 增加商品數量
  const increaseQuantity = (menuItemId: string) => {
    const item = cart.find(item => item.menuItemId === menuItemId);
    if (item) {
      updateQuantity(menuItemId, item.quantity + 1);
    }
  };

  // 減少商品數量
  const decreaseQuantity = (menuItemId: string) => {
    const item = cart.find(item => item.menuItemId === menuItemId);
    if (item) {
      updateQuantity(menuItemId, item.quantity - 1);
    }
  };

  const fetchCustomerInfo = async () => {
    if (!phone) return;
    
    try {
      const response = await apiCall(`/api/customers/${phone}`);
      if (response.ok) {
        const customerData = await response.json();
        // 預填客戶信息
        // 如果客戶姓名是默認格式（User-手機號碼），則顯示空白
        const displayName = customerData.name && !customerData.name.startsWith('User-') 
          ? customerData.name 
          : '';
        
        setForm(prev => ({
          ...prev,
          customerName: displayName,
          phone: customerData.phone || phone,
          // 可以從最新訂單中獲取地址和銀行信息
        }));
        
        // 如果有最新訂單，可以從中獲取地址和銀行信息
        if (customerData.orders && customerData.orders.length > 0) {
          const latestOrder = customerData.orders[0];
          setForm(prev => ({
            ...prev,
            deliveryAddress: latestOrder.deliveryInfo || '',
            bankTransferLastFive: latestOrder.paymentInfo || '',
          }));
          setIsFormPrefilled(true);
        }
      }
    } catch (err) {
      console.log('獲取客戶信息失敗，使用空白表單');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 驗證取貨方式相關欄位
    if (form.pickupMethod === 'family_mart' && !form.storeName.trim()) {
      setError('請填寫全家店名');
      setLoading(false);
      return;
    }

    // 驗證銀行名稱
    if (!form.bankName.trim()) {
      setError('請輸入銀行名稱');
      setLoading(false);
      return;
    }

    // 驗證銀行轉帳末五碼
    if (form.bankTransferLastFive.length !== 5) {
      setError('銀行轉帳末五碼必須是5位數字');
      setLoading(false);
      return;
    }

    // 驗證手機號碼格式
    const phoneRegex = /^09\d{8}$/;
    if (!form.phone || !phoneRegex.test(form.phone)) {
      setError('請輸入正確的手機號碼格式 (例: 0912345678)');
      setLoading(false);
      return;
    }

    try {
      // 處理配送資訊：根據取貨方式
      let deliveryInfo = '';
      if (form.pickupMethod === 'family_mart') {
        if (form.deliveryAddress.trim()) {
          deliveryInfo = `${form.storeName} - ${form.deliveryAddress}`;
        } else {
          deliveryInfo = form.storeName;
        }
      } else {
        // 現場取貨
        deliveryInfo = form.deliveryAddress || '現場取貨';
      }

      const orderData = {
        userPhone: form.phone,
        totalAmount: cart.reduce((total, item) => total + (item.quantity * item.price), 0),
        deliveryType: form.pickupMethod === 'family_mart' ? 'family_mart_store_to_store' : 'pickup',
        deliveryInfo: deliveryInfo,
        paymentMethod: 'bank_transfer',
        paymentInfo: `${form.bankName} - ${form.bankTransferLastFive}`,
        notes: form.notes,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price
        }))
      };


      const response = await apiCall('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('訂單提交失敗');
      }

      const order = await response.json();
      
      // 更新客戶信息（如果客戶名字有變化）
      try {
        await apiCall(`/api/customers/${form.phone}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.customerName,
            phone: form.phone
          }),
        });
      } catch (err) {
        console.log('更新客戶信息失敗，但不影響訂單提交');
      }
      
      // 跳轉到訂單確認頁面
      router.push(`/order-confirmation?orderId=${order.id}&phone=${form.phone}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '訂單提交失敗');
    } finally {
      setLoading(false);
    }
  };

  if (!phone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">無效的結帳請求</h2>
          <p className="text-gray-600 mb-4">請先登入</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">結帳</h1>
              <p className="text-gray-600 mt-1">請填寫訂單信息</p>
            </div>
            <Link 
              href={`/orders/customer?phone=${phone}`}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← 返回點餐
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="lg:order-2">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">訂單摘要</h2>
              
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">🛒</div>
                  <p className="text-gray-600">購物車是空的</p>
                  <Link 
                    href={`/orders/customer?phone=${phone}`}
                    className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    返回點餐
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.menuItemId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.menuItem.name}</h3>
                            <p className="text-sm text-gray-600">單價: NT$ {item.price.toFixed(0)}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.menuItemId)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="移除商品"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* 數量控制 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => decreaseQuantity(item.menuItemId)}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-12 text-center font-medium text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => increaseQuantity(item.menuItemId)}
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              NT$ {(item.quantity * item.price).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">總計:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        NT$ {getTotalAmount().toFixed(0)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:order-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">訂單信息</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {cart.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-yellow-800 text-sm">
                      購物車是空的，請先選擇商品後再提交訂單
                    </p>
                  </div>
                </div>
              )}

              {isFormPrefilled && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-800 text-sm">
                      已為您預填上次訂單的信息，您可以直接使用或修改
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    客戶姓名 *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入您的姓名"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    手機號碼 *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => {
                      // 只允許數字，並限制為10位
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setForm({ ...form, phone: value });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入手機號碼 (例: 0912345678)"
                    maxLength={10}
                    minLength={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">請輸入10位數字的手機號碼，為了聯絡，手機號碼一定要正確</p>
                </div>

                {/* Pickup Method */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">取貨方式</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pickupMethod"
                        value="pickup"
                        checked={form.pickupMethod === 'pickup'}
                        onChange={(e) => setForm({ ...form, pickupMethod: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-gray-700">現場取貨</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pickupMethod"
                        value="family_mart"
                        checked={form.pickupMethod === 'family_mart'}
                        onChange={(e) => setForm({ ...form, pickupMethod: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-gray-700">全家店到店</span>
                    </label>
                  </div>
                </div>

                {/* Store Name - 只有選擇全家店到店時才顯示 */}
                {form.pickupMethod === 'family_mart' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      全家店名 *
                    </label>
                    <input
                      type="text"
                      value={form.storeName}
                      onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="請輸入店名 (例: 全家永康大勝店)"
                    />
                    <p className="text-sm text-gray-500 mt-1">全家店名為必填項目</p>
                  </div>
                )}

                {/* Delivery Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {form.pickupMethod === 'pickup' ? '取貨地址' : '寄送地址'}
                  </label>
                  <textarea
                    value={form.deliveryAddress}
                    onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={form.pickupMethod === 'pickup' 
                      ? "請輸入取貨地址 (選填)" 
                      : "請輸入完整的寄送地址，包含縣市、區、街道、門牌號碼 (選填)"
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {form.pickupMethod === 'pickup' ? '地址為選填項目' : '地址為選填項目'}
                  </p>
                </div>

                {/* Bank Name */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">匯款銀行名稱</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    銀行名稱 *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入銀行名稱 (例: 台灣銀行、中國信託、玉山銀行)"
                  />
                </div>

                {/* Bank Transfer Last Five Digits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    銀行匯款末五碼 *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    minLength={5}
                    pattern="[0-9]{5}"
                    value={form.bankTransferLastFive}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setForm({ ...form, bankTransferLastFive: value });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入5位數字"
                  />
                  <p className="text-sm text-gray-500 mt-1">請輸入銀行轉帳帳號的最後5位數字，用於確認付款</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    備註
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="如有特殊需求或備註，請在此填寫"
                  />
                </div>

                {/* Payment Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">付款方式</h3>
                  <p className="text-sm text-blue-700">
                    請將款項匯至指定帳戶，並在備註中填寫匯款末五碼以確認付款。
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || cart.length === 0}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      提交訂單中...
                    </div>
                  ) : cart.length === 0 ? (
                    '購物車是空的'
                  ) : (
                    '確認並提交訂單'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutPageContent />
    </Suspense>
  );
}
