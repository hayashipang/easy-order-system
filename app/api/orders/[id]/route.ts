import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders, corsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// GET /api/orders/[id] - 獲取單個訂單詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const orderId = params.id;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        user: true  // 包含客戶信息
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: '訂單不存在' },
        { status: 404 }
      );
    }
    
    const response = NextResponse.json(order);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('獲取訂單詳情錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - 刪除訂單
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const orderId = params.id;

    // 檢查訂單是否存在
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: '訂單不存在' },
        { status: 404 }
      );
    }

    // 刪除訂單（會自動刪除相關的 orderItems，因為有 onDelete: Cascade）
    await prisma.order.delete({
      where: { id: orderId }
    });

    return NextResponse.json({ message: '訂單已刪除' });
  } catch (error) {
    console.error('刪除訂單錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}