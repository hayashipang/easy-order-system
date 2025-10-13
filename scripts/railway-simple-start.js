#!/usr/bin/env node

console.log('🚀 開始 Railway 簡單啟動流程...');

// 設置環境變數
process.env.NODE_ENV = 'production';

// 確保使用 Railway 提供的端口
const port = process.env.PORT || 8080;
process.env.PORT = port;

console.log(`📡 Railway 分配的端口: ${port}`);

// 啟動 Next.js 應用程式
console.log('🎯 啟動 Next.js 服務...');

// 使用 child_process 啟動 Next.js
const { spawn } = require('child_process');

const nextProcess = spawn('node', ['.next/standalone/server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port
  }
});

nextProcess.on('error', (error) => {
  console.error('❌ Next.js 啟動失敗:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  console.log(`📊 Next.js 進程退出，代碼: ${code}`);
  process.exit(code);
});

// 處理信號
process.on('SIGTERM', () => {
  console.log('📡 收到 SIGTERM 信號，優雅關閉...');
  nextProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📡 收到 SIGINT 信號，優雅關閉...');
  nextProcess.kill('SIGINT');
});
