'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';

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

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeliveryDateModal, setShowDeliveryDateModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    // 檢查管理員登入狀態
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const response = await apiCall('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // 如果是確認訂單，需要輸入出貨日期
    if (newStatus === 'CONFIRMED') {
      setSelectedOrderId(orderId);
      setShowDeliveryDateModal(true);
      return;
    }

    // 其他狀態直接更新
    try {
      const response = await apiCall(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const confirmOrderWithDeliveryDate = async () => {
    if (!selectedOrderId || !deliveryDate) {
      setError('請選擇出貨日期');
      return;
    }

    try {
      const response = await apiCall(`/api/orders/${selectedOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'COMPLETED',
          estimatedDeliveryDate: deliveryDate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setOrders(orders.map(order => 
        order.id === selectedOrderId ? { 
          ...order, 
          status: 'COMPLETED',
          estimatedDeliveryDate: deliveryDate
        } : order
      ));

      // 關閉模態框並重置狀態
      setShowDeliveryDateModal(false);
      setSelectedOrderId(null);
      setDeliveryDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const editOrder = async (orderId: string) => {
    if (!confirm('確定要將此訂單恢復為待確認狀態嗎？')) {
      return;
    }

    try {
      const response = await apiCall(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PENDING' }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'PENDING' } : order
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('確定要刪除這個訂單嗎？此操作無法復原。')) {
      return;
    }

    try {
      const response = await apiCall(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      setOrders(orders.filter(order => order.id !== orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('adminLoggedIn');
    router.push('/admin/login');
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

  const getStatusText = (status: string) => {
    switch (status) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Easy Order 管理後台</h1>
              <p className="text-gray-600">訂單管理系統</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/login" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                返回管理員登入
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <Link 
              href="/admin/dashboard" 
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
            >
              訂單管理
            </Link>
            <Link 
              href="/admin/menu" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              菜單管理
            </Link>
            <Link 
              href="/admin/customers" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              客戶管理
            </Link>
            <Link 
              href="/admin/product-details" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              產品詳情
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <div className="text-gray-600">總訂單數</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'PENDING').length}
            </div>
            <div className="text-gray-600">待確認</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'COMPLETED').length}
            </div>
            <div className="text-gray-600">訂單成立</div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-500 text-lg">目前沒有訂單</div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      訂單 #{order.id.slice(-8)}
                    </h3>
                    <p className="text-gray-600">
                      客戶: {(order as any).user?.name && !(order as any).user.name.startsWith('User-') 
                        ? (order as any).user.name 
                        : '未設定姓名'}
                    </p>
                    <p className="text-gray-600">
                      電話: {order.userPhone}
                    </p>
                    <p className="text-gray-600">
                      訂單時間: {new Date(order.createdAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      NT$ {order.totalAmount.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">訂單內容:</h4>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">取貨方式:</span>
                    <span className="ml-2 text-blue-600 font-medium">
                      {order.deliveryType === 'family_mart_store_to_store' ? '全家店到店' : '現場取貨'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">付款方式:</span>
                    <span className="ml-2">{order.paymentMethod === 'bank_transfer' ? '銀行轉帳' : order.paymentMethod}</span>
                  </div>
                  {order.deliveryInfo && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">
                        {order.deliveryType === 'family_mart_store_to_store' ? '全家店名:' : '取貨地址:'}
                      </span>
                      <span className="ml-2 text-green-600 font-medium">{order.deliveryInfo}</span>
                    </div>
                  )}
                  {order.paymentInfo && (
                    <div>
                      <span className="font-medium text-gray-700">匯款資訊:</span>
                      <span className="ml-2 text-green-600 font-medium">{order.paymentInfo}</span>
                    </div>
                  )}
                  {order.notes && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">備註:</span>
                      <span className="ml-2">{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      確認訂單
                    </button>
                  )}
                  
                  {/* 編輯訂單按鈕 - 已確認的訂單可以恢復為待確認 */}
                  {order.status === 'COMPLETED' && (
                    <button
                      onClick={() => editOrder(order.id)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                      title="恢復為待確認"
                    >
                      編輯
                    </button>
                  )}
                  
                  {/* 刪除訂單按鈕 - 所有訂單都可以刪除 */}
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="text-red-600 hover:text-red-800 transition-colors p-2"
                    title="刪除訂單"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 出貨日期模態框 */}
      {showDeliveryDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">設定出貨日期</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                預計出貨日期 *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeliveryDateModal(false);
                  setSelectedOrderId(null);
                  setDeliveryDate('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmOrderWithDeliveryDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                確認訂單
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
