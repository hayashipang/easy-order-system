'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiCall } from '@/lib/api';

interface ProductDetail {
  id: string;
  category: string;
  title: string;
  content: string;
  rules?: string;
  images?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailsPage() {
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetails();
  }, []);

  const fetchProductDetails = async () => {
    try {
      const response = await apiCall('/api/product-details');
      if (!response.ok) {
        throw new Error('無法獲取產品詳情');
      }
      const data = await response.json();
      setProductDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入產品詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '即飲瓶':
        return '🍼';
      case '鮮凍包':
        return '📦';
      default:
        return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '即飲瓶':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case '鮮凍包':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleDelete = async (category: string) => {
    if (!confirm(`確定要刪除「${category}」的產品詳情嗎？此操作無法復原。`)) {
      return;
    }

    setDeleting(category);
    try {
      const response = await fetch(`/api/product-details/${encodeURIComponent(category)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('刪除失敗');
      }

      // 從列表中移除已刪除的項目
      setProductDetails(prev => prev.filter(pd => pd.category !== category));
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除產品詳情失敗');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-700">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">錯誤</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchProductDetails} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            重試
          </button>
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
              <h1 className="text-2xl font-bold text-gray-900">產品詳情管理</h1>
              <p className="text-gray-600">管理即飲瓶和鮮凍包的詳情內容</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← 返回管理後台
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 即飲瓶 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <div>
                <h2 className="text-xl font-semibold text-blue-900">即飲瓶詳情</h2>
                <p className="text-blue-700 text-sm">管理即飲瓶的產品詳情</p>
              </div>
            </div>
            <div className="p-6">
              {productDetails.find(pd => pd.category === '即飲瓶') ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      最後更新: {new Date(productDetails.find(pd => pd.category === '即飲瓶')!.updatedAt).toLocaleString('zh-TW')}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      已設置
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <Link
                      href={`/admin/product-details/edit/即飲瓶`}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      編輯詳情
                    </Link>
                    <Link
                      href={`/admin/product-details/preview/即飲瓶`}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-center"
                    >
                      預覽詳情
                    </Link>
                    <button
                      onClick={() => handleDelete('即飲瓶')}
                      disabled={deleting === '即飲瓶'}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      title="刪除詳情"
                    >
                      {deleting === '即飲瓶' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 text-4xl mb-2">📝</div>
                  <p className="text-gray-600 mb-4">尚未設置即飲瓶詳情</p>
                  <Link
                    href={`/admin/product-details/edit/即飲瓶`}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    創建詳情
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 鮮凍包 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-200">
              <div>
                <h2 className="text-xl font-semibold text-green-900">鮮凍包詳情</h2>
                <p className="text-green-700 text-sm">管理鮮凍包的產品詳情</p>
              </div>
            </div>
            <div className="p-6">
              {productDetails.find(pd => pd.category === '鮮凍包') ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      最後更新: {new Date(productDetails.find(pd => pd.category === '鮮凍包')!.updatedAt).toLocaleString('zh-TW')}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      已設置
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <Link
                      href={`/admin/product-details/edit/鮮凍包`}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
                    >
                      編輯詳情
                    </Link>
                    <Link
                      href={`/admin/product-details/preview/鮮凍包`}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-center"
                    >
                      預覽詳情
                    </Link>
                    <button
                      onClick={() => handleDelete('鮮凍包')}
                      disabled={deleting === '鮮凍包'}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      title="刪除詳情"
                    >
                      {deleting === '鮮凍包' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 text-4xl mb-2">📝</div>
                  <p className="text-gray-600 mb-4">尚未設置鮮凍包詳情</p>
                  <Link
                    href={`/admin/product-details/edit/鮮凍包`}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    創建詳情
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Product Details List */}
        {productDetails.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">所有產品詳情</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {productDetails.map((detail) => (
                <div key={detail.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{detail.title}</h4>
                      <p className="text-sm text-gray-600">
                        分類: {detail.category} | 
                        創建時間: {new Date(detail.createdAt).toLocaleString('zh-TW')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(detail.category)}`}>
                        {detail.category}
                      </span>
                      <Link
                        href={`/admin/product-details/edit/${encodeURIComponent(detail.category)}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        編輯
                      </Link>
                      <button
                        onClick={() => handleDelete(detail.category)}
                        disabled={deleting === detail.category}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        title="刪除詳情"
                      >
                        {deleting === detail.category ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            刪除
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
