'use client';

import { useState, useEffect } from 'react';

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
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
}

export default function ProductDetailModal({ isOpen, onClose, category }: ProductDetailModalProps) {
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      fetchProductDetail();
    }
  }, [isOpen, category]);

  const fetchProductDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/product-details/${encodeURIComponent(category)}`);
      if (response.ok) {
        const data = await response.json();
        setProductDetail(data);
      } else if (response.status === 404) {
        // 如果沒有找到詳情，創建一個默認的
        setProductDetail({
          id: '',
          category,
          title: `${category}詳情`,
          content: '暫無詳情內容',
          rules: undefined,
          images: undefined
        });
      } else {
        throw new Error('獲取詳情失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  const parseContent = (content: string): ContentItem[] => {
    try {
      const parsed = JSON.parse(content);
      // 如果是數組，說明是新格式
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // 如果是對象，說明是舊格式
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
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">產品規格</h3>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {item.specs.map((spec, index) => (
                        <tr key={index} className="border-b border-gray-100 last:border-b-0">
                          <td className="px-4 py-3 text-gray-700 font-medium bg-gray-50 w-1/2">
                            {spec.label}
                          </td>
                          <td className="px-4 py-3 text-gray-900 w-1/2">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

  if (!isOpen) return null;

  const content = productDetail ? parseContent(productDetail.content) : null;
  const rules = productDetail ? parseRules(productDetail.rules) : null;
  const images = productDetail ? parseImages(productDetail.images) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {productDetail?.title || `${category}詳情`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">載入中...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong className="font-bold">錯誤!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {productDetail && !loading && (
            <div className="space-y-6">
              {/* 主要內容 */}
              {content && content.length > 0 && (
                <div className="max-w-none">
                  <div className="space-y-4">
                    {content.map(renderContentItem)}
                  </div>
                </div>
              )}

              {/* 規則文 */}
              {rules && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">產品規格</h3>
                  {rules.left && rules.right ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <tbody>
                          {(() => {
                            const leftItems = rules.left.split('\n').filter((item: string) => item.trim());
                            const rightItems = rules.right.split('\n').filter((item: string) => item.trim());
                            const maxLength = Math.max(leftItems.length, rightItems.length);
                            
                            return Array.from({ length: maxLength }, (_, index) => (
                              <tr key={index} className="border-b border-gray-100 last:border-b-0">
                                <td className="px-4 py-3 text-gray-700 font-medium bg-gray-50 w-1/2">
                                  {leftItems[index] || ''}
                                </td>
                                <td className="px-4 py-3 text-gray-900 w-1/2">
                                  {rightItems[index] || ''}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {rules.left && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">左側規則</h4>
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {rules.left}
                          </div>
                        </div>
                      )}
                      {rules.right && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">右側規則</h4>
                          <div className="text-gray-700 whitespace-pre-wrap">
                            {rules.right}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
              {!content && !rules && images.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <p>暫無詳情內容</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
