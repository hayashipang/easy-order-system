#!/usr/bin/env node

const { spawn } = require('child_process');

async function startRailway() {
  try {
    console.log('🚀 開始 Railway 啟動流程...');
    
    // 1. 確保 Prisma 客戶端已生成
    console.log('🔨 生成 Prisma 客戶端...');
    const generateProcess = spawn('npx', ['prisma', 'generate'], { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      generateProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Prisma generate failed with code ${code}`));
      });
    });
    
    // 2. 推送資料庫 schema
    console.log('📊 推送資料庫 schema...');
    const pushProcess = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      pushProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Prisma db push failed with code ${code}`));
      });
    });
    
    // 3. 運行 railway-fix
    console.log('🔧 運行 Railway 修復腳本...');
    const fixProcess = spawn('npm', ['run', 'railway:fix'], { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      fixProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Railway fix failed with code ${code}`));
      });
    });
    
    // 4. 啟動服務
    console.log('🎯 啟動 Next.js 服務...');
    const serverProcess = spawn('node', ['.next/standalone/server.js'], { stdio: 'inherit' });
    
    // 處理服務進程
    serverProcess.on('error', (error) => {
      console.error('❌ 服務啟動失敗:', error.message);
      process.exit(1);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`服務退出，代碼: ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ 啟動失敗:', error.message);
    process.exit(1);
  }
}

startRailway();
