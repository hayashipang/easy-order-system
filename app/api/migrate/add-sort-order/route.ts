import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 開始添加 sortOrder 字段...');
    
    // 檢查 sortOrder 字段是否已存在
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' AND column_name = 'sortOrder'
    `;
    
    if (Array.isArray(tableInfo) && tableInfo.length > 0) {
      console.log('✅ sortOrder 字段已存在');
      return NextResponse.json({
        success: true,
        message: 'sortOrder field already exists',
        alreadyExists: true
      });
    }
    
    // 添加 sortOrder 字段
    await prisma.$executeRaw`ALTER TABLE "menu_items" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0`;
    console.log('✅ sortOrder 字段已添加');
    
    // 為現有的菜單項目設置初始排序值
    const menuItems = await prisma.menuItem.findMany({
      orderBy: [
        { createdAt: 'asc' },
        { name: 'asc' }
      ]
    });
    
    for (let i = 0; i < menuItems.length; i++) {
      await prisma.menuItem.update({
        where: { id: menuItems[i].id },
        data: { sortOrder: i }
      });
    }
    
    console.log(`✅ 已為 ${menuItems.length} 個菜單項目設置初始排序值`);
    
    return NextResponse.json({
      success: true,
      message: 'sortOrder field added and initialized successfully',
      menuItemCount: menuItems.length
    });
  } catch (error) {
    console.error('❌ 添加 sortOrder 字段失敗:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 也支持 POST 方法
export async function POST(request: NextRequest) {
  return GET(request);
}
