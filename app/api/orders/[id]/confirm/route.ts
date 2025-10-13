import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders, corsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// PUT /api/orders/[id]/confirm - 管理者確認訂單
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const orderId = params.id;
    const body = await request.json();
    const { estimatedDeliveryDate } = body;

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

    // 檢查訂單狀態是否為已匯款完成
    if (existingOrder.status !== '已匯款完成') {
      return NextResponse.json(
        { error: '訂單狀態不正確，無法確認' },
        { status: 400 }
      );
    }

    // 更新訂單狀態為訂單成立，並設定出貨日期
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: '訂單成立',
        estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        user: true
      }
    });

    const response = NextResponse.json(updatedOrder);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('確認訂單錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to confirm order' },
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
