import { useState, useEffect } from 'react';
import { apiCall } from './api';

interface SystemSettings {
  free_shipping_threshold: string;
  shipping_fee: string;
  store_address: string;
  store_hours: string;
  contact_phone: string;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    free_shipping_threshold: '20',
    shipping_fee: '120',
    store_address: '台南市永康區永康街121號',
    store_hours: '09:00 ~ 17:00',
    contact_phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiCall('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      
      setSettings(prev => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      console.error('Failed to fetch system settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, error, refetch: fetchSettings };
}

