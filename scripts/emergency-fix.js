#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function emergencyFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚨 緊急修復 Railway 資料庫...');
    
    // 檢查環境變數
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL 環境變數未設置');
      process.exit(1);
    }
    
    // 測試連接
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    // 強制創建 ImageStorage 表
    console.log('🔧 強制創建 ImageStorage 表...');
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
    } catch (error) {
      console.error('❌ 創建 ImageStorage 表失敗:', error.message);
    }
    
    // 檢查表是否存在
    try {
      const count = await prisma.imageStorage.count();
      console.log(`✅ ImageStorage 表存在，記錄數量: ${count}`);
    } catch (error) {
      console.error('❌ ImageStorage 表仍然不存在:', error.message);
    }
    
    console.log('🎉 緊急修復完成！');
    
  } catch (error) {
    console.error('❌ 修復過程中出現錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyFix();
