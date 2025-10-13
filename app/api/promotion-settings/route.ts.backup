import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// Force redeploy to fix PUT method issue

// GET - 獲取促銷設定
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // 獲取或創建促銷設定
    let promotionSettings = await prisma.promotionSetting.findFirst();
    
    if (!promotionSettings) {
      // 如果沒有促銷設定，創建一個預設的
      const defaultGiftRules = JSON.stringify([
        { threshold: 15, quantity: 1 },
        { threshold: 20, quantity: 2 },
        { threshold: 30, quantity: 3 }
      ]);
      
      promotionSettings = await prisma.promotionSetting.create({
        data: {
          isFreeShippingEnabled: false,
          freeShippingThreshold: 20,
          isGiftEnabled: false,
          giftRules: defaultGiftRules,
          giftProductName: '隨機送一瓶',
          promotionText: '滿15送1瓶，滿20送2瓶，滿30送3瓶'
        }
      });
    }

    // 向後相容：如果沒有 giftRules，使用舊的 giftThreshold 和 giftQuantity
    if (!promotionSettings.giftRules && (promotionSettings as any).giftThreshold && (promotionSettings as any).giftQuantity) {
      const legacyGiftRules = JSON.stringify([
        { threshold: (promotionSettings as any).giftThreshold, quantity: (promotionSettings as any).giftQuantity }
      ]);
      promotionSettings.giftRules = legacyGiftRules;
    }
    
    const response = NextResponse.json(promotionSettings);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching promotion settings:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch promotion settings' },
      { status: 500 }
    ));
  }
}

// PUT - 更新促銷設定
export async function PUT(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { promotionSettings } = await request.json();

    // 獲取或創建促銷設定
    let existingSettings = await prisma.promotionSetting.findFirst();
    
    if (existingSettings) {
      // 更新現有設定
      const updatedSettings = await prisma.promotionSetting.update({
        where: { id: existingSettings.id },
        data: {
          isFreeShippingEnabled: promotionSettings.isFreeShippingEnabled,
          freeShippingThreshold: promotionSettings.freeShippingThreshold,
          isGiftEnabled: promotionSettings.isGiftEnabled,
          giftRules: promotionSettings.giftRules || JSON.stringify([
            { threshold: 15, quantity: 1 },
            { threshold: 20, quantity: 2 },
            { threshold: 30, quantity: 3 }
          ]),
          giftProductName: promotionSettings.giftProductName || '',
          promotionText: promotionSettings.promotionText || ''
        }
      });
      
      const response = NextResponse.json(updatedSettings);
      return addCorsHeaders(response);
    } else {
      // 創建新設定
      const newSettings = await prisma.promotionSetting.create({
        data: {
          isFreeShippingEnabled: promotionSettings.isFreeShippingEnabled,
          freeShippingThreshold: promotionSettings.freeShippingThreshold,
          isGiftEnabled: promotionSettings.isGiftEnabled,
          giftRules: promotionSettings.giftRules || JSON.stringify([
            { threshold: 15, quantity: 1 },
            { threshold: 20, quantity: 2 },
            { threshold: 30, quantity: 3 }
          ]),
          giftProductName: promotionSettings.giftProductName || '',
          promotionText: promotionSettings.promotionText || ''
        }
      });
      
      const response = NextResponse.json(newSettings);
      return addCorsHeaders(response);
    }
  } catch (error) {
    console.error('Error updating promotion settings:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to update promotion settings' },
      { status: 500 }
    ));
  }
}
