import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// POST /api/create-promotion-table - 手動創建 promotion_settings 表
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('開始創建 promotion_settings 表...');
    
    // 測試資料庫連接
    await prisma.$connect();
    console.log('資料庫連接成功');
    
    // 創建 PromotionSetting 表
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "promotion_settings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "isFreeShippingEnabled" BOOLEAN NOT NULL DEFAULT false,
        "freeShippingThreshold" INTEGER NOT NULL DEFAULT 20,
        "isGiftEnabled" BOOLEAN NOT NULL DEFAULT false,
        "giftRules" TEXT,
        "giftProductName" TEXT,
        "promotionText" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `;
    
    console.log('promotion_settings 表創建成功');
    
    // 檢查表是否創建成功
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'promotion_settings'
    `;
    
    await prisma.$disconnect();
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'promotion_settings 表創建成功',
      tables: tables
    }));
    
  } catch (error) {
    console.error('創建表失敗:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        success: false, 
        error: '創建表失敗',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}

// OPTIONS /api/create-promotion-table - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}
