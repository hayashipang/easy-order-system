import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders, corsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// PUT /api/orders/[id]/payment - 更新訂單匯款資訊
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
    const { bankName, bankTransferLastFive } = body;

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

    // 更新訂單匯款資訊和狀態
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentInfo: `${bankName} - ${bankTransferLastFive}`,
        status: '已匯款完成' // 更新狀態為已匯款完成
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
    console.error('更新訂單匯款資訊錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to update payment info' },
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
