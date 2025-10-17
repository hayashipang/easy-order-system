import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// POST /api/migrate-unique-constraint - 更新 MenuItem 的唯一約束
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('🔄 開始更新 MenuItem 唯一約束...');
    
    // 刪除舊的 name 唯一約束
    await prisma.$executeRaw`
      ALTER TABLE "menu_items" DROP CONSTRAINT IF EXISTS "menu_items_name_key";
    `;
    console.log('✅ 已刪除舊的 name 唯一約束');
    
    // 添加新的複合唯一約束
    await prisma.$executeRaw`
      ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_name_productType_key" 
      UNIQUE ("name", "productType");
    `;
    console.log('✅ 已添加新的複合唯一約束 (name, productType)');
    
    // 檢查約束是否正確創建
    const constraints = await prisma.$queryRaw`
      SELECT constraint_name, column_name 
      FROM information_schema.key_column_usage 
      WHERE table_name = 'menu_items' 
      AND constraint_name LIKE '%unique%';
    `;
    
    console.log('📋 當前唯一約束:', constraints);
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'MenuItem 唯一約束更新成功',
      constraints: constraints
    }));
    
  } catch (error) {
    console.error('❌ 更新唯一約束失敗:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        error: 'Failed to update unique constraint',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}
