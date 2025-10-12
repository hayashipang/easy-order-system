'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  productType?: string; // 即飲瓶 或 鮮凍包
  isAvailable: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    productType: '',
    isAvailable: true
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    // 檢查管理員登入狀態
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    fetchMenuItems();
  }, [router]);

  const fetchMenuItems = async () => {
    try {
      const response = await apiCall('/api/menu');
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingItem 
        ? `/api/menu/${editingItem.id}`
        : '/api/menu';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      // 創建FormData以支持文件上傳
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('productType', formData.productType);
      formDataToSend.append('isAvailable', formData.isAvailable.toString());
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }
      
      const response = await apiCall(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(editingItem ? 'Failed to update menu item' : 'Failed to create menu item');
      }

      // 重新獲取菜單項目
      await fetchMenuItems();
      
      // 重置表單
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        productType: '',
        isAvailable: true
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowAddForm(false);
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      productType: item.productType || '',
      isAvailable: item.isAvailable
    });
    setImagePreview(item.imageUrl || null);
    setSelectedImage(null);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個菜單項目嗎？此操作無法復原。')) {
      return;
    }

    try {
      const response = await apiCall(`/api/menu/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }

      setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu item');
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiCall(`/api/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update menu item');
      }

      setMenuItems(menuItems.map(item => 
        item.id === id ? { ...item, isAvailable: !currentStatus } : item
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu item');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('adminLoggedIn');
    router.push('/admin/login');
  };

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
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Easy Order 管理後台</h1>
              <p className="text-gray-600">菜單管理系統</p>
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
          <nav className="flex space-x-8 overflow-x-auto">
            <Link 
              href="/admin/dashboard" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              訂單管理
            </Link>
            <Link 
              href="/admin/menu" 
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 whitespace-nowrap"
            >
              菜單管理
            </Link>
            <Link 
              href="/admin/customers" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              客戶管理
            </Link>
            <Link 
              href="/admin/product-details" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              產品詳情
            </Link>
            <Link 
              href="/admin/settings" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              系統設定
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

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingItem ? '編輯菜單項目' : '新增菜單項目'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名稱
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    價格 (NT$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分類
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：主餐、飲料、甜點"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  產品類型
                </label>
                <select
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">請選擇產品類型</option>
                  <option value="即飲瓶">即飲瓶</option>
                  <option value="鮮凍包">鮮凍包</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品圖片
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="預覽"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                  可供應
                </label>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? '更新' : '新增'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    setFormData({
                      name: '',
                      description: '',
                      price: '',
                      category: '',
                      productType: '',
                      isAvailable: true
                    });
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">菜單項目</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增菜單項目
            </button>
          </div>

          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">目前沒有菜單項目</p>
              <p className="text-gray-400 text-sm mt-2">點擊上方按鈕開始新增菜單項目</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Item Image */}
                  {item.imageUrl ? (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <img
                        src={`${item.imageUrl}`}
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center absolute inset-0" style={{display: 'none'}}>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <p className="text-gray-600 text-xs font-medium">圖片載入失敗</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-xs font-medium">無圖片</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                      <button
                        onClick={() => toggleAvailability(item.id, item.isAvailable)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.isAvailable ? '供應中' : '暫停'}
                      </button>
                    </div>

                    {/* Item Description */}
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {/* Item Category */}
                    {item.category && (
                      <div className="mb-3">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {item.category}
                        </span>
                      </div>
                    )}

                    {/* Item Price */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-gray-900">NT$ {Number(item.price).toFixed(0)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors text-sm"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
