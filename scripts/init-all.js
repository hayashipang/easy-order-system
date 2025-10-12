const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initAll() {
  try {
    console.log('🚀 開始初始化系統...');

    // 1. 初始化系統設定
    console.log('\n📋 正在初始化系統設定...');
    const defaultSettings = [
      {
        key: 'free_shipping_threshold',
        value: '20',
        description: '免運費門檻（瓶數）'
      },
      {
        key: 'shipping_fee',
        value: '120',
        description: '運費金額'
      },
      {
        key: 'store_address',
        value: '台南市永康區永康街121號',
        description: '取貨地址'
      },
      {
        key: 'store_hours',
        value: '09:00 ~ 17:00',
        description: '營業時間'
      },
      {
        key: 'contact_phone',
        value: '',
        description: '聯絡電話'
      }
    ];

    for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      });
      console.log(`✅ 已更新設定: ${setting.key} = ${setting.value}`);
    }

    // 2. 初始化促銷設定
    console.log('\n🎁 正在初始化促銷設定...');
    await prisma.promotionSetting.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        isFreeShippingEnabled: false,
        freeShippingThreshold: 20,
        isGiftEnabled: false,
        giftThreshold: 20,
        giftQuantity: 1,
        giftProductName: '',
        promotionText: ''
      }
    });
    console.log('✅ 已創建預設促銷設定');

    // 3. 初始化菜單項目
    console.log('\n🍽️ 正在初始化菜單項目...');
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

    console.log('\n🎉 系統初始化完成！');
    console.log('📊 初始化摘要:');
    console.log(`   - 系統設定: ${defaultSettings.length} 項`);
    console.log(`   - 促銷設定: 1 項`);
    console.log(`   - 菜單項目: ${defaultMenuItems.length} 項`);
    
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initAll();
