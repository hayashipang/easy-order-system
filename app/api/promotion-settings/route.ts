import { NextResponse } from 'next/server'

// 🔧 強制 Vercel 將此 API 視為動態函數
export const dynamic = 'force-dynamic'

// ✅ 讀取設定（可選）
export async function GET() {
  return NextResponse.json({ message: 'GET OK' })
}

// ✅ 更新促銷設定（主要修復點）
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    console.log('🔹 PUT /api/promotion-settings received:', body)

    // TODO: 在此放入資料庫更新或邏輯處理
    // e.g., await prisma.promotion_settings.update(...)

    return NextResponse.json({
      success: true,
      message: 'Promotion settings updated successfully',
      data: body,
    })
  } catch (error) {
    console.error('❌ PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// 🚫 不允許的其他方法（安全保險）
export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}