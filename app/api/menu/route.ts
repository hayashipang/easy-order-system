import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import { compressAndSaveImage } from '@/lib/imageCompression';
import { getImageUrl } from '@/lib/getImageUrl';
import { storeImageInDatabase } from '@/lib/databaseImageStorage';
import prisma from '@/lib/prisma';

// OPTIONS /api/menu - Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}

// GET /api/menu - 獲取所有菜單項目
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 開始獲取菜單項目...');
    
    // 按 sortOrder 排序，如果字段不存在會自動回退到按名稱排序
    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`✅ 成功獲取 ${menuItems.length} 個菜單項目`);
    
    // 直接返回，不使用 CORS 處理
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('❌ 獲取菜單錯誤:', error);
    console.error('❌ 錯誤詳情:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch menu items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/menu - 創建新菜單項目
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const contentType = request.headers.get('content-type') || '';
    console.log('🔍 POST /api/menu - Content-Type:', contentType);
    
    let createData: any = {};
    
    if (contentType.includes('multipart/form-data')) {
      // 處理FormData（包含文件上傳）
      const formData = await request.formData();
      
      // 處理圖片上傳
      let imageUrl = formData.get('imageUrl') as string;
      const imageFile = formData.get('image') as File;
      
      if (imageFile && imageFile.size > 0) {
        try {
          console.log(`📤 開始處理圖片: ${imageFile.name}, 大小: ${imageFile.size} bytes`);
          
          // 將圖片轉換為 Buffer
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // 直接使用資料庫存儲（已包含壓縮）
          const storageResult = await storeImageInDatabase(buffer, imageFile.name, 'menu');
          imageUrl = storageResult.url;
          console.log(`✅ 圖片處理完成: ${storageResult.compressionRatio} 壓縮率`);
        } catch (error) {
          console.error('❌ 圖片上傳失敗:', error);
          return addCorsHeaders(NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
          ));
        }
      }
      
      createData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: formData.get('price') ? parseFloat(formData.get('price') as string) || 0 : 0,
        category: formData.get('category') as string || 'general',
        productType: (formData.get('productType') as string) || null,
        isAvailable: formData.get('isAvailable') === 'true',
        stock: formData.get('stock') ? parseInt(formData.get('stock') as string) : 999,
        imageUrl: imageUrl
      };
      
      console.log('📝 FormData 解析結果:', createData);
    } else {
      // 處理JSON數據
      const body = await request.json();
      createData = {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price) || 0,
        category: body.category || 'general',
        productType: body.productType || null,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
        stock: body.stock || 999,
        imageUrl: body.imageUrl
      };
    }
    
    // 驗證必填欄位
    if (!createData.name || createData.name.trim() === '') {
      console.log('❌ 產品名稱不能為空');
      return addCorsHeaders(NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      ));
    }
    
    // 檢查是否已存在（考慮產品類型）
    console.log(`🔍 檢查產品重複: name="${createData.name}", productType="${createData.productType}"`);
    
    const existingItem = await prisma.menuItem.findFirst({
      where: { 
        name: createData.name,
        productType: createData.productType
      }
    });
    
    if (existingItem) {
      console.log(`❌ 產品已存在: ${createData.name} (${createData.productType})`);
      return addCorsHeaders(NextResponse.json(
        { error: `Product "${createData.name}" of type "${createData.productType}" already exists` },
        { status: 400 }
      ));
    }
    
    console.log(`✅ 產品名稱可用: ${createData.name} (${createData.productType})`);
    
    console.log('💾 開始創建產品:', createData);
    
    const menuItem = await prisma.menuItem.create({
      data: createData
    });
    
    console.log('✅ 產品創建成功:', menuItem.id);
    
    const response = NextResponse.json(menuItem, { status: 201 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('❌ 創建菜單項目錯誤:', error);
    console.error('❌ 錯誤詳情:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return addCorsHeaders(NextResponse.json(
      { 
        error: 'Failed to create menu item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}
