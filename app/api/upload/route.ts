import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
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

    // 創建uploads目錄
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.name);
    const fileName = `detail-${timestamp}-${randomString}${fileExtension}`;

    // 保存文件
    const filePath = path.join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 返回文件URL
    const fileUrl = `/uploads/${fileName}`;

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
