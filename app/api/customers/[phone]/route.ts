import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/customers/[phone] - 獲取特定客戶信息
export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const { phone } = params;

    const customer = await prisma.user.findUnique({
      where: { phone },
      include: {
        orders: {
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
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('獲取客戶信息錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[phone] - 更新客戶信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const { phone } = params;
    const body = await request.json();
    const { name, email } = body;

    const customer = await prisma.user.update({
      where: { phone },
      data: {
        name,
        email
      }
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('更新客戶信息錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[phone] - 刪除客戶
export async function DELETE(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const { phone } = params;

    // 先刪除相關的訂單和訂單項目
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          userPhone: phone
        }
      }
    });

    await prisma.order.deleteMany({
      where: {
        userPhone: phone
      }
    });

    // 刪除客戶
    await prisma.user.delete({
      where: { phone }
    });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('刪除客戶錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}