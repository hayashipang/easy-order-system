import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 開始獲取菜單項目...');
    
    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true }
    });
    
    console.log(`✅ 成功獲取 ${menuItems.length} 個菜單項目`);
    
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('❌ 獲取菜單錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}
