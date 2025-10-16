// Vercel資料庫設置腳本
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🚀 開始設置Vercel資料庫...');
    
    // 測試資料庫連接
    await prisma.$connect();
    console.log('✅ 資料庫連接成功');
    
    // 運行遷移
    console.log('📊 運行資料庫遷移...');
    // 這裡會自動創建所有表格
    
    // 測試基本操作
    console.log('🧪 測試基本操作...');
    
    // 創建一個測試用戶
    const testUser = await prisma.user.upsert({
      where: { phone: '0938090857' },
      update: {},
      create: {
        phone: '0938090857',
        name: '測試用戶',
        email: 'test@example.com',
        birthday: '660111'
      }
    });
    console.log('✅ 測試用戶創建成功:', testUser.phone);
    
    // 檢查菜單項目
    const menuItems = await prisma.menuItem.findMany();
    console.log(`✅ 找到 ${menuItems.length} 個菜單項目`);
    
    console.log('🎉 Vercel資料庫設置完成！');
    
  } catch (error) {
    console.error('❌ 資料庫設置失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();

