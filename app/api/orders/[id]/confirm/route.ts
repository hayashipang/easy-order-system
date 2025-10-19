import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders, corsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';
import { syncOrderAndCustomerToRailway } from '@/lib/railwaySync';

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

    // V2.1 - 同步到 Railway (在訂單確認後觸發)
    try {
      console.log('V2.1 - Starting Railway sync for order:', orderId);
      
      const syncResult = await syncOrderAndCustomerToRailway(
        {
          id: updatedOrder.id,
          userPhone: updatedOrder.userPhone,
          totalAmount: updatedOrder.totalAmount,
          subtotalAmount: updatedOrder.subtotalAmount ?? undefined,
          shippingFee: updatedOrder.shippingFee ?? undefined,
          deliveryType: updatedOrder.deliveryType,
          paymentMethod: updatedOrder.paymentMethod,
          notes: updatedOrder.notes ?? undefined,
          estimatedDeliveryDate: updatedOrder.estimatedDeliveryDate?.toISOString(),
          createdAt: updatedOrder.createdAt.toISOString(),
          orderItems: updatedOrder.orderItems.map(item => ({
            menuItem: {
              name: item.menuItem.name,
              price: item.price
            },
            quantity: item.quantity,
            price: item.price
          }))
        },
        {
          phone: updatedOrder.user.phone,
          name: updatedOrder.user.name ?? undefined,
          email: updatedOrder.user.email ?? undefined,
          birthday: updatedOrder.user.birthday ?? undefined
        }
      );
      
      if (syncResult.success) {
        console.log('V2.1 - Railway sync successful for order:', orderId);
      } else {
        console.error('V2.1 - Railway sync failed for order:', orderId, syncResult.error);
      }
    } catch (syncError) {
      console.error('V2.1 - Railway sync error for order:', orderId, syncError);
      // 同步失敗不影響訂單確認流程
    }

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
