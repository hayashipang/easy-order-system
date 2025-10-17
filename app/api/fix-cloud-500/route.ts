import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// POST /api/fix-cloud-500 - 修復雲端 500 錯誤
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const body = await request.json();
    const { action, secretKey } = body;

    // 驗證密鑰
    if (secretKey !== 'fix-cloud-500-secret') {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const results: any[] = [];

    switch (action) {
      case 'regenerate-prisma':
        try {
          console.log('重新生成 Prisma 客戶端...');
          const { stdout, stderr } = await execAsync('npx prisma generate');
          results.push({
            action: 'regenerate-prisma',
            success: true,
            output: stdout,
            error: stderr || null
          });
        } catch (error) {
          results.push({
            action: 'regenerate-prisma',
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
        break;

      case 'migrate-database':
        try {
          console.log('執行資料庫遷移...');
          const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
          results.push({
            action: 'migrate-database',
            success: true,
            output: stdout,
            error: stderr || null
          });
        } catch (error) {
          results.push({
            action: 'migrate-database',
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
        break;

      case 'test-database-connection':
        try {
          console.log('測試資料庫連接...');
          await prisma.$connect();
          
          // 測試基本查詢
          const userCount = await prisma.user.count();
          const menuCount = await prisma.menuItem.count();
          const orderCount = await prisma.order.count();
          
          await prisma.$disconnect();
          
          results.push({
            action: 'test-database-connection',
            success: true,
            counts: {
              users: userCount,
              menuItems: menuCount,
              orders: orderCount
            }
          });
        } catch (error) {
          results.push({
            action: 'test-database-connection',
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
        break;

      case 'check-environment':
        try {
          const envCheck = {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL: process.env.DATABASE_URL ? '已設置' : '未設置',
            VERCEL: process.env.VERCEL,
            VERCEL_ENV: process.env.VERCEL_ENV,
            VERCEL_URL: process.env.VERCEL_URL,
            VERCEL_REGION: process.env.VERCEL_REGION,
            // Vercel Postgres 檢查
            POSTGRES_URL: process.env.POSTGRES_URL ? '已設置' : '未設置',
            POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '已設置' : '未設置',
            POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '已設置' : '未設置',
          };
          
          results.push({
            action: 'check-environment',
            success: true,
            environment: envCheck
          });
        } catch (error) {
          results.push({
            action: 'check-environment',
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
        break;

      case 'full-diagnosis':
        // 執行所有診斷步驟
        const actions = ['check-environment', 'test-database-connection', 'regenerate-prisma', 'migrate-database'];
        
        for (const actionName of actions) {
          try {
            switch (actionName) {
              case 'check-environment':
                const envCheck = {
                  NODE_ENV: process.env.NODE_ENV,
                  DATABASE_URL: process.env.DATABASE_URL ? '已設置' : '未設置',
                  VERCEL: process.env.VERCEL,
                  VERCEL_ENV: process.env.VERCEL_ENV,
                  VERCEL_URL: process.env.VERCEL_URL,
                  VERCEL_REGION: process.env.VERCEL_REGION,
                  // Vercel Postgres 檢查
                  POSTGRES_URL: process.env.POSTGRES_URL ? '已設置' : '未設置',
                  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '已設置' : '未設置',
                  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '已設置' : '未設置',
                };
                results.push({
                  action: 'check-environment',
                  success: true,
                  environment: envCheck
                });
                break;

              case 'test-database-connection':
                await prisma.$connect();
                const userCount = await prisma.user.count();
                const menuCount = await prisma.menuItem.count();
                const orderCount = await prisma.order.count();
                await prisma.$disconnect();
                
                results.push({
                  action: 'test-database-connection',
                  success: true,
                  counts: { users: userCount, menuItems: menuCount, orders: orderCount }
                });
                break;

              case 'regenerate-prisma':
                const { stdout: genStdout, stderr: genStderr } = await execAsync('npx prisma generate');
                results.push({
                  action: 'regenerate-prisma',
                  success: true,
                  output: genStdout,
                  error: genStderr || null
                });
                break;

              case 'migrate-database':
                const { stdout: migStdout, stderr: migStderr } = await execAsync('npx prisma migrate deploy');
                results.push({
                  action: 'migrate-database',
                  success: true,
                  output: migStdout,
                  error: migStderr || null
                });
                break;
            }
          } catch (error) {
            results.push({
              action: actionName,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
        break;

      default:
        return addCorsHeaders(NextResponse.json({ error: 'Invalid action' }, { status: 400 }));
    }

    return addCorsHeaders(NextResponse.json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('修復雲端 500 錯誤失敗:', error);
    return addCorsHeaders(NextResponse.json(
      { 
        success: false, 
        error: '修復失敗',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}

// OPTIONS /api/fix-cloud-500 - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}
