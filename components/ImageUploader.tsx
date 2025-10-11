'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<string>;
  onError?: (error: string) => void;
  maxSize?: number; // MB
  acceptedTypes?: string[];
}

export default function ImageUploader({
  onUpload,
  onError,
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // 檢查文件類型
    if (!acceptedTypes.includes(file.type)) {
      return `不支持的文件類型。支持的格式：${acceptedTypes.join(', ')}`;
    }

    // 檢查文件大小
    if (file.size > maxSize * 1024 * 1024) {
      return `文件大小不能超過 ${maxSize}MB`;
    }

    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 模擬上傳進度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const imageUrl = await onUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // 延遲一下讓用戶看到100%進度
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      onError?.(error instanceof Error ? error.message : '上傳失敗');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 上傳區域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="text-4xl">📤</div>
            <div className="text-lg font-medium text-gray-700">上傳中...</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{uploadProgress}%</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl">📷</div>
            <div className="text-lg font-medium text-gray-700">
              點擊或拖拽圖片到此處上傳
            </div>
            <div className="text-sm text-gray-500">
              支持 JPG、PNG、GIF、WebP 格式，最大 {maxSize}MB
            </div>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              選擇圖片
            </button>
          </div>
        )}
      </div>

      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
