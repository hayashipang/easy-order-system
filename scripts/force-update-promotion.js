#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function forceUpdatePromotion() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 強制更新促銷設定...');

    // 1. 添加 giftRules 欄位（如果不存在）
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

    // 2. 強制更新促銷設定
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

    console.log('✅ 促銷設定強制更新成功');
    console.log('📋 更新後的設定:', {
      id: updatedSettings.id,
      isGiftEnabled: updatedSettings.isGiftEnabled,
      giftRules: updatedSettings.giftRules,
      promotionText: updatedSettings.promotionText
    });

    console.log('🎉 強制更新完成！');

  } catch (error) {
    console.error('❌ 強制更新過程中出現錯誤:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

forceUpdatePromotion();
