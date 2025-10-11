import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { handleCors, addCorsHeaders } from '@/lib/cors';

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

    // 將圖片轉換為 Base64 編碼存儲
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    
    // 生成唯一文件名（用於識別）
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.name);
    const fileName = `detail-${timestamp}-${randomString}${fileExtension}`;
    
    // 返回 Base64 data URL
    const fileUrl = `data:${mimeType};base64,${base64String}`;

    const response = NextResponse.json({
      url: fileUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
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
