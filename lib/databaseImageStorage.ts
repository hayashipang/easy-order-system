/**
 * 資料庫圖片存儲工具
 * 將圖片以 base64 格式存儲在資料庫中，避免 Railway 文件系統丟失問題
 */

import prisma from './prisma';

export interface ImageStorageResult {
  id: string;
  url: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
}

/**
 * 將圖片存儲到資料庫 - 優化版本
 */
export async function storeImageInDatabase(
  buffer: Buffer,
  fileName: string,
  prefix: string = 'image'
): Promise<ImageStorageResult> {
  try {
    console.log(`🖼️ 開始存儲圖片: ${fileName}, 大小: ${buffer.length} bytes`);
    
    // 檢查 buffer 是否有效
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid image buffer');
    }
    
    // 檢查 ImageStorage 表是否存在
    try {
      await prisma.imageStorage.count();
      console.log('✅ ImageStorage 表存在');
    } catch (error) {
      console.log('❌ ImageStorage 表不存在，嘗試創建...');
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
        console.log('✅ ImageStorage 表創建成功');
      } catch (createError) {
        console.error('❌ 創建 ImageStorage 表失敗:', createError);
        throw new Error('ImageStorage 表創建失敗');
      }
    }
    
    // 生成唯一 ID
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const id = `${prefix}-${timestamp}-${randomString}`;
    console.log(`🆔 生成圖片 ID: ${id}`);
    
    // 先壓縮圖片再轉換為 base64
    console.log('🔧 開始壓縮圖片...');
    let compressedBuffer: Buffer;
    
    try {
      const sharp = (await import('sharp')).default;
      
      compressedBuffer = await sharp(buffer)
        .resize(600, 450, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ 
          quality: 75,
          effort: 4,
          smartSubsample: true
        })
        .toBuffer();
      
      console.log('✅ 圖片壓縮完成');
    } catch (compressionError) {
      console.error('❌ 圖片壓縮失敗，使用原始圖片:', compressionError);
      compressedBuffer = buffer; // 使用原始 buffer 作為 fallback
    }
    
    const base64Data = compressedBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64Data}`;
    console.log(`📝 壓縮並轉換為 base64，原始大小: ${buffer.length}, 壓縮後: ${compressedBuffer.length}, base64 大小: ${dataUrl.length} 字符`);
    
    // 存儲到資料庫
    console.log(`💾 開始存儲到資料庫...`);
    const compressionRatio = ((buffer.length - compressedBuffer.length) / buffer.length * 100).toFixed(1);
    
    const imageRecord = await prisma.imageStorage.create({
      data: {
        id: id,
        fileName: fileName,
        dataUrl: dataUrl,
        originalSize: buffer.length,
        compressedSize: compressedBuffer.length,
        compressionRatio: `${compressionRatio}%`
      }
    });
    console.log(`✅ 圖片存儲成功: ${imageRecord.id}`);
    
    // 生成完整的圖片 URL
    let baseUrl = '';
    
    // 在開發環境中使用本地 URL
    if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:4000';
    }
    // 在生產環境中使用相對路徑（當前域名）
    
    const finalUrl = baseUrl ? `${baseUrl}/api/image/${imageRecord.id}` : `/api/image/${imageRecord.id}`;
    console.log(`🔗 生成圖片 URL: ${finalUrl}`);
    
    return {
      id: imageRecord.id,
      url: finalUrl,
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
