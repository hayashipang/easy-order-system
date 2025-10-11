import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH /api/orders/[id]/status - 更新訂單狀態
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('更新訂單狀態錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
