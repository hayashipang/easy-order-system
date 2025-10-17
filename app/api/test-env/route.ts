import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';

// GET /api/test-env - 測試環境變數
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // 檢查關鍵環境變數
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? '***已設置***' : '❌ 未設置',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      PORT: process.env.PORT,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_REGION: process.env.VERCEL_REGION,
      // Vercel Postgres 相關
      POSTGRES_URL: process.env.POSTGRES_URL ? '***已設置***' : '❌ 未設置',
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '***已設置***' : '❌ 未設置',
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '***已設置***' : '❌ 未設置',
      POSTGRES_USER: process.env.POSTGRES_USER ? '***已設置***' : '❌ 未設置',
      POSTGRES_HOST: process.env.POSTGRES_HOST ? '***已設置***' : '❌ 未設置',
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '***已設置***' : '❌ 未設置',
      POSTGRES_DATABASE: process.env.POSTGRES_DATABASE ? '***已設置***' : '❌ 未設置',
    };

    // 檢查 DATABASE_URL 格式
    let databaseUrlValid = false;
    let databaseUrlError = '';
    
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        databaseUrlValid = url.protocol === 'postgresql:' || url.protocol === 'postgres:';
        if (!databaseUrlValid) {
          databaseUrlError = 'DATABASE_URL 不是有效的 PostgreSQL 連接字串';
        }
      } catch (error) {
        databaseUrlValid = false;
        databaseUrlError = 'DATABASE_URL 格式錯誤';
      }
    } else {
      databaseUrlError = 'DATABASE_URL 未設置';
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      environment: envVars,
      databaseUrl: {
        exists: !!process.env.DATABASE_URL,
        valid: databaseUrlValid,
        error: databaseUrlError
      },
      deployment: {
        isVercel: !!process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
        vercelRegion: process.env.VERCEL_REGION,
        environment: process.env.NODE_ENV || 'development'
      }
    }));
    
  } catch (error) {
    console.error('環境變數檢查失敗:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        success: false, 
        error: '環境變數檢查失敗',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}

// OPTIONS /api/test-env - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}
