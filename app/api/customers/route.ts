import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/customers - 獲取所有客戶
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('獲取客戶錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - 創建新客戶
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, email } = body;
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    // 檢查是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });
    
    if (existingUser) {
      return NextResponse.json(existingUser);
    }
    
    const user = await prisma.user.create({
      data: {
        phone,
        name: name || `User-${phone}`,
        email
      }
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('創建客戶錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
