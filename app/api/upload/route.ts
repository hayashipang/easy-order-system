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

    // 檢查文件大小 (5MB)
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
    
    // 使用 Sharp 壓縮圖片 - 保持高解析度
    const compressedBuffer = await sharp(buffer)
      .resize(1200, 900, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 85,
        effort: 6 
      })
      .toBuffer();
    
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
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    ));
  }
}
