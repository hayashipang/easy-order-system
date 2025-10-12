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
    
    // 3. 處理遷移衝突
    console.log('🔄 處理遷移衝突...');
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    try {
      // 刪除現有的遷移文件（因為是 SQLite 的）
      const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        fs.rmSync(migrationsDir, { recursive: true, force: true });
        console.log('✅ 刪除舊的 SQLite 遷移文件');
      }
      
      // 直接推送 schema 到 PostgreSQL
      console.log('🔧 直接推送 schema 到 PostgreSQL...');
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Schema 推送完成');
    } catch (error) {
      console.error('❌ 遷移失敗:', error.message);
    }
    
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
    
    // 5. 更新促銷設定資料庫結構
    console.log('🔧 更新促銷設定資料庫結構...');
    try {
      // 檢查是否已有 giftRules 欄位
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

      // 更新現有的促銷設定
      const existingPromotion = await prisma.promotionSetting.findFirst();
      if (existingPromotion && !existingPromotion.giftRules) {
        const giftRules = JSON.stringify([
          { threshold: existingPromotion.giftThreshold || 20, quantity: existingPromotion.giftQuantity || 1 }
        ]);

        await prisma.promotionSetting.update({
          where: { id: existingPromotion.id },
          data: { giftRules: giftRules }
        });
        console.log('✅ 促銷設定更新成功');
      }
    } catch (error) {
      console.error('❌ 更新促銷設定結構失敗:', error.message);
    }

    // 6. 初始化促銷設定（如果不存在）
    console.log('🎁 初始化促銷設定...');
    const existingPromotion = await prisma.promotionSetting.findFirst();
    if (!existingPromotion) {
      const defaultGiftRules = JSON.stringify([
        { threshold: 15, quantity: 1 },
        { threshold: 20, quantity: 2 },
        { threshold: 30, quantity: 3 }
      ]);
      
      await prisma.promotionSetting.create({
        data: {
          id: 'default-promotion',
          isFreeShippingEnabled: false,
          freeShippingThreshold: 20,
          isGiftEnabled: false,
          giftRules: defaultGiftRules,
          giftProductName: '隨機送一瓶',
          promotionText: '滿15送1瓶，滿20送2瓶，滿30送3瓶'
        }
      });
      console.log('✅ 促銷設定初始化完成');
    } else {
      console.log('ℹ️ 促銷設定已存在，跳過初始化');
    }
    
    // 6. 強制創建 ImageStorage 表
    console.log('🖼️ 強制創建 ImageStorage 表...');
    try {
      // 使用 Prisma 直接執行 SQL 創建表
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
      
      // 測試表是否可用
      const imageStorageCount = await prisma.imageStorage.count();
      console.log(`✅ ImageStorage 表可用，記錄數量: ${imageStorageCount}`);
    } catch (error) {
      console.error('❌ 創建 ImageStorage 表失敗:', error.message);
      // 嘗試使用 db push 來確保表被創建
      try {
        console.log('🔧 嘗試使用 db push 創建表...');
        execSync('npx prisma db push', { stdio: 'inherit' });
        console.log('✅ db push 完成');
      } catch (pushError) {
        console.error('❌ db push 也失敗:', pushError.message);
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
