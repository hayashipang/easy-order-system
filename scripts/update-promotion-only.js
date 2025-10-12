#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function updatePromotionOnly() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 開始更新促銷設定...');

    // 1. 檢查是否已有 giftRules 欄位
    console.log('🔍 檢查 giftRules 欄位...');
    try {
      await prisma.$queryRaw`SELECT "giftRules" FROM "promotion_settings" LIMIT 1;`;
      console.log('✅ giftRules 欄位已存在');
    } catch (error) {
      console.log('❌ giftRules 欄位不存在，添加中...');
      console.log('錯誤詳情:', error.message);
      await prisma.$executeRaw`
        ALTER TABLE "promotion_settings" 
        ADD COLUMN "giftRules" TEXT;
      `;
      console.log('✅ giftRules 欄位添加成功');
    }

    // 2. 強制更新促銷設定
    console.log('🔄 更新促銷設定...');
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

    console.log('✅ 促銷設定更新成功');
    console.log('📋 更新後的設定:', {
      id: updatedSettings.id,
      isGiftEnabled: updatedSettings.isGiftEnabled,
      giftRules: updatedSettings.giftRules,
      promotionText: updatedSettings.promotionText
    });

    console.log('🎉 促銷設定更新完成！');

  } catch (error) {
    console.error('❌ 更新過程中出現錯誤:', error);
    console.error('錯誤堆疊:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePromotionOnly();
