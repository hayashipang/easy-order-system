import { NextRequest, NextResponse } from 'next/server';
import { handleCors, addCorsHeaders } from '@/lib/cors';
import prisma from '@/lib/prisma';

// OPTIONS /api/customers/[phone]/password - Handle preflight requests
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  const corsResponse = handleCors(request);
  return corsResponse || new NextResponse(null, { status: 200 });
}

// PUT /api/customers/[phone]/password - 修改客戶密碼（生日）
export async function PUT(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  // Handle CORS
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const { phone } = params;
    const body = await request.json();
    const { newPassword, reason, adminId } = body;

    // 驗證必要參數
    if (!newPassword || !reason || !adminId) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Missing required fields: newPassword, reason, adminId' },
        { status: 400 }
      ));
    }

    // 驗證密碼格式 (6位數字)
    const passwordRegex = /^\d{6}$/;
    if (!passwordRegex.test(newPassword)) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Password must be 6 digits (e.g., 660111)' },
        { status: 400 }
      ));
    }

    // 查找客戶
    const customer = await prisma.user.findUnique({
      where: { phone }
    });

    if (!customer) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      ));
    }

    // 檢查新密碼是否與原密碼相同
    if (customer.birthday === newPassword) {
      return addCorsHeaders(NextResponse.json(
        { error: 'New password cannot be the same as current password' },
        { status: 400 }
      ));
    }

    // 更新客戶密碼
    const updatedCustomer = await prisma.user.update({
      where: { phone },
      data: {
        birthday: newPassword,
        updatedAt: new Date()
      }
    });

    // 記錄操作日誌（可以擴展為專門的日誌表）
    console.log(`Password updated for customer ${phone} by admin ${adminId}. Reason: ${reason}. Old: ${customer.birthday}, New: ${newPassword}`);

    // 返回成功響應
    return addCorsHeaders(NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      customer: {
        phone: updatedCustomer.phone,
        name: updatedCustomer.name,
        birthday: updatedCustomer.birthday,
        updatedAt: updatedCustomer.updatedAt
      }
    }));

  } catch (error) {
    console.error('修改客戶密碼錯誤:', error);
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to update customer password' },
      { status: 500 }
    ));
  }
}
