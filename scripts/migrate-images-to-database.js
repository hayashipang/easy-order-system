#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const prisma = new PrismaClient();

async function migrateImagesToDatabase() {
  try {
    console.log('🔄 開始將圖片遷移到資料庫...');
    
    // 1. 獲取所有有圖片的菜單項目
    const menuItems = await prisma.menuItem.findMany({
      where: {
        imageUrl: {
          not: null
        }
      }
    });
    
    console.log(`📁 找到 ${menuItems.length} 個有圖片的菜單項目`);
    
    for (const item of menuItems) {
      if (item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
        try {
          console.log(`🔄 處理: ${item.name} - ${item.imageUrl}`);
          
          // 讀取圖片文件
          const imagePath = path.join(process.cwd(), 'public', item.imageUrl);
          
          if (fs.existsSync(imagePath)) {
            // 讀取圖片並壓縮
            const buffer = fs.readFileSync(imagePath);
            const compressedBuffer = await sharp(buffer)
              .resize(800, 600, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .webp({ 
                quality: 80,
                effort: 6 
              })
              .toBuffer();
            
            // 轉換為 base64
            const base64Data = compressedBuffer.toString('base64');
            const dataUrl = `data:image/webp;base64,${base64Data}`;
            
            // 生成唯一 ID
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const id = `menu-${timestamp}-${randomString}`;
            
            // 存儲到資料庫
            const imageRecord = await prisma.imageStorage.create({
              data: {
                id: id,
                fileName: path.basename(item.imageUrl),
                dataUrl: dataUrl,
                originalSize: buffer.length,
                compressedSize: compressedBuffer.length,
                compressionRatio: `${((buffer.length - compressedBuffer.length) / buffer.length * 100).toFixed(1)}%`
              }
            });
            
            // 更新菜單項目的圖片 URL
            await prisma.menuItem.update({
              where: { id: item.id },
              data: { imageUrl: `/api/image/${imageRecord.id}` }
            });
            
            console.log(`✅ 完成: ${item.name} -> /api/image/${imageRecord.id}`);
          } else {
            console.log(`⚠️ 圖片文件不存在: ${imagePath}`);
          }
        } catch (error) {
          console.error(`❌ 處理失敗: ${item.name}`, error.message);
        }
      }
    }
    
    console.log('🎉 圖片遷移完成！');
    
  } catch (error) {
    console.error('❌ 遷移過程中出現錯誤:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateImagesToDatabase();
