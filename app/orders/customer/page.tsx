'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import CategoryIcon from '@/components/CategoryIcon';
import ProductDetailModal from '@/components/ProductDetailModal';
import { apiCall } from '@/lib/api';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  productType?: string; // 即飲瓶 或 鮮凍包
  isAvailable: boolean;
  imageUrl?: string;
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
}

interface Customer {
  phone: string;
  name?: string;
  email?: string;
  orders?: any[];
}

function CustomerOrdersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phone = searchParams.get('phone');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({});
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<string>('即飲瓶'); // 默認選擇即飲瓶

  useEffect(() => {
    if (phone) {
      fetchMenuItems();
      fetchCustomerInfo();
    }
  }, [phone]);

  const fetchMenuItems = async () => {
    try {
      const response = await apiCall('/api/menu');
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInfo = async () => {
    if (!phone) return;
    
    try {
      const response = await apiCall(`/api/customers/${phone}`);
      if (response.ok) {
        const customerData: Customer = await response.json();
        setCustomer(customerData);
      }
    } catch (err) {
      console.log('客戶信息獲取失敗，可能是新客戶');
    }
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 0) return;
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const addToCart = (menuItem: MenuItem) => {
    const quantity = itemQuantities[menuItem.id] || 1;
    console.log('添加商品到購物車:', menuItem.name, '數量:', quantity);
    
    if (quantity <= 0) return;
    
    const existingItem = cart.find(item => item.menuItemId === menuItem.id);
    if (existingItem) {
      const newCart = cart.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      console.log('更新現有商品，新購物車:', newCart);
      setCart(newCart);
    } else {
      const newCart = [...cart, {
        menuItemId: menuItem.id,
        quantity: quantity,
        price: menuItem.price
      }];
      console.log('添加新商品，新購物車:', newCart);
      setCart(newCart);
    }
    
    // 重置數量
    setItemQuantities(prev => ({
      ...prev,
      [menuItem.id]: 1
    }));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(item => item.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(cart.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, quantity }
        : item
    ));
  };

  const getCartItem = (menuItemId: string) => {
    return cart.find(item => item.menuItemId === menuItemId);
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const proceedToCheckout = () => {
    console.log('購物車內容:', cart);
    console.log('購物車長度:', cart.length);
    
    if (cart.length === 0) {
      setError('購物車是空的，請先選擇商品');
      return;
    }

    // 將購物車數據編碼並跳轉到結帳頁面
    const cartData = encodeURIComponent(JSON.stringify(cart.map(item => ({
      ...item,
      menuItem: menuItems.find(mi => mi.id === item.menuItemId)
    }))));
    
    console.log('跳轉到結帳頁面，購物車數據:', cartData);
    router.push(`/checkout?phone=${phone}&cart=${cartData}`);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleProductTypeChange = (productType: string) => {
    setSelectedProductType(productType);
  };

  // 根據選擇的產品類型篩選菜單項目
  const filteredMenuItems = menuItems.filter(item => 
    !item.productType || item.productType === selectedProductType
  );

  if (!phone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">未授權訪問</h2>
          <p className="text-gray-600 mb-4">請先登入</p>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入菜單中...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">點餐系統</h1>
              <p className="text-gray-600 mt-1">
                電話: {phone}
                {customer?.name && (
                  <span className="ml-2 text-blue-600 font-medium">
                    | 歡迎回來，{customer.name}！
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={proceedToCheckout}
                disabled={cart.length === 0}
                className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                  cart.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={cart.length === 0 ? '購物車是空的' : '前往結帳'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {cart.length > 0 && (
                  <span className="ml-2 bg-white text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              <Link 
                href="/"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ← 返回首頁
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full">
          {/* Menu Items */}
          <div className="w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">菜單</h2>
            
            {/* Product Type Filter */}
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => handleProductTypeChange('即飲瓶')}
                className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedProductType === '即飲瓶'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">即飲瓶</span>
              </button>
              <button
                onClick={() => handleProductTypeChange('鮮凍包')}
                className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedProductType === '鮮凍包'
                    ? 'bg-green-100 border-green-300 text-green-700 shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">鮮凍包</span>
              </button>
            </div>

            {/* Product Type Detail Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => handleCategoryClick(selectedProductType)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <span className="text-sm">查看{selectedProductType}詳情</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden">
                  {/* Item Image */}
                  {item.imageUrl ? (
                    <div className="h-70 bg-gray-100">
                      <img
                        src={`${item.imageUrl}`}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-70 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-blue-600 text-sm font-medium">商品圖片</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-5">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{item.name}</h3>
                      <span className="text-xl font-bold text-blue-600 ml-2">
                        NT$ {item.price.toFixed(0)}
                      </span>
                    </div>

                    {/* Item Description */}
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    )}

                    {/* Item Category */}
                    {item.category && (
                      <div className="mb-4">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          {item.category}
                        </span>
                      </div>
                    )}


                    {/* Quantity Selector and Add to Cart */}
                    <div className="space-y-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => updateItemQuantity(item.id, (itemQuantities[item.id] || 1) - 1)}
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-12 text-center font-medium text-gray-900 text-lg">
                          {itemQuantities[item.id] || 1}
                        </span>
                        <button
                          onClick={() => updateItemQuantity(item.id, (itemQuantities[item.id] || 1) + 1)}
                          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                        </svg>
                        加入購物車
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedCategory && (
        <ProductDetailModal
          isOpen={isModalOpen}
          onClose={closeModal}
          category={selectedCategory}
        />
      )}
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomerOrdersPageContent />
    </Suspense>
  );
}
