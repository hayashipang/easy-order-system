import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleCors, addCorsHeaders } from '@/lib/cors';

const prisma = new PrismaClient();

// GET /api/orders/[id] - 獲取單個訂單
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
        }
      }
    });

    if (!order) {
      const response = NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }

    const response = NextResponse.json(order);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('獲取訂單錯誤:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// PUT /api/orders/[id] - 更新訂單
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
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: body,
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    });

    const response = NextResponse.json(updatedOrder);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('更新訂單錯誤:', error);
    const response = NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
    return addCorsHeaders(response);
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
    
    await prisma.order.delete({
      where: { id: orderId }
    });

    const response = NextResponse.json({ message: 'Order deleted successfully' });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('刪除訂單錯誤:', error);
    const response = NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}