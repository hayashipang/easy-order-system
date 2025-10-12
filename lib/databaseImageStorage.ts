/**
 * 資料庫圖片存儲工具
 * 將圖片以 base64 格式存儲在資料庫中，避免 Railway 文件系統丟失問題
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ImageStorageResult {
  id: string;
  url: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
}

/**
 * 將圖片存儲到資料庫
 */
export async function storeImageInDatabase(
  buffer: Buffer,
  fileName: string,
  prefix: string = 'image'
): Promise<ImageStorageResult> {
  try {
    // 檢查 ImageStorage 表是否存在
    try {
      await prisma.imageStorage.count();
    } catch (error) {
      console.log('ImageStorage 表不存在，嘗試創建...');
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "image_storage" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "fileName" TEXT NOT NULL,
            "dataUrl" TEXT NOT NULL,
            "originalSize" INTEGER NOT NULL,
            "compressedSize" INTEGER NOT NULL,
            "compressionRatio" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL
          );
        `;
        console.log('ImageStorage 表創建成功');
      } catch (createError) {
        console.error('創建 ImageStorage 表失敗:', createError);
        throw new Error('ImageStorage 表創建失敗');
      }
    }
    
    // 生成唯一 ID
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const id = `${prefix}-${timestamp}-${randomString}`;
    
    // 將圖片轉換為 base64
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Data}`;
    
    // 存儲到資料庫
    const imageRecord = await prisma.imageStorage.create({
      data: {
        id: id,
        fileName: fileName,
        dataUrl: dataUrl,
        originalSize: buffer.length,
        compressedSize: buffer.length,
        compressionRatio: '0%'
      }
    });
    
    return {
      id: imageRecord.id,
      url: `/api/image/${imageRecord.id}`,
      fileName: imageRecord.fileName,
      originalSize: imageRecord.originalSize,
      compressedSize: imageRecord.compressedSize,
      compressionRatio: imageRecord.compressionRatio
    };
    
  } catch (error) {
    console.error('存儲圖片到資料庫失敗:', error);
    throw error;
  }
}

/**
 * 從資料庫獲取圖片
 */
export async function getImageFromDatabase(id: string): Promise<string | null> {
  try {
    const imageRecord = await prisma.imageStorage.findUnique({
      where: { id }
    });
    
    return imageRecord?.dataUrl || null;
  } catch (error) {
    console.error('從資料庫獲取圖片失敗:', error);
    return null;
  }
}
