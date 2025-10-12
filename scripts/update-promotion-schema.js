#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function updatePromotionSchema() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 開始更新促銷設定資料庫結構...');

    // 1. 檢查是否已有 giftRules 欄位
    try {
      const testQuery = await prisma.$queryRaw`
        SELECT "giftRules" FROM "promotion_settings" LIMIT 1;
      `;
      console.log('✅ giftRules 欄位已存在');
      return;
    } catch (error) {
      console.log('❌ giftRules 欄位不存在，需要添加');
    }

    // 2. 添加 giftRules 欄位
    console.log('🔧 添加 giftRules 欄位...');
    await prisma.$executeRaw`
      ALTER TABLE "promotion_settings" 
      ADD COLUMN "giftRules" TEXT;
    `;
    console.log('✅ giftRules 欄位添加成功');

    // 3. 更新現有的促銷設定
    console.log('🔧 更新現有促銷設定...');
    const existingSettings = await prisma.promotionSetting.findFirst();
    
    if (existingSettings) {
      // 將舊的 giftThreshold 和 giftQuantity 轉換為 giftRules
      const giftRules = JSON.stringify([
        { threshold: existingSettings.giftThreshold || 20, quantity: existingSettings.giftQuantity || 1 }
      ]);

      await prisma.promotionSetting.update({
        where: { id: existingSettings.id },
        data: {
          giftRules: giftRules
        }
      });
      console.log('✅ 促銷設定更新成功');
    }

    // 4. 驗證更新結果
    const updatedSettings = await prisma.promotionSetting.findFirst();
    console.log('📋 更新後的促銷設定:', {
      id: updatedSettings.id,
      isGiftEnabled: updatedSettings.isGiftEnabled,
      giftRules: updatedSettings.giftRules,
      giftThreshold: updatedSettings.giftThreshold,
      giftQuantity: updatedSettings.giftQuantity
    });

    console.log('🎉 促銷設定資料庫結構更新完成！');

  } catch (error) {
    console.error('❌ 更新過程中出現錯誤:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePromotionSchema();
