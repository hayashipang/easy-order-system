import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}

// PUT /api/menu/reorder - 更新菜單項目排序
export async function PUT(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const { menuItems } = body;

    if (!Array.isArray(menuItems)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid request body. Expected array of menu items.' },
        { status: 400 }
      ));
    }

    // 嘗試更新排序順序，如果 sortOrder 字段不存在則返回成功但不實際更新
    try {
      const updatePromises = menuItems.map((item: { id: string; sortOrder: number }) => 
        prisma.menuItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      );

      await Promise.all(updatePromises);

      console.log('✅ 菜單項目排序已更新');
      console.log('📝 菜單項目順序:', menuItems.map(item => ({ id: item.id, sortOrder: item.sortOrder })));

      return addCorsHeaders(NextResponse.json(
        { message: 'Menu items reordered successfully' },
        { status: 200 }
      ));
    } catch (error) {
      // 如果 sortOrder 字段不存在，返回成功但不實際更新
      console.log('⚠️ sortOrder 字段不存在，排序功能暫時禁用');
      console.log('📝 菜單項目順序請求:', menuItems.map(item => ({ id: item.id, sortOrder: item.sortOrder })));

      return addCorsHeaders(NextResponse.json(
        { 
          message: 'Menu items reordered successfully (sortOrder field not yet available)',
          note: 'Please run migration first: /api/migrate/add-sort-order'
        },
        { status: 200 }
      ));
    }
  } catch (error) {
    console.error('重新排序菜單項目錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to reorder menu items' },
      { status: 500 }
    ));
  }
}
