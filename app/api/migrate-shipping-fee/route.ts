import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// POST /api/migrate-shipping-fee - 添加 shippingFee 欄位到 promotion_settings
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('🔄 開始添加 shippingFee 欄位...');
    
    // 添加 shippingFee 欄位
    await prisma.$executeRaw`
      ALTER TABLE "promotion_settings" 
      ADD COLUMN IF NOT EXISTS "shippingFee" INTEGER DEFAULT 120;
    `;
    console.log('✅ 已添加 shippingFee 欄位');
    
    // 更新現有記錄的 shippingFee 為預設值 120
    await prisma.$executeRaw`
      UPDATE "promotion_settings" 
      SET "shippingFee" = 120 
      WHERE "shippingFee" IS NULL;
    `;
    console.log('✅ 已更新現有記錄的 shippingFee');
    
    // 檢查欄位是否正確添加
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'promotion_settings' 
      AND column_name = 'shippingFee';
    `;
    
    console.log('📋 shippingFee 欄位信息:', columns);
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'shippingFee 欄位添加成功',
      columns: columns
    }));
    
  } catch (error) {
    console.error('❌ 添加 shippingFee 欄位失敗:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        error: 'Failed to add shippingFee column',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}
