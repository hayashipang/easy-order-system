'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';

interface SystemSettings {
  shipping_fee: string;
  store_address: string;
  store_hours: string;
  contact_phone: string;
}

interface GiftRule {
  threshold: number;
  quantity: number;
}

interface PromotionSettings {
  isFreeShippingEnabled: boolean;
  freeShippingThreshold: number;
  isGiftEnabled: boolean;
  giftRules: string; // JSON string
  giftProductName: string;
  promotionText: string;
}


export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    shipping_fee: '120',
    store_address: '台南市永康區永康街121號',
    store_hours: '09:00 ~ 17:00',
    contact_phone: ''
  });
  const [promotionSettings, setPromotionSettings] = useState<PromotionSettings>({
    isFreeShippingEnabled: false,
    freeShippingThreshold: 20,
    isGiftEnabled: false,
    giftRules: JSON.stringify([
      { threshold: 15, quantity: 1 },
      { threshold: 20, quantity: 2 },
      { threshold: 30, quantity: 3 }
    ]),
    giftProductName: '隨機送一瓶',
    promotionText: '滿15送1瓶，滿20送2瓶，滿30送3瓶'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    // 檢查管理員登入狀態
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      // 獲取系統設定
      const settingsResponse = await apiCall('/api/settings');
      if (!settingsResponse.ok) {
        throw new Error('Failed to fetch settings');
      }
      const settingsData = await settingsResponse.json();
      
      // 獲取促銷設定
      const promotionResponse = await apiCall('/api/promotion-settings');
      if (promotionResponse.ok) {
        const promotionData = await promotionResponse.json();
        setPromotionSettings(prev => ({
          ...prev,
          ...promotionData
        }));
      }
      
      
      // 合併預設值和從API獲取的設定
      setSettings(prev => ({
        ...prev,
        ...settingsData
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // 保存系統設定
      const settingsResponse = await apiCall('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!settingsResponse.ok) {
        throw new Error('Failed to update settings');
      }

      // 保存促銷設定
      const promotionResponse = await apiCall('/api/promotion-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promotionSettings }),
      });

      if (!promotionResponse.ok) {
        throw new Error('Failed to update promotion settings');
      }

      setSuccess('設定已成功更新！');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof SystemSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePromotionChange = (key: keyof PromotionSettings, value: any) => {
    setPromotionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入設定中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Easy Order 管理後台</h1>
              <p className="text-gray-600 mt-1">系統設定</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              ← 返回儀表板
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <Link 
              href="/admin/dashboard" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              訂單管理
            </Link>
            <Link 
              href="/admin/menu" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              菜單管理
            </Link>
            <Link 
              href="/admin/customers" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              客戶管理
            </Link>
            <Link 
              href="/admin/product-details" 
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap"
            >
              產品詳情
            </Link>
            <Link 
              href="/admin/settings" 
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 whitespace-nowrap"
            >
              系統設定
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">系統設定</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 免運費設定 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">運費設定</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    運費金額（元）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.shipping_fee}
                    onChange={(e) => handleInputChange('shipping_fee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如：120"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    未達免運門檻時的運費
                  </p>
                </div>
              </div>
            </div>

            {/* 門市資訊 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">門市資訊</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    取貨地址
                  </label>
                  <input
                    type="text"
                    value={settings.store_address}
                    onChange={(e) => handleInputChange('store_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="請輸入完整地址"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      營業時間
                    </label>
                    <input
                      type="text"
                      value={settings.store_hours}
                      onChange={(e) => handleInputChange('store_hours', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="例如：09:00 ~ 17:00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      聯絡電話
                    </label>
                    <input
                      type="tel"
                      value={settings.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="例如：06-1234567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 促銷設定 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">促銷設定</h3>
              
              <div className="space-y-6">
                {/* 免運費促銷 */}
                <div className="bg-white border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-purple-800">免運費促銷</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={promotionSettings.isFreeShippingEnabled}
                        onChange={(e) => handlePromotionChange('isFreeShippingEnabled', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">啟用免運費促銷</span>
                    </label>
                  </div>
                  
                  {promotionSettings.isFreeShippingEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        免運費門檻（瓶數）
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={promotionSettings.freeShippingThreshold}
                        onChange={(e) => handlePromotionChange('freeShippingThreshold', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="例如：20"
                      />
                    </div>
                  )}
                </div>

                {/* 贈品促銷 */}
                <div className="bg-white border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-purple-800">贈品促銷</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={promotionSettings.isGiftEnabled}
                        onChange={(e) => handlePromotionChange('isGiftEnabled', e.target.checked)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">啟用贈品促銷</span>
                    </label>
                  </div>
                  
                  {promotionSettings.isGiftEnabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          多層級贈品促銷設定
                        </label>
                        <div className="space-y-3">
                          {(() => {
                            const giftRules: GiftRule[] = JSON.parse(promotionSettings.giftRules || '[]');
                            return giftRules.map((rule, index) => (
                              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1">
                                    滿
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={rule.threshold}
                                    onChange={(e) => {
                                      const newRules = [...giftRules];
                                      newRules[index].threshold = parseInt(e.target.value) || 0;
                                      handlePromotionChange('giftRules', JSON.stringify(newRules));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="瓶數"
                                  />
                                </div>
                                <div className="text-center text-gray-500">
                                  <span className="text-sm">送</span>
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-1">
                                    數量
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={rule.quantity}
                                    onChange={(e) => {
                                      const newRules = [...giftRules];
                                      newRules[index].quantity = parseInt(e.target.value) || 0;
                                      handlePromotionChange('giftRules', JSON.stringify(newRules));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="瓶數"
                                  />
                                </div>
                                <div className="text-center text-gray-500">
                                  <span className="text-sm">瓶</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          系統會自動選擇符合條件的最高層級促銷
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          贈品產品名稱
                        </label>
                        <input
                          type="text"
                          value={promotionSettings.giftProductName}
                          onChange={(e) => handlePromotionChange('giftProductName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="例如：隨機送一瓶"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          此名稱將顯示在結帳頁面的贈品信息中
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 促銷文字 */}
                <div className="bg-white border border-purple-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-purple-800 mb-4">促銷文字</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      自定義促銷描述
                    </label>
                    <textarea
                      value={promotionSettings.promotionText}
                      onChange={(e) => handlePromotionChange('promotionText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="例如：買20送1瓶＋免運費"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      此文字將顯示在結帳頁面的促銷信息中
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 提交按鈕 */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '儲存中...' : '儲存設定'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

