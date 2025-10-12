#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

async function startRailway() {
  try {
    console.log('🚀 開始 Railway 啟動流程...');
    
    // 1. 確保 Prisma 客戶端已生成
    console.log('🔨 生成 Prisma 客戶端...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 2. 推送資料庫 schema
    console.log('📊 推送資料庫 schema...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    // 3. 運行 railway-fix
    console.log('🔧 運行 Railway 修復腳本...');
    execSync('npm run railway:fix', { stdio: 'inherit' });
    
    // 4. 啟動服務
    console.log('🎯 啟動 Next.js 服務...');
    execSync('node .next/standalone/server.js', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ 啟動失敗:', error.message);
    process.exit(1);
  }
}

startRailway();
