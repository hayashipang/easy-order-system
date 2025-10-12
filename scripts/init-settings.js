const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initSettings() {
  try {
    console.log('正在初始化系統設定...');

    // 預設系統設定
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

    // 更新所有設定為預設值
    for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      });
      console.log(`✅ 已更新設定: ${setting.key} = ${setting.value}`);
    }

    console.log('🎉 系統設定初始化完成！');
  } catch (error) {
    console.error('❌ 初始化系統設定失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initSettings();
