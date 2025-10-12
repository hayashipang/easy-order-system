const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initMenu() {
  try {
    console.log('正在初始化菜單項目...');

    // 預設菜單項目
    const defaultMenuItems = [
      {
        name: '即飲瓶 - 原味',
        description: '新鮮現榨，原味純正',
        price: 200,
        category: '即飲瓶',
        productType: '即飲瓶',
        isAvailable: true,
        stock: 999
      },
      {
        name: '即飲瓶 - 蜂蜜',
        description: '天然蜂蜜調味，香甜可口',
        price: 220,
        category: '即飲瓶',
        productType: '即飲瓶',
        isAvailable: true,
        stock: 999
      },
      {
        name: '即飲瓶 - 檸檬',
        description: '新鮮檸檬調味，酸甜清爽',
        price: 220,
        category: '即飲瓶',
        productType: '即飲瓶',
        isAvailable: true,
        stock: 999
      },
      {
        name: '鮮凍包 - 原味',
        description: '冷凍保存，保持新鮮',
        price: 180,
        category: '鮮凍包',
        productType: '鮮凍包',
        isAvailable: true,
        stock: 999
      },
      {
        name: '鮮凍包 - 蜂蜜',
        description: '天然蜂蜜調味，冷凍保存',
        price: 200,
        category: '鮮凍包',
        productType: '鮮凍包',
        isAvailable: true,
        stock: 999
      },
      {
        name: '鮮凍包 - 檸檬',
        description: '新鮮檸檬調味，冷凍保存',
        price: 200,
        category: '鮮凍包',
        productType: '鮮凍包',
        isAvailable: true,
        stock: 999
      }
    ];

    // 檢查現有菜單項目
    const existingItems = await prisma.menuItem.findMany();
    console.log(`📊 目前資料庫中有 ${existingItems.length} 個菜單項目`);

    // 只創建不存在的菜單項目
    let createdCount = 0;
    for (const item of defaultMenuItems) {
      const existing = existingItems.find(existing => existing.name === item.name);
      if (!existing) {
        await prisma.menuItem.create({
          data: item
        });
        console.log(`✅ 已創建新菜單項目: ${item.name} - NT$ ${item.price}`);
        createdCount++;
      } else {
        console.log(`⏭️ 菜單項目已存在，跳過: ${item.name}`);
      }
    }

    if (createdCount === 0) {
      console.log('📝 所有預設菜單項目都已存在，無需創建新項目');
    } else {
      console.log(`🎉 成功創建了 ${createdCount} 個新菜單項目`);
    }

    console.log('🎉 菜單項目初始化完成！');
  } catch (error) {
    console.error('❌ 初始化菜單項目失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initMenu();
