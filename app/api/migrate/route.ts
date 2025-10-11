import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Only allow in production and with a secret key
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer migrate-secret-key') {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    console.log('Starting database migration...');
    
    // Run Prisma migration
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    console.log('Migration output:', stdout);
    if (stderr) {
      console.error('Migration stderr:', stderr);
    }

    return addCorsHeaders(NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      output: stdout,
      error: stderr || null
    }));

  } catch (error) {
    console.error('Migration error:', error);
    return addCorsHeaders(NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 }));
  }
}
