'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ContentBlockProps {
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
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  isEditing?: boolean;
}

export default function ContentBlock({
  id,
  type,
  content,
  style = {},
  imageUrl,
  imageAlt,
  specs = [],
  onUpdate,
  onDelete,
  onImageUpload,
  isEditing = false
}: ContentBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editStyle, setEditStyle] = useState(style);
  const [uploading, setUploading] = useState(false);
  const [editSpecs, setEditSpecs] = useState(specs);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style_transform = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(id, {
      type,
      content: editContent,
      style: editStyle,
      imageUrl,
      imageAlt
    });
    setIsEditingContent(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setEditStyle(style);
    setIsEditingContent(false);
  };

  const handleImageUpload = async (file: File) => {
    if (!onImageUpload) return;
    
    setUploading(true);
    try {
      const imageUrl = await onImageUpload(file);
      onUpdate(id, {
        imageUrl,
        imageAlt: file.name
      });
    } catch (error) {
      console.error('圖片上傳失敗:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSpecSave = () => {
    onUpdate(id, {
      specs: editSpecs
    });
    setIsEditingContent(false);
  };

  const handleSpecCancel = () => {
    setEditSpecs(specs);
    setIsEditingContent(false);
  };

  const addSpec = () => {
    setEditSpecs([...editSpecs, { label: '', value: '' }]);
  };

  const updateSpec = (index: number, field: 'label' | 'value', value: string) => {
    const newSpecs = [...editSpecs];
    newSpecs[index] = { ...newSpecs[index], [field]: value };
    setEditSpecs(newSpecs);
  };

  const removeSpec = (index: number) => {
    setEditSpecs(editSpecs.filter((_, i) => i !== index));
  };

  const getTextStyle = () => {
    return {
      fontSize: editStyle.fontSize || '16px',
      color: editStyle.color || '#000000',
      fontWeight: editStyle.bold ? 'bold' : 'normal',
      fontStyle: editStyle.italic ? 'italic' : 'normal',
      textAlign: editStyle.textAlign || 'left',
      lineHeight: editStyle.lineHeight || '1.5',
      letterSpacing: editStyle.letterSpacing || '0px'
    };
  };

  return (
    <div
      ref={setNodeRef}
      style={style_transform}
      className={`relative group border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 ${
        isDragging ? 'bg-blue-50' : 'bg-white'
      } ${isHovered ? 'border-blue-400' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 拖拽手柄 */}
      {isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-2 w-4 h-4 bg-gray-400 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
      )}

      {/* 操作按鈕 */}
      {isEditing && (
        <div className="absolute -right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditingContent(true)}
            className="w-6 h-6 bg-blue-500 rounded text-white text-xs hover:bg-blue-600"
            title="編輯"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(id)}
            className="w-6 h-6 bg-red-500 rounded text-white text-xs hover:bg-red-600"
            title="刪除"
          >
            🗑️
          </button>
        </div>
      )}

      {/* 內容區域 */}
      {type === 'text' ? (
        <div>
          {isEditingContent ? (
            <div className="space-y-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="輸入文字內容..."
              />
              
              {/* 樣式控制 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">字體大小</label>
                  <select
                    value={editStyle.fontSize || '16px'}
                    onChange={(e) => setEditStyle({...editStyle, fontSize: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="28px">28px</option>
                    <option value="32px">32px</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">對齊方式</label>
                  <select
                    value={editStyle.textAlign || 'left'}
                    onChange={(e) => setEditStyle({...editStyle, textAlign: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="left">左對齊</option>
                    <option value="center">居中</option>
                    <option value="right">右對齊</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">行距</label>
                  <select
                    value={editStyle.lineHeight || '1.5'}
                    onChange={(e) => setEditStyle({...editStyle, lineHeight: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1.2">緊湊 (1.2)</option>
                    <option value="1.4">正常 (1.4)</option>
                    <option value="1.5">標準 (1.5)</option>
                    <option value="1.6">寬鬆 (1.6)</option>
                    <option value="1.8">很寬鬆 (1.8)</option>
                    <option value="2.0">極寬鬆 (2.0)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">字間距</label>
                  <select
                    value={editStyle.letterSpacing || '0px'}
                    onChange={(e) => setEditStyle({...editStyle, letterSpacing: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="-0.5px">緊密 (-0.5px)</option>
                    <option value="0px">標準 (0px)</option>
                    <option value="0.5px">寬鬆 (0.5px)</option>
                    <option value="1px">很寬鬆 (1px)</option>
                    <option value="1.5px">極寬鬆 (1.5px)</option>
                    <option value="2px">超寬鬆 (2px)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editStyle.bold || false}
                    onChange={(e) => setEditStyle({...editStyle, bold: e.target.checked})}
                    className="mr-2"
                  />
                  粗體
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editStyle.italic || false}
                    onChange={(e) => setEditStyle({...editStyle, italic: e.target.checked})}
                    className="mr-2"
                  />
                  斜體
                </label>
                <div className="flex items-center">
                  <label className="mr-2">顏色:</label>
                  <input
                    type="color"
                    value={editStyle.color || '#000000'}
                    onChange={(e) => setEditStyle({...editStyle, color: e.target.value})}
                    className="w-8 h-8 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div
              style={getTextStyle()}
              className="min-h-[2rem] cursor-pointer"
              onClick={() => isEditing && setIsEditingContent(true)}
            >
              {content || '點擊編輯文字內容...'}
            </div>
          )}
        </div>
      ) : type === 'spec' ? (
        <div>
          {isEditingContent ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {editSpecs.map((spec, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={(e) => updateSpec(index, 'label', e.target.value)}
                      placeholder="項目名稱"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">:</span>
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => updateSpec(index, 'value', e.target.value)}
                      placeholder="對應值"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeSpec(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={addSpec}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                + 添加規格項目
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSpecSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={handleSpecCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer"
              onClick={() => isEditing && setIsEditingContent(true)}
            >
              {specs.length > 0 ? (
                <div className="space-y-2">
                  {specs.map((spec, index) => (
                    <div key={index} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-700 font-medium w-1/2">{spec.label}</span>
                      <span className="text-gray-900 text-left w-1/2">{spec.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>點擊編輯規格信息</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {imageUrl ? (
            <div className="text-center">
              <img
                src={imageUrl}
                alt={imageAlt || '圖片'}
                className="max-w-full h-auto rounded-lg shadow-md mx-auto"
              />
              {isEditing && (
                <div className="mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id={`image-upload-${id}`}
                  />
                  <button
                    onClick={() => document.getElementById(`image-upload-${id}`)?.click()}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    更換圖片
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {uploading ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <p>上傳中...</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📷</div>
                  <p className="mb-4">點擊上傳圖片</p>
                  {isEditing && onImageUpload && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                        id={`image-upload-${id}`}
                      />
                      <button
                        onClick={() => document.getElementById(`image-upload-${id}`)?.click()}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        選擇圖片
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
