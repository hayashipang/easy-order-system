import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import { compressAndSaveImage } from '@/lib/imageCompression';
import { getImageUrl } from '@/lib/getImageUrl';
import { isRailwayEnvironment } from '@/lib/railwayImageHandler';

const prisma = new PrismaClient();

// GET /api/menu - 獲取所有菜單項目
export async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: { name: 'asc' }
    });
    
    // 處理圖片 URL，確保返回正確的絕對路徑
    const menuItemsWithCorrectUrls = menuItems.map(item => {
      let imageUrl = null;
      
      if (item.imageUrl) {
        // 在 Railway 環境中，檢查圖片是否存在
        if (isRailwayEnvironment()) {
          // 暫時返回 null，讓前端顯示佔位符
          imageUrl = null;
        } else {
          imageUrl = getImageUrl(item.imageUrl);
        }
      }
      
      return {
        ...item,
        imageUrl: imageUrl
      };
    });
    
    const response = NextResponse.json(menuItemsWithCorrectUrls);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('獲取菜單錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    ));
  }
}

// POST /api/menu - 創建新菜單項目
export async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const contentType = request.headers.get('content-type') || '';
    
    let createData: any = {};
    
    if (contentType.includes('multipart/form-data')) {
      // 處理FormData（包含文件上傳）
      const formData = await request.formData();
      
      // 處理圖片上傳
      let imageUrl = formData.get('imageUrl') as string;
      const imageFile = formData.get('image') as File;
      
      if (imageFile && imageFile.size > 0) {
        try {
          // 將圖片轉換為 Buffer 並壓縮
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // 使用壓縮函數處理圖片
          const compressionResult = await compressAndSaveImage(buffer, 'menu');
          imageUrl = compressionResult.url;
          
          console.log(`圖片壓縮完成: ${compressionResult.compressionRatio} 壓縮率`);
        } catch (error) {
          console.error('圖片上傳失敗:', error);
          return addCorsHeaders(NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
          ));
        }
      }
      
      createData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: formData.get('price') ? parseFloat(formData.get('price') as string) : 0,
        category: formData.get('category') as string || 'general',
        productType: formData.get('productType') as string || null,
        isAvailable: formData.get('isAvailable') === 'true',
        stock: formData.get('stock') ? parseInt(formData.get('stock') as string) : 999,
        imageUrl: imageUrl
      };
    } else {
      // 處理JSON數據
      const body = await request.json();
      createData = {
        name: body.name,
        description: body.description,
        price: parseFloat(body.price),
        category: body.category || 'general',
        productType: body.productType || null,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
        stock: body.stock || 999,
        imageUrl: body.imageUrl
      };
    }
    
    // 檢查是否已存在
    const existingItem = await prisma.menuItem.findUnique({
      where: { name: createData.name }
    });
    
    if (existingItem) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Menu item with this name already exists' },
        { status: 400 }
      ));
    }
    
    const menuItem = await prisma.menuItem.create({
      data: createData
    });
    
    const response = NextResponse.json(menuItem, { status: 201 });
    return addCorsHeaders(response);
  } catch (error) {
    console.error('創建菜單項目錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    ));
  }
}
