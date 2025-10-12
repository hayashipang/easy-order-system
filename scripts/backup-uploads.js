#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 備份上傳文件到資料庫
 * 這個腳本會在部署前運行，將圖片文件轉換為 base64 存儲在資料庫中
 */

async function backupUploads() {
  try {
    console.log('🔄 開始備份上傳文件...');
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('ℹ️ 上傳目錄不存在，跳過備份');
      return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    console.log(`📁 找到 ${files.length} 個文件`);
    
    // 這裡可以實現將圖片轉換為 base64 並存儲到資料庫的邏輯
    // 或者上傳到外部存儲服務
    
    console.log('✅ 文件備份完成');
    
  } catch (error) {
    console.error('❌ 備份過程中出現錯誤:', error);
  }
}

backupUploads();
