// V2.1 - Railway Integration Sync Functions
// 用於將 easy-order 的客戶和訂單資料同步到 order-system

interface EasyOrderUser {
  phone: string;
  name?: string;
  email?: string;
  birthday?: string;
}

interface EasyOrderOrder {
  id: string;
  userPhone: string;
  totalAmount: number;
  subtotalAmount?: number;
  shippingFee?: number;
  deliveryType: string;
  deliveryInfo?: string; // 配送資訊，包含全家店名
  paymentMethod: string;
  notes?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  orderItems: Array<{
    menuItem: {
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
}

interface RailwayCustomer {
  name: string;
  phone: string;
  address: string;
  family_mart_address: string;
  source: string;
  payment_method: string;
  order_number: string;
}

interface RailwayOrder {
  customer_id: number | null;
  customer_name: string;
  order_date: string;
  order_time: string;
  delivery_date: string;
  status: string;
  notes: string;
  shipping_type: 'none' | 'paid' | 'free';
  shipping_fee: number;
  credit_card_fee: number;
  order_type: string;
  subtotal: number;
  customer_payment: number;
  change: number;
  created_by: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    special_notes: string;
    is_gift: boolean;
  }>;
}

// 獲取 Railway API URL
function getRailwayApiUrl(): string {
  return process.env.RAILWAY_API_URL || 'https://order-system-production-6ef7.up.railway.app';
}

// 檢查是否啟用同步功能
function isSyncEnabled(): boolean {
  return process.env.RAILWAY_SYNC_ENABLED === 'true';
}

// 從 deliveryInfo 中提取店名
function extractStoreName(deliveryInfo?: string): string {
  if (!deliveryInfo) return '';
  
  // 如果 deliveryInfo 包含 " - "，取第一部分作為店名
  if (deliveryInfo.includes(' - ')) {
    return deliveryInfo.split(' - ')[0].trim();
  }
  
  // 否則直接返回 deliveryInfo
  return deliveryInfo.trim();
}

// 轉換客戶資料格式
function transformCustomerData(easyOrderUser: EasyOrderUser, orderId: string, deliveryType: string): RailwayCustomer {
  return {
    name: easyOrderUser.name || `User-${easyOrderUser.phone}`,
    phone: easyOrderUser.phone,
    address: deliveryType === 'pickup' ? '台南市永康區永康街121號' : '', // 根據配送方式設定地址
    family_mart_address: '',
    source: '網路訂購',
    payment_method: '銀行匯款',
    order_number: `#cm${orderId.slice(-10)}`
  };
}

// 轉換訂單資料格式
function transformOrderData(
  easyOrderOrder: EasyOrderOrder, 
  customerName: string,
  customerId?: number
): RailwayOrder {
  const shippingFee = easyOrderOrder.shippingFee || 0;
  const deliveryType = easyOrderOrder.deliveryType;
  
  // 決定配送類型和地址
  let shippingType: 'none' | 'paid' | 'free';
  let address = '';
  
  if (deliveryType === 'pickup') {
    shippingType = 'none';
    address = '台南市永康區永康街121號';
  } else if (shippingFee === 0) {
    shippingType = 'free';
  } else {
    shippingType = 'paid';
  }
  
  // 轉換日期格式
  const orderDate = new Date(easyOrderOrder.createdAt).toISOString().split('T')[0];
  const deliveryDate = easyOrderOrder.estimatedDeliveryDate 
    ? new Date(easyOrderOrder.estimatedDeliveryDate).toISOString().split('T')[0]
    : orderDate;
  
  // 轉換訂單項目
  const items = easyOrderOrder.orderItems.map(item => ({
    product_name: item.menuItem.name,
    quantity: item.quantity,
    unit_price: item.price,
    special_notes: '',
    is_gift: false
  }));
  
  return {
    customer_id: customerId || null,
    customer_name: customerName,
    order_date: orderDate,
    order_time: easyOrderOrder.createdAt,
    delivery_date: deliveryDate,
    status: 'pending',
    notes: deliveryType === 'pickup' ? 'EO_現場取貨' : `EO_${extractStoreName(easyOrderOrder.deliveryInfo) || '全家'}`,
    shipping_type: shippingType,
    shipping_fee: shippingFee,
    credit_card_fee: 0,
    order_type: 'online',
    subtotal: easyOrderOrder.subtotalAmount || easyOrderOrder.totalAmount - shippingFee,
    customer_payment: easyOrderOrder.totalAmount,
    change: 0,
    created_by: 'easy-order-system',
    items: items
  };
}

// 同步客戶資料到 Railway
export async function syncCustomerToRailway(easyOrderUser: EasyOrderUser, orderId: string, deliveryType: string): Promise<number | null> {
  if (!isSyncEnabled()) {
    console.log('Railway sync is disabled');
    return null;
  }
  
  try {
    const railwayCustomer = transformCustomerData(easyOrderUser, orderId, deliveryType);
    const apiUrl = getRailwayApiUrl();
    
    console.log('Syncing customer to Railway:', railwayCustomer);
    
    const response = await fetch(`${apiUrl}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(railwayCustomer)
    });
    
    if (!response.ok) {
      throw new Error(`Railway customer sync failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Customer synced successfully:', result);
    
    // 返回客戶ID (Railway系統會自動分配)
    return result.id || null;
    
  } catch (error) {
    console.error('Failed to sync customer to Railway:', error);
    return null;
  }
}

// 同步訂單資料到 Railway
export async function syncOrderToRailway(
  easyOrderOrder: EasyOrderOrder, 
  customerName: string,
  customerId?: number
): Promise<boolean> {
  if (!isSyncEnabled()) {
    console.log('Railway sync is disabled');
    return false;
  }
  
  try {
    const railwayOrder = transformOrderData(easyOrderOrder, customerName, customerId);
    const apiUrl = getRailwayApiUrl();
    
    console.log('Syncing order to Railway:', railwayOrder);
    
    const response = await fetch(`${apiUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(railwayOrder)
    });
    
    if (!response.ok) {
      throw new Error(`Railway order sync failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Order synced successfully:', result);
    
    return true;
    
  } catch (error) {
    console.error('Failed to sync order to Railway:', error);
    return false;
  }
}

// 完整的訂單同步流程 (客戶 + 訂單)
export async function syncOrderAndCustomerToRailway(
  easyOrderOrder: EasyOrderOrder,
  easyOrderUser: EasyOrderUser
): Promise<{ success: boolean; customerId?: number; error?: string }> {
  try {
    // 1. 先同步客戶資料
    const customerId = await syncCustomerToRailway(easyOrderUser, easyOrderOrder.id, easyOrderOrder.deliveryType);
    
    // 2. 再同步訂單資料
    const orderSuccess = await syncOrderToRailway(
      easyOrderOrder, 
      easyOrderUser.name || `User-${easyOrderUser.phone}`,
      customerId || undefined
    );
    
    if (orderSuccess) {
      return { 
        success: true, 
        customerId: customerId || undefined 
      };
    } else {
      return { 
        success: false, 
        error: 'Order sync failed' 
      };
    }
    
  } catch (error) {
    console.error('Complete sync failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
