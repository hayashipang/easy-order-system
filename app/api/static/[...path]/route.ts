import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
    
    // 檢查文件是否存在
    if (!fs.existsSync(fullPath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // 讀取文件
    const fileBuffer = fs.readFileSync(fullPath);
    
    // 根據文件擴展名設置 MIME 類型
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      default:
        contentType = 'application/octet-stream';
    }
    
    // 返回文件
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Static file error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
