'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';

interface ContentItem {
  id: string;
  type: 'text' | 'image' | 'spec';
  content: string;
  style?: {
    fontSize?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: string;
    letterSpacing?: string;
  };
  imageUrl?: string;
  imageAlt?: string;
  specs?: Array<{
    label: string;
    value: string;
  }>;
}

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

export default function PreviewProductDetailPage() {
  const params = useParams();
  const category = decodeURIComponent(params.category as string);
  
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetail();
  }, [category]);

  const fetchProductDetail = async () => {
    try {
      const response = await apiCall(`/api/product-details/${encodeURIComponent(category)}`);
      if (response.ok) {
        const data = await response.json();
        setProductDetail(data);
      } else if (response.status === 404) {
        setError('尚未設置產品詳情');
      } else {
        throw new Error('無法獲取產品詳情');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入產品詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  const parseContent = (content: string): ContentItem[] => {
    try {
      const parsed = JSON.parse(content);
      // 如果是新格式（數組），直接返回
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // 如果是舊格式（單個對象），轉換為數組
      if (parsed && typeof parsed === 'object') {
        return [parsed];
      }
      // 如果是字符串，轉換為文本區塊
      return [{ 
        id: 'text-1', 
        type: 'text', 
        content: content || parsed || '' 
      }];
    } catch {
      // 如果解析失敗，當作純文本處理
      return [{ 
        id: 'text-1', 
        type: 'text', 
        content: content || '' 
      }];
    }
  };


  const parseRules = (rules?: string) => {
    if (!rules) return null;
    try {
      return JSON.parse(rules);
    } catch {
      return null;
    }
  };

  const parseImages = (images?: string) => {
    if (!images) return [];
    try {
      return JSON.parse(images);
    } catch {
      return [];
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
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case '鮮凍包':
        return 'bg-green-50 border-green-200 text-green-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const renderContentItem = (item: ContentItem) => {
    const getTextStyle = () => {
      return {
        fontSize: item.style?.fontSize || '16px',
        color: item.style?.color || '#000000',
        fontWeight: item.style?.bold ? 'bold' : 'normal',
        fontStyle: item.style?.italic ? 'italic' : 'normal',
        textAlign: item.style?.textAlign || 'left',
        lineHeight: item.style?.lineHeight || '1.5',
        letterSpacing: item.style?.letterSpacing || '0px'
      };
    };

    switch (item.type) {
      case 'text':
        return (
          <div key={item.id} className="mb-4">
            <div style={getTextStyle()} className="whitespace-pre-wrap">
              {item.content}
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div key={item.id} className="mb-4">
            {item.imageUrl ? (
              <div>
                <img
                  src={item.imageUrl}
                  alt={item.imageAlt || '圖片'}
                  className="w-full h-auto rounded-lg shadow-md block"
                  style={{ maxWidth: '100%', width: '100%' }}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📷</div>
                <p>圖片未設置</p>
              </div>
            )}
          </div>
        );
      
      case 'spec':
        return (
          <div key={item.id} className="mb-4">
            {item.specs && item.specs.length > 0 ? (
              <div className="space-y-2">
                {item.specs.map((spec, index) => (
                  <div key={index} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-700 font-medium w-1/2">{spec.label}</span>
                    <span className="text-gray-900 text-left w-1/2">{spec.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>規格信息未設置</p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
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
          <Link href="/admin/product-details" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            返回詳情管理
          </Link>
        </div>
      </div>
    );
  }

  if (!productDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">尚未設置詳情</h2>
          <p className="text-gray-600 mb-4">此分類尚未設置產品詳情</p>
          <Link href={`/admin/product-details/edit/${encodeURIComponent(category)}`} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            創建詳情
          </Link>
        </div>
      </div>
    );
  }

  const content = parseContent(productDetail.content);
  const rules = parseRules(productDetail.rules);
  const images = parseImages(productDetail.images);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{getCategoryIcon(category)}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">預覽{category}詳情</h1>
                <p className="text-gray-600">預覽{category}的產品詳情內容</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/product-details/edit/${encodeURIComponent(category)}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                編輯詳情
              </Link>
              <Link
                href="/admin/product-details"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                ← 返回詳情管理
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Preview Header */}
          <div className={`px-6 py-4 border-b ${getCategoryColor(category)}`}>
            <h2 className="text-2xl font-bold">{productDetail.title}</h2>
            <p className="text-sm opacity-75">
              最後更新: {new Date(productDetail.updatedAt).toLocaleString('zh-TW')}
            </p>
          </div>

          {/* Preview Body */}
          <div className="p-6 space-y-6">
            {/* 主要內容 */}
            {content && content.length > 0 && (
              <div className="max-w-none">
                {content.map(renderContentItem)}
              </div>
            )}


            {/* 圖片 */}
            {images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">相關圖片</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((imageUrl: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`${category}圖片 ${index + 1}`}
                        className="w-full h-auto object-contain rounded-lg shadow-md group-hover:shadow-lg transition-shadow block"
                        style={{ maxWidth: '100%', width: '100%' }}
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 如果沒有內容 */}
            {(!content || content.length === 0) && !rules && images.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p>暫無詳情內容</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Footer */}
        <div className="mt-6 flex justify-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <div className="flex items-center">
              <div className="text-blue-500 mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-800 text-sm font-medium">預覽模式</p>
                <p className="text-blue-600 text-xs">這是客戶端看到的詳情內容</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
