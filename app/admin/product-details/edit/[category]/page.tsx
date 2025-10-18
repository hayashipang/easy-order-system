'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import { apiCall } from '@/lib/api';

interface ProductDetail {
  id: string;
  category: string;
  title: string;
  content: string;
  rules?: string;
  images?: string;
}


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
  };
  imageUrl?: string;
  imageAlt?: string;
}

export default function EditProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const category = decodeURIComponent(params.category as string);
  
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: [] as ContentItem[],
    images: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    fetchProductDetail();
  }, [category]);

  const fetchProductDetail = async () => {
    try {
      const response = await apiCall(`/api/product-details/${encodeURIComponent(category)}`);
      if (response.ok) {
        const data = await response.json();
        setProductDetail(data);
        setFormData({
          title: data.title || '',
          content: data.content ? JSON.parse(data.content) : [],
          images: data.images ? JSON.parse(data.images) : []
        });
      } else if (response.status === 404) {
        // 創建新的產品詳情
        setFormData({
          title: `${category}詳情`,
          content: [],
          images: []
        });
      } else {
        throw new Error('無法獲取產品詳情');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入產品詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    // 使用專門的圖片上傳端點
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiCall('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('圖片上傳失敗');
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(file => handleImageUpload(file));
      const urls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...urls]
      }));
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingImages(false);
    }
  };



  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await apiCall(`/api/product-details/${encodeURIComponent(category)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: JSON.stringify(formData.content),
          images: JSON.stringify(formData.images)
        }),
      });

      if (!response.ok) {
        throw new Error('保存失敗');
      }

      router.push('/admin/product-details');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失敗');
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{getCategoryIcon(category)}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">編輯{category}詳情</h1>
                <p className="text-gray-600">編輯{category}的產品詳情內容</p>
              </div>
            </div>
            <Link
              href="/admin/product-details"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← 返回詳情管理
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">錯誤!</strong>
            <span className="block sm:inline"> {error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <svg onClick={() => setError(null)} className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">標題</h3>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="輸入詳情標題"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">內容編輯</h3>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData(prev => ({ ...prev, content }))}
              onImageUpload={handleImageUpload}
              isEditing={true}
            />
            <p className="mt-2 text-sm text-gray-500">
              支持拖拽排序、富文本格式、圖片上傳等功能
            </p>
          </div>


          {/* Images */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">圖片上傳</h3>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
                disabled={uploadingImages}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-4xl text-gray-400 mb-2">📷</div>
                <p className="text-gray-600">
                  {uploadingImages ? '上傳中...' : '點擊或拖拽圖片到此處上傳'}
                </p>
                <p className="text-sm text-gray-500 mt-1">支持多張圖片</p>
              </label>
            </div>

            {/* Image Preview */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`上傳圖片 ${index + 1}`}
                      className="w-full h-auto object-contain rounded-lg"
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/product-details"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              取消
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                '保存詳情'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
