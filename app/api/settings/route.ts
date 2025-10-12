import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleCors, addCorsHeaders, corsHeaders } from '@/lib/cors';

const prisma = new PrismaClient();

// GET /api/settings - 獲取所有系統設定
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // 嘗試從數據庫獲取設定
    let settingsMap;
    try {
      const settings = await prisma.systemSetting.findMany();
      settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
    } catch (dbError) {
      console.error('數據庫查詢失敗，使用預設設定:', dbError);
      // 如果數據庫查詢失敗，使用預設設定
      settingsMap = {
        free_shipping_threshold: '20',
        shipping_fee: '120',
        store_address: '台南市永康區永康街121號',
        store_hours: '09:00 ~ 17:00',
        contact_phone: ''
      };
    }

    const response = NextResponse.json(settingsMap);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('獲取系統設定錯誤:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/settings - 更新系統設定
export async function PUT(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    // 更新每個設定
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { 
          key, 
          value: String(value),
          description: getSettingDescription(key)
        }
      });
    });

    await Promise.all(updatePromises);

    const response = NextResponse.json({ message: 'Settings updated successfully' });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('更新系統設定錯誤:', error);
    return NextResponse.json({ 
      error: 'Failed to update settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 獲取設定描述
function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'free_shipping_threshold': '免運費門檻（瓶數）',
    'shipping_fee': '運費金額',
    'store_address': '取貨地址',
    'store_hours': '營業時間',
    'contact_phone': '聯絡電話'
  };
  
  return descriptions[key] || '';
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}
