import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface CompressionResult {
  url: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  type: string;
}

export async function compressAndSaveImage(
  buffer: Buffer,
  prefix: string = 'image'
): Promise<CompressionResult> {
  // 生成唯一文件名
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileName = `${prefix}-${timestamp}-${randomString}.webp`;
  
  // 確保上傳目錄存在
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filePath = path.join(uploadsDir, fileName);
  
  // 使用 Sharp 壓縮圖片 - 優化設置
  const compressedBuffer = await sharp(buffer)
    .resize(600, 450, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .webp({ 
      quality: 75,  // 降低品質以減少檔案大小
      effort: 4,    // 降低 effort 以提升速度
      smartSubsample: true  // 啟用智能子採樣
    })
    .toBuffer();
  
  // 保存壓縮後的圖片
  fs.writeFileSync(filePath, compressedBuffer);
  
  // 計算壓縮比例
  const originalSize = buffer.length;
  const compressedSize = compressedBuffer.length;
  const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  
  // 返回文件 URL - 根據環境決定是否使用絕對路徑
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : '';
  
  const fileUrl = baseUrl ? `${baseUrl}/uploads/${fileName}` : `/uploads/${fileName}`;

  return {
    url: fileUrl,
    fileName: fileName,
    originalSize: originalSize,
    compressedSize: compressedSize,
    compressionRatio: `${compressionRatio}%`,
    type: 'image/webp'
  };
}

