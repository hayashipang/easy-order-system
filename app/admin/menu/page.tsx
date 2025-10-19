'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableMenuItem from '@/components/SortableMenuItem';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  productType?: string; // 即飲瓶 或 鮮凍包
  isAvailable: boolean;
  imageUrl?: string;
  sortOrder: number;
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
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
        setUploadProgress(20); // 開始上傳
      }
      
      setUploadProgress(40); // 準備發送請求
      
      const response = await apiCall(url, {
        method,
        body: formDataToSend,
      });
      
      setUploadProgress(80); // 請求完成

      if (!response.ok) {
        throw new Error(editingItem ? 'Failed to update menu item' : 'Failed to create menu item');
      }

      setUploadProgress(90); // 處理響應
      
      // 重新獲取菜單項目
      await fetchMenuItems();
      
      setUploadProgress(100); // 完成
      
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
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

  // 處理拖拉排序
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = menuItems.findIndex(item => item.id === active.id);
      const newIndex = menuItems.findIndex(item => item.id === over.id);
      
      const newMenuItems = arrayMove(menuItems, oldIndex, newIndex);
      setMenuItems(newMenuItems);

      // 更新排序順序到後端
      try {
        const reorderData = newMenuItems.map((item, index) => ({
          id: item.id,
          sortOrder: index
        }));

        await apiCall('/api/menu/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ menuItems: reorderData }),
        });
      } catch (err) {
        console.error('更新排序失敗:', err);
        // 如果更新失敗，重新獲取數據
        fetchMenuItems();
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">菜單管理</h1>
              <p className="text-gray-600 mt-1">管理您的菜單項目和排序</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/dashboard" 
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ← 返回儀表板
              </Link>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {editingItem ? '編輯菜單項目' : '新增菜單項目'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名稱 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：招牌奶茶"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    價格 *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：50"
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
                  placeholder="例如：香濃的奶茶，使用優質茶葉製作"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              {/* 上傳進度條 */}
              {uploading && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">上傳中...</span>
                    <span className="text-sm text-gray-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    uploading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading ? '上傳中...' : (editingItem ? '更新' : '新增')}
                </button>
                <button
                  type="button"
                  disabled={uploading}
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
                  className={`px-4 py-2 rounded-md transition-colors ${
                    uploading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Menu Items List */}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={menuItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {menuItems.map((item) => (
                    <SortableMenuItem
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleAvailability={toggleAvailability}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}