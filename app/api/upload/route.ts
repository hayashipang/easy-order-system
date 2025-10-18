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
    
    // 直接使用資料庫存儲，避免雙重壓縮
    const originalSize = file.size;
    
    try {
      const storageResult = await storeImageInDatabase(buffer, fileName, 'detail');
      return addCorsHeaders(NextResponse.json({
        url: storageResult.url,
        fileName: storageResult.fileName,
        originalSize: originalSize,
        compressedSize: storageResult.compressedSize,
        compressionRatio: storageResult.compressionRatio,
        type: 'image/webp'
      }));
    } catch (dbError) {
      console.error('資料庫存儲失敗，使用文件系統:', dbError);
      
      // Fallback 到文件系統存儲（使用原始 buffer，不壓縮）
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      // 返回文件 URL
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : '';
      
      const fileUrl = baseUrl ? `${baseUrl}/uploads/${fileName}` : `/uploads/${fileName}`;
      
      return addCorsHeaders(NextResponse.json({
        url: fileUrl,
        fileName: fileName,
        originalSize: originalSize,
        compressedSize: originalSize,
        compressionRatio: '0%',
        type: 'image/webp'
      }));
    }

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
