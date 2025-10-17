'use client';

interface PromotionTextGridProps {
  promotionText?: string;
  className?: string;
}

export default function PromotionTextGrid({ promotionText, className = '' }: PromotionTextGridProps) {
  if (!promotionText) return null;

  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        {/* 促銷圖標 */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
        
        {/* 促銷文字內容 */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-yellow-800 mb-1">🎉 促銷活動</h4>
          <p className="text-sm text-yellow-700 leading-relaxed">
            {promotionText}
          </p>
        </div>
      </div>
    </div>
  );
}
