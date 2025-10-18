import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// OPTIONS /api/orders - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}

// GET /api/orders - 獲取所有訂單或按手機號碼查詢
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // 檢查資料庫連接
    await prisma.$connect();
    
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
    
    const response = NextResponse.json(orders, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('獲取訂單錯誤:', error);
    console.error('錯誤詳情:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return addCorsHeaders(NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    ));
  }
}

// POST /api/orders - 創建新訂單
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const {
      userPhone,
      totalAmount,
      subtotalAmount,
      shippingFee,
      deliveryType,
      deliveryInfo,
      paymentMethod,
      paymentInfo,
      notes,
      items,
      promotionInfo
    } = body;
    
    // 創建訂單
    const order = await prisma.order.create({
      data: {
        userPhone,
        totalAmount: parseFloat(totalAmount) || 0,
        subtotalAmount: subtotalAmount ? parseFloat(subtotalAmount) || 0 : null,
        shippingFee: shippingFee ? parseFloat(shippingFee) || 0 : null,
        status: '待匯款', // 新訂單狀態為待匯款
        deliveryType,
        deliveryInfo,
        paymentMethod,
        paymentInfo,
        notes,
        promotionInfo: promotionInfo ? JSON.stringify(promotionInfo) : null
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
    
    const response = NextResponse.json(fullOrder, { status: 201 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('創建訂單錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    ));
  }
}
