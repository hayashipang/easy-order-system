import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// POST /api/create-all-tables - 創建所有缺失的表
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('開始創建所有缺失的表...');
    
    // 測試資料庫連接
    await prisma.$connect();
    console.log('資料庫連接成功');
    
    const createdTables = [];
    
    // 創建 SystemSetting 表
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "system_settings" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "key" TEXT NOT NULL UNIQUE,
          "value" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      createdTables.push('system_settings');
      console.log('system_settings 表創建成功');
    } catch (error) {
      console.log('system_settings 表可能已存在:', error);
    }
    
    // 創建 ProductDetail 表
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "product_details" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "category" TEXT NOT NULL UNIQUE,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "rules" TEXT,
          "images" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      createdTables.push('product_details');
      console.log('product_details 表創建成功');
    } catch (error) {
      console.log('product_details 表可能已存在:', error);
    }
    
    // 創建 PromotionSetting 表（如果還沒有）
    try {
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
      createdTables.push('promotion_settings');
      console.log('promotion_settings 表創建成功');
    } catch (error) {
      console.log('promotion_settings 表可能已存在:', error);
    }
    
    // 創建 ImageStorage 表
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "image_storage" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "fileName" TEXT NOT NULL,
          "dataUrl" TEXT NOT NULL,
          "originalSize" INTEGER NOT NULL,
          "compressedSize" INTEGER NOT NULL,
          "compressionRatio" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      createdTables.push('image_storage');
      console.log('image_storage 表創建成功');
    } catch (error) {
      console.log('image_storage 表可能已存在:', error);
    }
    
    // 檢查所有表
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    await prisma.$disconnect();
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: '所有表創建完成',
      createdTables: createdTables,
      allTables: tables
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

// OPTIONS /api/create-all-tables - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}
