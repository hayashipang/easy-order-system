import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/product-details - 獲取所有產品詳情
export async function GET() {
  try {
    const productDetails = await prisma.productDetail.findMany({
      orderBy: { category: 'asc' }
    });
    
    return NextResponse.json(productDetails);
  } catch (error) {
    console.error('獲取產品詳情錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}

// POST /api/product-details - 創建產品詳情
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, title, content, rules, images } = body;
    
    if (!category || !title) {
      return NextResponse.json(
        { error: 'Category and title are required' },
        { status: 400 }
      );
    }
    
    const productDetail = await prisma.productDetail.create({
      data: {
        category,
        title,
        content: content || '',
        rules: rules || null,
        images: images || null
      }
    });
    
    return NextResponse.json(productDetail, { status: 201 });
  } catch (error) {
    console.error('創建產品詳情錯誤:', error);
    return NextResponse.json(
      { error: 'Failed to create product detail' },
      { status: 500 }
    );
  }
}
