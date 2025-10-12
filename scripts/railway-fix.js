#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function fixRailwayDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 開始修復 Railway 資料庫...');
    
    // 1. 測試資料庫連接
    console.log('📡 測試資料庫連接...');
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    // 2. 運行遷移
    console.log('🔄 運行資料庫遷移...');
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ 資料庫遷移完成');
    
    // 3. 生成 Prisma 客戶端
    console.log('🔨 生成 Prisma 客戶端...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma 客戶端生成完成');
    
    // 4. 初始化系統設定
    console.log('⚙️ 初始化系統設定...');
    const existingSettings = await prisma.systemSetting.findMany();
    if (existingSettings.length === 0) {
      const defaultSettings = [
        { key: 'store_name', value: 'Easy Order 系統' },
        { key: 'store_phone', value: '02-1234-5678' },
        { key: 'store_address', value: '台北市信義區信義路五段7號' },
        { key: 'shipping_fee', value: '120' },
        { key: 'bank_account', value: '123-456-789-012' },
        { key: 'bank_name', value: '台灣銀行' },
        { key: 'payment_instructions', value: '請於訂單確認後3日內完成匯款' }
      ];
      
      for (const setting of defaultSettings) {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: setting
        });
      }
      console.log('✅ 系統設定初始化完成');
    } else {
      console.log('ℹ️ 系統設定已存在，跳過初始化');
    }
    
    // 5. 初始化促銷設定
    console.log('🎁 初始化促銷設定...');
    const existingPromotion = await prisma.promotionSetting.findFirst();
    if (!existingPromotion) {
      await prisma.promotionSetting.create({
        data: {
          id: 'default-promotion',
          isFreeShippingEnabled: false,
          freeShippingThreshold: 20,
          isGiftEnabled: false,
          giftThreshold: 20,
          giftQuantity: 1,
          giftProductName: '隨機送一瓶',
          promotionText: '買20送1瓶＋免運費'
        }
      });
      console.log('✅ 促銷設定初始化完成');
    } else {
      console.log('ℹ️ 促銷設定已存在，跳過初始化');
    }
    
    console.log('🎉 Railway 資料庫修復完成！');
    
  } catch (error) {
    console.error('❌ 修復過程中出現錯誤:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixRailwayDatabase();
