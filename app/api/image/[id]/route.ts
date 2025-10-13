import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

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
    console.log(`🔍 查找圖片 ID: ${id}`);
    
    // 添加連接超時和重試機制
    const imageRecord = await prisma.imageStorage.findUnique({
      where: { id }
    });
    
    if (!imageRecord) {
      console.log(`❌ 圖片不存在: ${id}`);
      return addCorsHeaders(NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      ));
    }
    
    console.log(`✅ 找到圖片: ${id}, 大小: ${imageRecord.dataUrl.length} 字符`);
    
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
    
    // 檢查是否是資料庫連接錯誤
    if (error instanceof Error) {
      if (error.message.includes('Connection reset by peer') || 
          error.message.includes('could not receive data from client')) {
        console.error('❌ 資料庫連接被重置，可能是連接池耗盡');
        return addCorsHeaders(NextResponse.json(
          { error: 'Database connection error, please try again' },
          { status: 503 }
        ));
      }
    }
    
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    ));
  }
}
