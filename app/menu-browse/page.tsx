'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

function MenuBrowsePageContent() {
  const router = useRouter();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<string>('即飲瓶'); // 默認選擇即飲瓶

  useEffect(() => {
    fetchMenuItems();
  }, []);

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

  const handlePurchaseClick = () => {
    // 跳轉到現有登入頁面
    router.push('/');
  };

  // 根據選擇的產品類型篩選菜單項目
  const filteredMenuItems = menuItems.filter(item => 
    !item.productType || item.productType === selectedProductType
  );

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
              <h1 className="text-3xl font-bold text-gray-900">GreenWin Order</h1>
              <p className="text-gray-600 mt-1">果然盈點餐系統 - 菜單瀏覽</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePurchaseClick}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                去購買
              </button>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMenuItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden">
                  {/* Item Image - 填滿卡片寬度，高度自適應 */}
                  {item.imageUrl ? (
                    <div className="bg-gray-50 relative">
                      <img
                        src={`${item.imageUrl}`}
                        alt={item.name}
                        className="w-full h-auto object-cover" // 填滿寬度，高度自適應
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                        onLoad={() => {
                          console.log('圖片載入成功:', item.imageUrl);
                        }}
                      />
                      <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center absolute inset-0" style={{display: 'none'}}>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <p className="text-blue-600 text-xs font-medium">載入中...</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-blue-600 text-xs font-medium">商品圖片</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm font-bold text-gray-900 truncate flex-1">{item.name}</h3>
                      <span className="text-lg font-bold text-blue-600 ml-2 flex-shrink-0">
                        NT$ {item.price.toFixed(0)}
                      </span>
                    </div>

                    {/* Item Description */}
                    {item.description && (
                      <p className="text-gray-600 text-xs mb-2 line-clamp-2">{item.description}</p>
                    )}

                    {/* Item Category */}
                    {item.category && (
                      <div className="mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          {item.category}
                        </span>
                      </div>
                    )}

                    {/* View Only Notice */}
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">點擊「去購買」開始選購</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order Inquiry Card */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Link href="/order-query" className="block hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">訂單查詢/匯款確認</h3>
                <p className="text-sm text-gray-600">查看您的訂單狀態，或上傳匯款資訊以完成付款</p>
              </Link>
            </div>

            {/* LINE Official Customer Service Card */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <a 
                href="https://lin.ee/Q5GleTr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  {/* LINE Icon */}
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">果然盈Line官方客服</h3>
                <p className="text-sm text-gray-600">有任何問題歡迎聯繫我們</p>
              </a>
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

export default function MenuBrowsePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MenuBrowsePageContent />
    </Suspense>
  );
}
