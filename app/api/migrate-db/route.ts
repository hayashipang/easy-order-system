import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// POST /api/migrate-db - 運行資料庫遷移
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    console.log('開始運行資料庫遷移...');
    
    // 運行 Prisma 遷移
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    console.log('遷移輸出:', stdout);
    if (stderr) {
      console.log('遷移錯誤:', stderr);
    }
    
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: '資料庫遷移完成',
      output: stdout,
      error: stderr || null
    }));
    
  } catch (error) {
    console.error('資料庫遷移失敗:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        success: false, 
        error: '資料庫遷移失敗',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}

// OPTIONS /api/migrate-db - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}
