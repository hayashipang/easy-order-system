'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Link from 'next/link';

interface Customer {
  id: string;
  phone: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerOrder {
  id: string;
  totalAmount: number;
  status: string;
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<{ [key: string]: CustomerOrder[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 檢查管理員登入狀態
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    fetchCustomers();
  }, [router]);

  const fetchCustomers = async () => {
    try {
      const response = await apiCall('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      setCustomers(data);
      
      // 為每個客戶獲取訂單
      const ordersPromises = data.map(async (customer: Customer) => {
        try {
          const ordersResponse = await apiCall(`/api/users/${customer.phone}/orders`);
          if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            return { phone: customer.phone, orders };
          }
        } catch (err) {
          console.error(`Failed to fetch orders for customer ${customer.phone}:`, err);
        }
        return { phone: customer.phone, orders: [] };
      });
      
      const ordersResults = await Promise.all(ordersPromises);
      const ordersMap: { [key: string]: CustomerOrder[] } = {};
      ordersResults.forEach(({ phone, orders }) => {
        ordersMap[phone] = orders;
      });
      setCustomerOrders(ordersMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
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

  const logout = () => {
    sessionStorage.removeItem('adminLoggedIn');
    router.push('/admin/login');
  };

  const deleteCustomer = async (customerId: string, customerPhone: string) => {
    if (!confirm('確定要刪除這個客戶嗎？此操作無法復原。')) {
      return;
    }

    try {
      const response = await apiCall(`/api/customers/${customerPhone}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 重新獲取客戶列表
        fetchCustomers();
        alert('客戶刪除成功');
      } else {
        alert('刪除客戶失敗');
      }
    } catch (error) {
      console.error('刪除客戶錯誤:', error);
      alert('刪除客戶失敗');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入客戶資料中...</p>
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
              <p className="text-gray-600">客戶管理系統</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/login" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                返回首頁
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
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600"
            >
              客戶管理
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
            <div className="text-gray-600">總客戶數</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(customerOrders).reduce((total, orders) => total + orders.length, 0)}
            </div>
            <div className="text-gray-600">總訂單數</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(customerOrders).reduce((total, orders) => 
                total + orders.reduce((orderTotal, order) => orderTotal + order.totalAmount, 0), 0
              ).toFixed(0)}
            </div>
            <div className="text-gray-600">總營業額 (NT$)</div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">客戶列表</h2>
          </div>

          {customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              目前沒有客戶資料
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      客戶姓名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      手機號碼
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      註冊時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      訂單數量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      總消費
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => {
                    const orders = customerOrders[customer.phone] || [];
                    const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
                    
                    return (
                      <tr key={customer.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.name || '未設定'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.createdAt).toLocaleDateString('zh-TW')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {orders.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          NT$ {totalSpent.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              查看訂單
                            </button>
                            <button
                              onClick={() => deleteCustomer(customer.id, customer.phone)}
                              className="text-red-600 hover:text-red-900"
                              title="刪除客戶"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Customer Orders Modal */}
        {selectedCustomer && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedCustomer.name || '未設定'} 的訂單記錄
                  </h3>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-4 text-sm text-gray-600">
                  <p>手機號碼: {selectedCustomer.phone}</p>
                  <p>註冊時間: {new Date(selectedCustomer.createdAt).toLocaleString('zh-TW')}</p>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {customerOrders[selectedCustomer.phone]?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">此客戶尚未下過訂單</p>
                  ) : (
                    <div className="space-y-4">
                      {customerOrders[selectedCustomer.phone]?.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                訂單 #{order.id.slice(-8)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleString('zh-TW')}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                NT$ {order.totalAmount.toFixed(0)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">訂單內容:</p>
                            <div className="space-y-1">
                              {order.orderItems.map((item) => (
                                <div key={item.id} className="flex justify-between">
                                  <span>{item.menuItem?.name || '未知商品'} × {item.quantity}</span>
                                  <span>NT$ {(item.quantity * item.price).toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
