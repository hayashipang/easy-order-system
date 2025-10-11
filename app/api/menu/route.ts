import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { handleCors, addCorsHeaders } from '@/lib/cors';

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
    
    const response = NextResponse.json(menuItems);
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
          // 創建uploads目錄
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          await mkdir(uploadsDir, { recursive: true });
          
          // 生成唯一文件名
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileExtension = path.extname(imageFile.name);
          const fileName = `menu-${timestamp}-${randomString}${fileExtension}`;
          
          // 保存文件
          const filePath = path.join(uploadsDir, fileName);
          const bytes = await imageFile.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filePath, buffer);
          
          // 設置圖片URL
          imageUrl = `/uploads/${fileName}`;
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
