import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 測試數據庫連接...');
    console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? '已設置' : '未設置');
    console.log('🔍 POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL ? '已設置' : '未設置');
    
    // 測試數據庫連接
    await prisma.$connect();
    console.log('✅ 數據庫連接成功');
    
    // 測試簡單查詢
    const count = await prisma.menuItem.count();
    console.log(`✅ 菜單項目數量: ${count}`);
    
    return NextResponse.json({
      success: true,
      message: '數據庫連接正常',
      menuItemCount: count,
      databaseUrl: process.env.DATABASE_URL ? '已設置' : '未設置',
      postgresUrl: process.env.POSTGRES_PRISMA_URL ? '已設置' : '未設置'
    });
  } catch (error) {
    console.error('❌ 數據庫測試失敗:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? '已設置' : '未設置',
      postgresUrl: process.env.POSTGRES_PRISMA_URL ? '已設置' : '未設置'
    }, { status: 500 });
  }
}