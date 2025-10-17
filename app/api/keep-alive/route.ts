import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// GET /api/keep-alive - 保持 Vercel Functions 活躍
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // 簡單的資料庫查詢來保持連接活躍
    const userCount = await prisma.user.count();
    const menuCount = await prisma.menuItem.count();
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'Functions 保持活躍',
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        menuItems: menuCount
      },
      environment: {
        vercel: !!process.env.VERCEL,
        nodeEnv: process.env.NODE_ENV
      }
    }));
    
  } catch (error) {
    console.error('Keep-alive 錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        success: false, 
        error: 'Keep-alive 失敗',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    ));
  }
}

// OPTIONS /api/keep-alive - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}
