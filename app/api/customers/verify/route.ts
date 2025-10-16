import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// POST /api/customers/verify - 驗證用戶登入（手機號碼 + 生日）
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const { phone, birthday } = body;
    
    if (!phone || !birthday) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Phone number and birthday are required' },
        { status: 400 }
      ));
    }
    
    // 驗證生日格式 (6位數字)
    const birthdayRegex = /^\d{6}$/;
    if (!birthdayRegex.test(birthday)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Birthday must be 6 digits (e.g., 660111)' },
        { status: 400 }
      ));
    }
    
    // 查找用戶
    const user = await prisma.user.findUnique({
      where: { phone }
    });
    
    if (!user) {
      return addCorsHeaders(NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      ));
    }
    
    // 驗證生日
    if (user.birthday !== birthday) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Invalid birthday' },
        { status: 401 }
      ));
    }
    
    // 登入成功
    const response = NextResponse.json({
      success: true,
      user: {
        phone: user.phone,
        name: user.name,
        email: user.email
      }
    });
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error('驗證用戶錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    ));
  }
}
