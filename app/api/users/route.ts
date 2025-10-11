import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/users - 獲取所有用戶
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('獲取用戶錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - 創建新用戶
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
    console.error('創建用戶錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
