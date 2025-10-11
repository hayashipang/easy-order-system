import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const { phone } = params;

    // 查詢該用戶的所有訂單
    const orders = await prisma.order.findMany({
      where: {
        userPhone: phone
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('獲取用戶訂單錯誤:', error);
    return NextResponse.json(
      { error: '獲取用戶訂單失敗' },
      { status: 500 }
    );
  }
}
