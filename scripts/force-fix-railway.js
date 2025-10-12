#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function forceFixRailway() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 強制修復 Railway 資料庫...');
    
    // 1. 檢查環境變數
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL 環境變數未設置');
      process.exit(1);
    }
    
    // 2. 測試連接
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    // 3. 強制運行遷移
    console.log('🔄 強制運行資料庫遷移...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ 遷移完成');
    } catch (error) {
      console.error('❌ 遷移失敗:', error.message);
    }
    
    // 4. 重新生成 Prisma 客戶端
    console.log('🔨 重新生成 Prisma 客戶端...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma 客戶端生成完成');
    } catch (error) {
      console.error('❌ Prisma 客戶端生成失敗:', error.message);
    }
    
    // 5. 檢查 ImageStorage 表
    console.log('🖼️ 檢查 ImageStorage 表...');
    try {
      const imageCount = await prisma.imageStorage.count();
      console.log(`✅ ImageStorage 表存在，記錄數量: ${imageCount}`);
    } catch (error) {
      console.error('❌ ImageStorage 表不存在:', error.message);
      
      // 嘗試手動創建表
      console.log('🔧 嘗試手動創建 ImageStorage 表...');
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
    
    console.log('🎉 強制修復完成！');
    
  } catch (error) {
    console.error('❌ 修復過程中出現錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceFixRailway();
