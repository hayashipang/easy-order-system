import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// GET /api/test-db - 測試資料庫連接
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('測試資料庫連接...');
    
    // 測試資料庫連接
    await prisma.$connect();
    console.log('資料庫連接成功');
    
    // 檢查資料庫表
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('現有資料表:', tables);
    
    // 檢查用戶數量
    const userCount = await prisma.user.count();
    console.log('用戶數量:', userCount);
    
    // 檢查菜單項目數量
    const menuCount = await prisma.menuItem.count();
    console.log('菜單項目數量:', menuCount);
    
    // 檢查訂單數量
    const orderCount = await prisma.order.count();
    console.log('訂單數量:', orderCount);
    
    await prisma.$disconnect();
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: '資料庫連接成功',
      tables: tables,
      counts: {
        users: userCount,
        menuItems: menuCount,
        orders: orderCount
      }
    }));
    
  } catch (error) {
    console.error('資料庫連接失敗:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        success: false, 
        error: '資料庫連接失敗',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}

// OPTIONS /api/test-db - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}
