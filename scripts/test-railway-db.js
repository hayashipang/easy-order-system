#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testRailwayDb() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 測試 Railway 資料庫狀態...');
    
    // 檢查環境變數
    console.log('📡 DATABASE_URL:', process.env.DATABASE_URL ? '已設置' : '未設置');
    
    // 測試連接
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    // 檢查 ImageStorage 表
    try {
      const imageCount = await prisma.imageStorage.count();
      console.log(`✅ ImageStorage 表存在，記錄數量: ${imageCount}`);
    } catch (error) {
      console.error('❌ ImageStorage 表不存在:', error.message);
    }
    
    // 檢查其他表
    const menuCount = await prisma.menuItem.count();
    const orderCount = await prisma.order.count();
    const userCount = await prisma.user.count();
    
    console.log(`📋 菜單項目: ${menuCount} 個`);
    console.log(`📦 訂單: ${orderCount} 個`);
    console.log(`👥 用戶: ${userCount} 個`);
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRailwayDb();
