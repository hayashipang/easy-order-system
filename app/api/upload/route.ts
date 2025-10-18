import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import { storeImageInDatabase } from '@/lib/databaseImageStorage';

export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return addCorsHeaders(NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      ));
    }

    // 檢查文件類型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      ));
    }

    // 檢查文件大小 (5MB - 允許較大的原始文件)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return addCorsHeaders(NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      ));
    }

    // 將圖片轉換為 Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `detail-${timestamp}-${randomString}.webp`;
    
    // 高品質壓縮 - 保持更好的解析度
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // 根據原始解析度決定目標解析度 - 平衡品質和文件大小
    let targetWidth = 2000;
    let targetHeight = 2800;
    
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      
      // 對於高解析度圖片，使用較高的解析度但控制在合理範圍
      if (metadata.width > 2000 || metadata.height > 2000) {
        targetWidth = 2200; // 高解析度但不會太大
        targetHeight = Math.round(2200 / aspectRatio);
      }
    }
    
    // 使用高品質 WebP 壓縮
    let compressedBuffer = await image
      .resize(targetWidth, targetHeight, { 
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3 // 使用更好的重採樣算法
      })
      .webp({ 
        quality: 90, // 高品質
        effort: 6,
        lossless: false,
        nearLossless: false
      })
      .toBuffer();
    
    // 如果文件還是太大，稍微降低品質
    const maxCompressedSize = 3.5 * 1024 * 1024; // 3.5MB
    if (compressedBuffer.length > maxCompressedSize) {
      // 降低品質到 85%
      compressedBuffer = await image
        .resize(targetWidth, targetHeight, { 
          fit: 'inside',
          withoutEnlargement: true,
          kernel: sharp.kernel.lanczos3
        })
        .webp({ 
          quality: 85,
          effort: 6,
          lossless: false,
          nearLossless: false
        })
        .toBuffer();
    }
    
    // 計算壓縮比例
    const originalSize = file.size;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    // 嘗試存儲到資料庫，失敗則使用文件系統
    let fileUrl;
    let finalFileName = fileName;
    
    try {
      const storageResult = await storeImageInDatabase(compressedBuffer, fileName, 'detail');
      fileUrl = storageResult.url;
      finalFileName = storageResult.fileName;
    } catch (dbError) {
      console.error('資料庫存儲失敗，使用文件系統:', dbError);
      
      // Fallback 到文件系統存儲
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, compressedBuffer);
      
      // 返回文件 URL
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : '';
      
      fileUrl = baseUrl ? `${baseUrl}/uploads/${fileName}` : `/uploads/${fileName}`;
    }
    
    const response = NextResponse.json({
      url: fileUrl,
      fileName: finalFileName,
      originalSize: originalSize,
      compressedSize: compressedSize,
      compressionRatio: `${compressionRatio}%`,
      type: 'image/webp'
    });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('File upload error:', error);
    
    // 檢查是否是文件大小錯誤
    if (error instanceof Error && error.message.includes('413')) {
      return addCorsHeaders(NextResponse.json(
        { error: 'File too large. Please use a smaller image (max 4MB).' },
        { status: 413 }
      ));
    }
    
    return addCorsHeaders(NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}
