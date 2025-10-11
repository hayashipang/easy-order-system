'use client';

import { useState } from 'react';

interface CategoryIconProps {
  category: string;
  onCategoryClick: (category: string) => void;
}

export default function CategoryIcon({ category, onCategoryClick }: CategoryIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryInfo = (category: string) => {
    switch (category.toLowerCase()) {
      case '即飲瓶':
        return {
          icon: '🍼',
          label: '即飲瓶',
          color: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
          borderColor: 'border-blue-300'
        };
      case '鮮凍包':
        return {
          icon: '📦',
          label: '鮮凍包',
          color: 'bg-green-100 hover:bg-green-200 text-green-700',
          borderColor: 'border-green-300'
        };
      default:
        return {
          icon: '📋',
          label: category,
          color: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          borderColor: 'border-gray-300'
        };
    }
  };

  const categoryInfo = getCategoryInfo(category);

  return (
    <button
      onClick={() => onCategoryClick(category)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        inline-flex items-center px-3 py-2 rounded-lg border-2 transition-all duration-200
        ${categoryInfo.color} ${categoryInfo.borderColor}
        ${isHovered ? 'scale-105 shadow-md' : 'shadow-sm'}
      `}
      title={`查看${categoryInfo.label}詳情`}
    >
      <span className="text-lg mr-2">{categoryInfo.icon}</span>
      <span className="text-sm font-medium">{categoryInfo.label}</span>
    </button>
  );
}
