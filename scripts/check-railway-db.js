#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function checkRailwayDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 檢查 Railway 資料庫狀態...');
    
    // 1. 檢查環境變數
    console.log('\n📋 環境變數檢查:');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '已設置' : '未設置'}`);
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      console.log(`資料庫類型: ${url.protocol.replace(':', '')}`);
      console.log(`主機: ${url.hostname}`);
      console.log(`資料庫: ${url.pathname.replace('/', '')}`);
    }
    
    // 2. 測試資料庫連接
    console.log('\n📡 測試資料庫連接...');
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    // 3. 檢查表是否存在
    console.log('\n📊 檢查資料庫表...');
    
    try {
      const menuItems = await prisma.menuItem.findMany();
      console.log(`✅ menu_items 表存在，記錄數: ${menuItems.length}`);
    } catch (error) {
      console.log(`❌ menu_items 表不存在或錯誤: ${error.message}`);
    }
    
    try {
      const orders = await prisma.order.findMany();
      console.log(`✅ orders 表存在，記錄數: ${orders.length}`);
    } catch (error) {
      console.log(`❌ orders 表不存在或錯誤: ${error.message}`);
    }
    
    try {
      const users = await prisma.user.findMany();
      console.log(`✅ users 表存在，記錄數: ${users.length}`);
    } catch (error) {
      console.log(`❌ users 表不存在或錯誤: ${error.message}`);
    }
    
    try {
      const systemSettings = await prisma.systemSetting.findMany();
      console.log(`✅ system_settings 表存在，記錄數: ${systemSettings.length}`);
    } catch (error) {
      console.log(`❌ system_settings 表不存在或錯誤: ${error.message}`);
    }
    
    // 4. 檢查所有資料
    console.log('\n📋 資料庫內容檢查:');
    const allMenuItems = await prisma.menuItem.findMany();
    const allOrders = await prisma.order.findMany();
    const allUsers = await prisma.user.findMany();
    const allSystemSettings = await prisma.systemSetting.findMany();
    const allPromotionSettings = await prisma.promotionSetting.findMany();
    const allProductDetails = await prisma.productDetail.findMany();
    const allImageStorage = await prisma.imageStorage.findMany();
    
    console.log(`菜單項目: ${allMenuItems.length} 個`);
    console.log(`訂單: ${allOrders.length} 個`);
    console.log(`用戶: ${allUsers.length} 個`);
    console.log(`系統設定: ${allSystemSettings.length} 個`);
    console.log(`促銷設定: ${allPromotionSettings.length} 個`);
    console.log(`產品詳情: ${allProductDetails.length} 個`);
    console.log(`圖片存儲: ${allImageStorage.length} 個`);
    
    // 5. 總結
    const totalRecords = allMenuItems.length + allOrders.length + allUsers.length + 
                        allSystemSettings.length + allPromotionSettings.length + 
                        allProductDetails.length + allImageStorage.length;
    
    console.log(`\n📊 總記錄數: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('\n⚠️ 資料庫是空的！需要初始化資料。');
    } else {
      console.log('\n✅ 資料庫有資料，應該能正常載入。');
    }
    
  } catch (error) {
    console.error('❌ 檢查過程中出現錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRailwayDatabase();
