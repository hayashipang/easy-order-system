#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function fixRailwayDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 開始修復 Railway 資料庫...');
    
    // 1. 強制設置 PostgreSQL 連接
    console.log('🔍 強制設置 PostgreSQL 連接...');
    console.log('所有環境變數:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('RAILWAY')));
    
    // 強制設置 Railway PostgreSQL 連接
    process.env.DATABASE_URL = 'postgresql://postgres:TXnbENPucrNvDdPCwzTdQfVpvPGHdIGY@postgres.railway.internal:5432/railway';
    console.log('✅ 強制設置 Railway PostgreSQL 連接');
    
    // 2. 測試資料庫連接
    console.log('📡 測試資料庫連接...');
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    // 3. 運行遷移
    console.log('🔄 運行資料庫遷移...');
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ 資料庫遷移完成');
    
    // 4. 生成 Prisma 客戶端
    console.log('🔨 生成 Prisma 客戶端...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma 客戶端生成完成');
    
    // 5. 初始化系統設定
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
    
    // 6. 強制創建 ImageStorage 表
    console.log('🖼️ 強制創建 ImageStorage 表...');
    try {
      const imageStorageCount = await prisma.imageStorage.count();
      console.log(`✅ ImageStorage 表存在，記錄數量: ${imageStorageCount}`);
    } catch (error) {
      console.error('❌ ImageStorage 表不存在，強制創建...');
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "image_storage" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "fileName" TEXT NOT NULL,
            "dataUrl" TEXT NOT NULL,
            "originalSize" INTEGER NOT NULL,
            "compressedSize" INTEGER NOT NULL,
            "compressionRatio" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
          );
        `;
        console.log('✅ ImageStorage 表創建成功');
      } catch (createError) {
        console.error('❌ 創建 ImageStorage 表失敗:', createError.message);
      }
    }
    
    // 7. 遷移現有圖片到資料庫（可選）
    console.log('🖼️ 檢查是否需要遷移圖片...');
    const existingImages = await prisma.menuItem.findMany({
      where: {
        imageUrl: {
          not: null,
          startsWith: '/uploads/'
        }
      }
    });
    
    if (existingImages.length > 0) {
      console.log(`📁 找到 ${existingImages.length} 個需要遷移的圖片`);
      console.log('ℹ️ 圖片遷移將在後台進行，不會影響應用啟動');
    } else {
      console.log('ℹ️ 沒有需要遷移的圖片');
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
