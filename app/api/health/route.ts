import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';

export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    return addCorsHeaders(NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      version: '1.2.2',
      corsMethods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      deploymentTime: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Health check error:', error);
    return addCorsHeaders(NextResponse.json({ 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}
