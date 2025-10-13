#!/usr/bin/env node

const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function initDatabase() {
  console.log('🚀 開始初始化資料庫...');
  
  const prisma = new PrismaClient();
  
  try {
    // 測試資料庫連接
    console.log('📡 測試資料庫連接...');
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    // 推送 schema
    console.log('🔄 推送資料庫 schema...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Schema 推送完成');
    
    // 初始化系統設定
    console.log('⚙️ 初始化系統設定...');
    const existingSettings = await prisma.systemSetting.findFirst();
    if (!existingSettings) {
      await prisma.systemSetting.create({
        data: {
          key: 'store_name',
          value: '果然盈',
          description: '商店名稱'
        }
      });
      await prisma.systemSetting.create({
        data: {
          key: 'store_phone',
          value: '0912345678',
          description: '商店電話'
        }
      });
      await prisma.systemSetting.create({
        data: {
          key: 'store_address',
          value: '台北市信義區信義路五段7號',
          description: '商店地址'
        }
      });
      console.log('✅ 系統設定初始化完成');
    } else {
      console.log('ℹ️ 系統設定已存在，跳過初始化');
    }
    
    // 初始化促銷設定
    console.log('🎁 初始化促銷設定...');
    const existingPromotion = await prisma.promotionSetting.findFirst();
    if (!existingPromotion) {
      await prisma.promotionSetting.create({
        data: {
          isGiftEnabled: true,
          giftRules: JSON.stringify([
            { threshold: 15, quantity: 1 },
            { threshold: 20, quantity: 2 },
            { threshold: 30, quantity: 3 }
          ]),
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
    // 不要退出，讓應用程式繼續啟動
  } finally {
    await prisma.$disconnect();
  }
}

async function startApp() {
  console.log('🚀 啟動 Next.js 應用程式...');
  
  // 設置端口
  const port = process.env.PORT || 8080;
  console.log(`📡 監聽端口: ${port}`);
  
  // 啟動 Next.js
  const nextProcess = spawn('node', ['.next/standalone/server.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port
    }
  });
  
  nextProcess.on('error', (error) => {
    console.error('❌ 應用程式啟動失敗:', error);
    process.exit(1);
  });
  
  nextProcess.on('exit', (code) => {
    console.log(`應用程式退出，代碼: ${code}`);
    process.exit(code);
  });
}

async function main() {
  try {
    // 先初始化資料庫
    await initDatabase();
    
    // 然後啟動應用程式
    await startApp();
  } catch (error) {
    console.error('❌ 啟動失敗:', error);
    process.exit(1);
  }
}

main();
