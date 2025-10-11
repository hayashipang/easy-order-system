import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleCors, addCorsHeaders } from '@/lib/cors';

const prisma = new PrismaClient();

// GET /api/orders - 獲取所有訂單或按手機號碼查詢
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    const whereClause = phone ? { userPhone: phone } : {};
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        user: true  // 包含客戶信息
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const response = NextResponse.json(orders);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('獲取訂單錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - 創建新訂單
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userPhone,
      totalAmount,
      deliveryType,
      deliveryInfo,
      paymentMethod,
      paymentInfo,
      notes,
      items
    } = body;
    
    // 創建訂單
    const order = await prisma.order.create({
      data: {
        userPhone,
        totalAmount: parseFloat(totalAmount),
        status: 'PENDING',
        deliveryType,
        deliveryInfo,
        paymentMethod,
        paymentInfo,
        notes
      }
    });
    
    // 創建訂單項目
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price
        }
      });
    }
    
    // 返回完整訂單信息
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    });
    
    return NextResponse.json(fullOrder, { status: 201 });
  } catch (error) {
    console.error('創建訂單錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
