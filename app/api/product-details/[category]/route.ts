import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/product-details/[category] - 獲取特定分類的產品詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const category = decodeURIComponent(params.category);
    
    const productDetail = await prisma.productDetail.findUnique({
      where: { category }
    });
    
    if (!productDetail) {
      return NextResponse.json(
        { error: 'Product detail not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(productDetail);
  } catch (error) {
    console.error('獲取產品詳情錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product detail' },
      { status: 500 }
    );
  }
}

// PUT /api/product-details/[category] - 更新特定分類的產品詳情
export async function PUT(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const category = decodeURIComponent(params.category);
    const body = await request.json();
    const { title, content, rules, images } = body;
    
    const productDetail = await prisma.productDetail.upsert({
      where: { category },
      update: {
        title: title || '',
        content: content || '',
        rules: rules || null,
        images: images || null
      },
      create: {
        category,
        title: title || '',
        content: content || '',
        rules: rules || null,
        images: images || null
      }
    });
    
    return NextResponse.json(productDetail);
  } catch (error) {
    console.error('更新產品詳情錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to update product detail' },
      { status: 500 }
    );
  }
}

// DELETE /api/product-details/[category] - 刪除特定分類的產品詳情
export async function DELETE(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const category = decodeURIComponent(params.category);
    
    await prisma.productDetail.delete({
      where: { category }
    });
    
    return NextResponse.json({ message: 'Product detail deleted successfully' });
  } catch (error) {
    console.error('刪除產品詳情錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to delete product detail' },
      { status: 500 }
    );
  }
}
