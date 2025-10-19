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
    // 跳轉到登入頁面
    router.push('/login');
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">GreenWin Order</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">菜單瀏覽</p>
            </div>
            <div className="w-full sm:w-auto flex justify-end">
              <button
                onClick={handlePurchaseClick}
                className="text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center w-full sm:w-auto"
                style={{ backgroundColor: '#E57241' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D4633A'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E57241'}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                去購物/訂單查詢
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
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
              <button
                onClick={() => handleProductTypeChange('即飲瓶')}
                className={`px-4 sm:px-6 py-3 rounded-lg border-2 transition-all duration-200 text-white ${
                  selectedProductType === '即飲瓶'
                    ? 'shadow-md'
                    : ''
                }`}
                style={{
                  backgroundColor: selectedProductType === '即飲瓶' ? '#2A5D2C' : '#D3D3D3',
                  borderColor: selectedProductType === '即飲瓶' ? '#2A5D2C' : '#D3D3D3'
                }}
                onMouseEnter={(e) => {
                  if (selectedProductType !== '即飲瓶') {
                    e.currentTarget.style.backgroundColor = '#2A5D2C';
                    e.currentTarget.style.borderColor = '#2A5D2C';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProductType !== '即飲瓶') {
                    e.currentTarget.style.backgroundColor = '#D3D3D3';
                    e.currentTarget.style.borderColor = '#D3D3D3';
                  }
                }}
              >
                <span className="font-medium text-sm sm:text-base">即飲瓶</span>
              </button>
              <button
                onClick={() => handleProductTypeChange('鮮凍包')}
                className={`px-4 sm:px-6 py-3 rounded-lg border-2 transition-all duration-200 text-white ${
                  selectedProductType === '鮮凍包'
                    ? 'shadow-md'
                    : ''
                }`}
                style={{
                  backgroundColor: selectedProductType === '鮮凍包' ? '#4B8B3B' : '#D3D3D3',
                  borderColor: selectedProductType === '鮮凍包' ? '#4B8B3B' : '#D3D3D3'
                }}
                onMouseEnter={(e) => {
                  if (selectedProductType !== '鮮凍包') {
                    e.currentTarget.style.backgroundColor = '#4B8B3B';
                    e.currentTarget.style.borderColor = '#4B8B3B';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProductType !== '鮮凍包') {
                    e.currentTarget.style.backgroundColor = '#D3D3D3';
                    e.currentTarget.style.borderColor = '#D3D3D3';
                  }
                }}
              >
                <span className="font-medium text-sm sm:text-base">鮮凍包</span>
              </button>
            </div>

            {/* Product Type Detail Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => handleCategoryClick(selectedProductType)}
                className="text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center w-full sm:w-auto"
                style={{ backgroundColor: '#D4A44A' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C1953F'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D4A44A'}
              >
                <span className="text-sm sm:text-base">查看{selectedProductType}詳情</span>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                  
                  <div className="p-3 sm:p-4">
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate flex-1">{item.name}</h3>
                      <span className="text-base sm:text-lg font-bold text-blue-600 ml-2 flex-shrink-0">
                        NT$ {item.price.toFixed(0)}
                      </span>
                    </div>

                    {/* Item Description */}
                    {item.description && (
                      <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">{item.description}</p>
                    )}

                    {/* Item Category */}
                    {item.category && (
                      <div className="mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs sm:text-sm px-2 py-1 rounded-full font-medium">
                          {item.category}
                        </span>
                      </div>
                    )}

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

export default function MenuBrowsePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MenuBrowsePageContent />
    </Suspense>
  );
}
