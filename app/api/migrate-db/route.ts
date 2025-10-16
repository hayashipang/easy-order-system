import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// POST /api/migrate-db - 運行資料庫遷移
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('開始運行資料庫遷移...');
    
    // 測試資料庫連接
    await prisma.$connect();
    console.log('資料庫連接成功');
    
    // 檢查資料庫表是否存在
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('現有資料表:', tables);
    
    // 如果沒有表，創建基本的表結構
    if (!Array.isArray(tables) || tables.length === 0) {
      console.log('沒有找到資料表，開始創建表結構...');
      
      // 創建 User 表
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "phone" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT,
          "password" TEXT,
          "name" TEXT,
          "birthday" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      
      // 創建 MenuItem 表
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "menu_items" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "description" TEXT,
          "price" DOUBLE PRECISION NOT NULL,
          "image" TEXT,
          "imageUrl" TEXT,
          "category" TEXT NOT NULL,
          "productType" TEXT,
          "isAvailable" BOOLEAN NOT NULL DEFAULT true,
          "stock" INTEGER NOT NULL DEFAULT 999,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      
      // 創建 Order 表
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "orders" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userPhone" TEXT NOT NULL,
          "totalAmount" DOUBLE PRECISION NOT NULL,
          "subtotalAmount" DOUBLE PRECISION,
          "shippingFee" DOUBLE PRECISION,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "deliveryType" TEXT NOT NULL,
          "deliveryInfo" TEXT NOT NULL,
          "paymentMethod" TEXT NOT NULL,
          "paymentInfo" TEXT NOT NULL,
          "notes" TEXT,
          "estimatedDeliveryDate" TIMESTAMP(3),
          "promotionInfo" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          FOREIGN KEY ("userPhone") REFERENCES "users"("phone") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `;
      
      // 創建 OrderItem 表
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "order_items" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "orderId" TEXT NOT NULL,
          "menuItemId" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL,
          "price" DOUBLE PRECISION NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `;
      
      console.log('資料表創建完成');
    }
    
    await prisma.$disconnect();
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: '資料庫遷移完成',
      tables: tables,
      details: '資料表結構已創建或已存在'
    }));
    
  } catch (error) {
    console.error('資料庫遷移失敗:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        success: false, 
        error: '資料庫遷移失敗',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}

// OPTIONS /api/migrate-db - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}
