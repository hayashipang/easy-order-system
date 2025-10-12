#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDataRetention() {
  try {
    console.log('🔍 測試部署後資料保留情況...');
    
    // 1. 檢查菜單項目
    console.log('\n📋 檢查菜單項目:');
    const menuItems = await prisma.menuItem.findMany();
    console.log(`✅ 菜單項目數量: ${menuItems.length}`);
    
    if (menuItems.length > 0) {
      console.log('📝 菜單項目列表:');
      menuItems.forEach(item => {
        console.log(`  - ${item.name} (${item.category}) - NT$ ${item.price}`);
        if (item.imageUrl) {
          console.log(`    圖片: ${item.imageUrl}`);
        }
      });
    }
    
    // 2. 檢查產品詳情
    console.log('\n📄 檢查產品詳情:');
    const productDetails = await prisma.productDetail.findMany();
    console.log(`✅ 產品詳情數量: ${productDetails.length}`);
    
    if (productDetails.length > 0) {
      console.log('📝 產品詳情列表:');
      productDetails.forEach(detail => {
        console.log(`  - ${detail.category}: ${detail.title}`);
      });
    }
    
    // 3. 檢查訂單
    console.log('\n📦 檢查訂單:');
    const orders = await prisma.order.findMany();
    console.log(`✅ 訂單數量: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('📝 最近訂單:');
      orders.slice(0, 3).forEach(order => {
        console.log(`  - 訂單 ${order.id}: ${order.userPhone} - NT$ ${order.totalAmount}`);
      });
    }
    
    // 4. 檢查系統設定
    console.log('\n⚙️ 檢查系統設定:');
    const systemSettings = await prisma.systemSetting.findMany();
    console.log(`✅ 系統設定數量: ${systemSettings.length}`);
    
    // 5. 檢查促銷設定
    console.log('\n🎁 檢查促銷設定:');
    const promotionSettings = await prisma.promotionSetting.findMany();
    console.log(`✅ 促銷設定數量: ${promotionSettings.length}`);
    
    // 6. 檢查圖片存儲
    console.log('\n🖼️ 檢查圖片存儲:');
    const imageStorage = await prisma.imageStorage.findMany();
    console.log(`✅ 圖片存儲數量: ${imageStorage.length}`);
    
    if (imageStorage.length > 0) {
      console.log('📝 圖片存儲列表:');
      imageStorage.forEach(image => {
        console.log(`  - ${image.fileName} (${image.compressionRatio} 壓縮率)`);
      });
    }
    
    // 7. 檢查用戶
    console.log('\n👥 檢查用戶:');
    const users = await prisma.user.findMany();
    console.log(`✅ 用戶數量: ${users.length}`);
    
    // 總結
    console.log('\n📊 資料保留測試總結:');
    console.log(`✅ 菜單項目: ${menuItems.length} 個`);
    console.log(`✅ 產品詳情: ${productDetails.length} 個`);
    console.log(`✅ 訂單: ${orders.length} 個`);
    console.log(`✅ 系統設定: ${systemSettings.length} 個`);
    console.log(`✅ 促銷設定: ${promotionSettings.length} 個`);
    console.log(`✅ 圖片存儲: ${imageStorage.length} 個`);
    console.log(`✅ 用戶: ${users.length} 個`);
    
    if (menuItems.length > 0 || productDetails.length > 0 || orders.length > 0) {
      console.log('\n🎉 資料保留測試通過！部署後資料已保留。');
    } else {
      console.log('\n⚠️ 資料保留測試失敗！部署後資料丟失。');
    }
    
  } catch (error) {
    console.error('❌ 測試過程中出現錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDataRetention();
