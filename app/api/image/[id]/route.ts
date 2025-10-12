import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleCors, addCorsHeaders } from '@/lib/cors';

const prisma = new PrismaClient();

// GET /api/image/[id] - 獲取存儲在資料庫中的圖片
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { id } = params;
    
    const imageRecord = await prisma.imageStorage.findUnique({
      where: { id }
    });
    
    if (!imageRecord) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      ));
    }
    
    // 解析 dataUrl
    const [header, base64Data] = imageRecord.dataUrl.split(',');
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/webp';
    
    // 將 base64 轉換為 Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 返回圖片
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('獲取圖片錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    ));
  }
}
