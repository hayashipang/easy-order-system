import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/cleanup - 清理過期訂單
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    
    // 刪除3天前未確認的訂單
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const unconfirmedOrders = await prisma.order.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: threeDaysAgo
        }
      }
    });

    // 刪除7天前已確認的訂單
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const confirmedOrders = await prisma.order.deleteMany({
      where: {
        status: {
          in: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED']
        },
        createdAt: {
          lt: sevenDaysAgo
        }
      }
    });

    return NextResponse.json({
      message: 'Cleanup completed',
      deletedUnconfirmed: unconfirmedOrders.count,
      deletedConfirmed: confirmedOrders.count,
      totalDeleted: unconfirmedOrders.count + confirmedOrders.count
    });
  } catch (error) {
    console.error('清理訂單錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup orders' },
      { status: 500 }
    );
  }
}

// GET /api/cleanup - 獲取清理統計信息
export async function GET() {
  try {
    const now = new Date();
    
    // 統計即將被清理的訂單
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const unconfirmedToDelete = await prisma.order.count({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: threeDaysAgo
        }
      }
    });

    const confirmedToDelete = await prisma.order.count({
      where: {
        status: {
          in: ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED']
        },
        createdAt: {
          lt: sevenDaysAgo
        }
      }
    });

    return NextResponse.json({
      unconfirmedToDelete,
      confirmedToDelete,
      totalToDelete: unconfirmedToDelete + confirmedToDelete
    });
  } catch (error) {
    console.error('獲取清理統計錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to get cleanup stats' },
      { status: 500 }
    );
  }
}
