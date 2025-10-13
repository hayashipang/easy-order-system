import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// PATCH /api/orders/[id]/status - 更新訂單狀態
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const { status, estimatedDeliveryDate } = body;
    
    const updateData: any = { status };
    if (estimatedDeliveryDate) {
      updateData.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    }
    
    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    });
    
    const response = NextResponse.json(order);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('更新訂單狀態錯誤:', error);
    const response = NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
