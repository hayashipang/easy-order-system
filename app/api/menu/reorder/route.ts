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

    // 暫時返回成功，因為數據庫中還沒有 sortOrder 字段
    // TODO: 當數據庫遷移完成後，恢復排序功能
    console.log('📝 排序請求已接收，但數據庫中還沒有 sortOrder 字段');
    console.log('📝 菜單項目順序:', menuItems.map(item => ({ id: item.id, name: item.name })));

    return addCorsHeaders(NextResponse.json(
      { 
        message: 'Menu items reordered successfully (sortOrder field not yet available in database)',
        note: 'Sorting is temporarily disabled until database migration is completed'
      },
      { status: 200 }
    ));
  } catch (error) {
    console.error('重新排序菜單項目錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to reorder menu items' },
      { status: 500 }
    ));
  }
}
