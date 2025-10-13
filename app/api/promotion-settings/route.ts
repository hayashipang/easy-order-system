import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - 獲取促銷設定
export async function GET() {
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
    
    return NextResponse.json(promotionSettings);
  } catch (error) {
    console.error('Error fetching promotion settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotion settings' },
      { status: 500 }
    );
  }
}

// PUT - 更新促銷設定
export async function PUT(request: NextRequest) {
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
      
      return NextResponse.json(updatedSettings);
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
      
      return NextResponse.json(newSettings);
    }
  } catch (error) {
    console.error('Error updating promotion settings:', error);
    return NextResponse.json(
      { error: 'Failed to update promotion settings' },
      { status: 500 }
    );
  }
}
