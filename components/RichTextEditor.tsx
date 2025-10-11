'use client';

import { useState, useCallback } from 'react';
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
import ContentBlock from './ContentBlock';

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

interface RichTextEditorProps {
  content: ContentItem[];
  onChange: (content: ContentItem[]) => void;
  onImageUpload: (file: File) => Promise<string>;
  isEditing?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  onImageUpload,
  isEditing = true
}: RichTextEditorProps) {
  // 確保 content 是數組格式
  const contentArray = Array.isArray(content) ? content : [];
  const [uploadingImages, setUploadingImages] = useState<{ [key: string]: boolean }>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = contentArray.findIndex(item => item.id === active.id);
      const newIndex = contentArray.findIndex(item => item.id === over.id);
      
      const newContent = arrayMove(contentArray, oldIndex, newIndex);
      onChange(newContent);
    }
  };

  const addTextBlock = () => {
    const newBlock: ContentItem = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: '',
      style: {
        fontSize: '16px',
        color: '#000000',
        bold: false,
        italic: false,
        textAlign: 'left'
      }
    };
    onChange([...contentArray, newBlock]);
  };

  const addImageBlock = () => {
    const newBlock: ContentItem = {
      id: `image-${Date.now()}`,
      type: 'image',
      content: '',
      imageUrl: '',
      imageAlt: ''
    };
    onChange([...contentArray, newBlock]);
  };

  const addSpecBlock = () => {
    const newBlock: ContentItem = {
      id: `spec-${Date.now()}-${Math.random()}`,
      type: 'spec',
      content: '',
      specs: [
        { label: '最低購買數量', value: '10' },
        { label: '保存期限', value: '3個月' }
      ]
    };
    onChange([...contentArray, newBlock]);
  };

  const handleImageUpload = async (file: File, blockId: string) => {
    setUploadingImages(prev => ({ ...prev, [blockId]: true }));
    
    try {
      const imageUrl = await onImageUpload(file);
      
      const updatedContent = contentArray.map(item => 
        item.id === blockId 
          ? { ...item, imageUrl, imageAlt: file.name }
          : item
      );
      
      onChange(updatedContent);
    } catch (error) {
      console.error('圖片上傳失敗:', error);
    } finally {
      setUploadingImages(prev => ({ ...prev, [blockId]: false }));
    }
  };

  const updateBlock = (id: string, data: Partial<ContentItem>) => {
    const updatedContent = contentArray.map(item => 
      item.id === id ? { ...item, ...data } : item
    );
    onChange(updatedContent);
  };

  const deleteBlock = (id: string) => {
    const updatedContent = contentArray.filter(item => item.id !== id);
    onChange(updatedContent);
  };

  return (
    <div className="space-y-4">
      {/* 工具欄 */}
      {isEditing && (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border">
          <button
            onClick={addTextBlock}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="mr-2">📝</span>
            添加文字
          </button>
          <button
            onClick={() => document.getElementById('image-upload')?.click()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <span className="mr-2">📷</span>
            添加圖片
          </button>
          <button
            onClick={addSpecBlock}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <span className="mr-2">📋</span>
            添加規格
          </button>
        </div>
      )}

      {/* 內容區域 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={contentArray.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {contentArray.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-lg mb-2">開始創建內容</p>
                <p className="text-sm">點擊上方按鈕添加文字或圖片</p>
              </div>
            ) : (
              contentArray.map((item) => (
                <ContentBlock
                  key={item.id}
                  id={item.id}
                  type={item.type}
                  content={item.content}
                  style={item.style}
                  imageUrl={item.imageUrl}
                  imageAlt={item.imageAlt}
                  specs={item.specs}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onImageUpload={onImageUpload}
                  isEditing={isEditing}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* 圖片上傳處理 */}
      {isEditing && (
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            for (const file of files) {
              // 為每個圖片文件創建新的圖片區塊
              const newBlock: ContentItem = {
                id: `image-${Date.now()}-${Math.random()}`,
                type: 'image',
                content: '',
                imageUrl: '',
                imageAlt: file.name
              };
              
              const updatedContent = [...contentArray, newBlock];
              onChange(updatedContent);
              
              // 上傳圖片
              try {
                const imageUrl = await onImageUpload(file);
                const finalContent = updatedContent.map(item => 
                  item.id === newBlock.id 
                    ? { ...item, imageUrl, imageAlt: file.name }
                    : item
                );
                onChange(finalContent);
              } catch (error) {
                console.error('圖片上傳失敗:', error);
                // 如果上傳失敗，移除這個區塊
                const failedContent = updatedContent.filter(item => item.id !== newBlock.id);
                onChange(failedContent);
              }
            }
          }}
          className="hidden"
          id="image-upload"
        />
      )}
    </div>
  );
}
