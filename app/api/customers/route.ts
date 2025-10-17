import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// OPTIONS /api/customers - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}

// GET /api/customers - 獲取所有客戶
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const response = NextResponse.json(users, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('獲取客戶錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    ));
  }
}

// POST /api/customers - 創建新客戶
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const { phone, name, email, birthday } = body;
    
    if (!phone) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      ));
    }
    
    // 檢查是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });
    
    if (existingUser) {
      const response = NextResponse.json(existingUser);
      return addCorsHeaders(response);
    }
    
    const user = await prisma.user.create({
      data: {
        phone,
        name: name || `User-${phone}`,
        email,
        birthday
      }
    });
    
    const response = NextResponse.json(user, { status: 201 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('創建客戶錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    ));
  }
}
