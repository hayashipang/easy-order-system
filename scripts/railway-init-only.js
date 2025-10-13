#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

console.log('🚀 開始 Railway 資料庫初始化...');

async function initDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📡 測試資料庫連接...');
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    console.log('🔄 推送資料庫 schema...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Schema 推送完成');
    
    console.log('🔨 生成 Prisma 客戶端...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma 客戶端生成完成');
    
    console.log('⚙️ 初始化系統設定...');
    const systemSetting = await prisma.systemSetting.findFirst();
    if (!systemSetting) {
      await prisma.systemSetting.create({
        data: {
          id: 'default-system',
          storeName: '果然盈',
          storePhone: '0938090857',
          storeAddress: '台北市信義區信義路五段7號',
          isShippingEnabled: true,
          shippingFee: 100,
          freeShippingThreshold: 1000,
          isGiftEnabled: true,
          giftThreshold: 15,
          giftQuantity: 1
        }
      });
      console.log('✅ 系統設定初始化完成');
    } else {
      console.log('ℹ️ 系統設定已存在，跳過初始化');
    }
    
    console.log('🎁 初始化促銷設定...');
    const promotionSetting = await prisma.promotionSetting.findFirst();
    if (!promotionSetting) {
      await prisma.promotionSetting.create({
        data: {
          id: 'default-promotion',
          isGiftEnabled: true,
          giftRules: '[{"threshold":15,"quantity":1},{"threshold":20,"quantity":2},{"threshold":30,"quantity":3}]',
          promotionText: '【果然盈預購活動】出貨期間：10/27～11/30、『滿15瓶送1瓶』、『滿20瓶送2瓶』、『滿30瓶送3瓶』'
        }
      });
      console.log('✅ 促銷設定初始化完成');
    } else {
      console.log('ℹ️ 促銷設定已存在，跳過初始化');
    }
    
    console.log('🎉 資料庫初始化完成！');
    
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
