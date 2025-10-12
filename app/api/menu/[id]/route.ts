import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { compressAndSaveImage } from '@/lib/imageCompression';

const prisma = new PrismaClient();

// GET /api/menu/[id] - 獲取特定菜單項目
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: params.id }
    });
    
    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('獲取菜單項目錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}

// PUT /api/menu/[id] - 更新菜單項目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');
    
    let updateData: any = {};
    
    if (isFormData) {
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
          return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
          );
        }
      }
      
      updateData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
        category: formData.get('category') as string,
        productType: formData.get('productType') as string || null,
        isAvailable: formData.get('isAvailable') === 'true',
        stock: formData.get('stock') ? parseInt(formData.get('stock') as string) : undefined
      };
      
      // 只有在有新的圖片URL時才更新
      if (imageUrl) {
        updateData.imageUrl = imageUrl;
      }
    } else {
      // 處理JSON數據
      const body = await request.json();
      updateData = {
        name: body.name,
        description: body.description,
        price: body.price ? parseFloat(body.price) : undefined,
        category: body.category,
        productType: body.productType || null,
        isAvailable: body.isAvailable,
        stock: body.stock
      };
      
      // 只有在提供新的圖片URL時才更新
      if (body.imageUrl !== undefined && body.imageUrl !== null) {
        updateData.imageUrl = body.imageUrl;
      }
      
      // 檢查名稱是否與其他項目重複
      if (body.name) {
        const existingItem = await prisma.menuItem.findFirst({
          where: {
            name: body.name,
            id: { not: params.id }
          }
        });
        
        if (existingItem) {
          return NextResponse.json(
            { error: '菜單項目名稱已存在' },
            { status: 400 }
          );
        }
      }
    }
    
    // 對於FormData，檢查名稱是否與其他項目重複
    if (isFormData && updateData.name) {
      const existingItem = await prisma.menuItem.findFirst({
        where: {
          name: updateData.name,
          id: { not: params.id }
        }
      });
      
      if (existingItem) {
        return NextResponse.json(
          { error: '菜單項目名稱已存在' },
          { status: 400 }
        );
      }
    }

    const menuItem = await prisma.menuItem.update({
      where: { id: params.id },
      data: updateData
    });
    
    return NextResponse.json(menuItem);
  } catch (error) {
    console.error('更新菜單項目錯誤:', error);
    
    // 處理唯一約束錯誤
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: '菜單項目名稱已存在' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

// DELETE /api/menu/[id] - 刪除菜單項目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.menuItem.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('刪除菜單項目錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
