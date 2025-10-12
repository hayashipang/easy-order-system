import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleCors, addCorsHeaders } from '@/lib/cors';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('🔧 手動更新促銷設定...');

    // 1. 檢查是否已有 giftRules 欄位
    try {
      await prisma.$queryRaw`SELECT "giftRules" FROM "promotion_settings" LIMIT 1;`;
      console.log('✅ giftRules 欄位已存在');
    } catch (error) {
      console.log('❌ giftRules 欄位不存在，添加中...');
      await prisma.$executeRaw`
        ALTER TABLE "promotion_settings" 
        ADD COLUMN "giftRules" TEXT;
      `;
      console.log('✅ giftRules 欄位添加成功');
    }

    // 2. 強制更新促銷設定為多層級
    const multiLevelGiftRules = JSON.stringify([
      { threshold: 15, quantity: 1 },
      { threshold: 20, quantity: 2 },
      { threshold: 30, quantity: 3 }
    ]);

    const updatedSettings = await prisma.promotionSetting.update({
      where: { id: 'default-promotion' },
      data: { 
        giftRules: multiLevelGiftRules,
        promotionText: '【果然盈預購活動】出貨期間：10/27～11/30、『滿15瓶送1瓶』、『滿20瓶送2瓶』、『滿30瓶送3瓶』'
      }
    });

    console.log('✅ 促銷設定手動更新成功');
    console.log('📋 更新後的設定:', {
      id: updatedSettings.id,
      isGiftEnabled: updatedSettings.isGiftEnabled,
      giftRules: updatedSettings.giftRules,
      promotionText: updatedSettings.promotionText
    });

    return addCorsHeaders(NextResponse.json({ 
      success: true,
      message: '促銷設定更新成功',
      data: {
        giftRules: updatedSettings.giftRules,
        promotionText: updatedSettings.promotionText
      }
    }));

  } catch (error) {
    console.error('❌ 手動更新促銷設定失敗:', error);
    return addCorsHeaders(NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  } finally {
    await prisma.$disconnect();
  }
}
