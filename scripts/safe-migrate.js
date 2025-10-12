const { execSync } = require('child_process');
const { backupDatabase } = require('./backup-db');

async function safeMigrate() {
  try {
    console.log('🔄 開始安全資料庫遷移...');
    
    // 1. 備份現有資料庫
    console.log('📦 正在備份現有資料庫...');
    const backupPath = await backupDatabase();
    console.log(`✅ 備份完成: ${backupPath}`);
    
    // 2. 執行 Prisma 遷移
    console.log('🚀 正在執行資料庫遷移...');
    execSync('npx prisma migrate dev --name safe_migration', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // 3. 重新生成 Prisma 客戶端
    console.log('🔧 正在重新生成 Prisma 客戶端...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('🎉 安全遷移完成！');
    console.log(`📁 備份文件位置: ${backupPath}`);
    console.log('💡 如果遇到問題，可以使用以下命令恢復:');
    console.log(`   node scripts/backup-db.js restore "${backupPath}"`);
    
  } catch (error) {
    console.error('❌ 遷移失敗:', error.message);
    console.log('💡 請檢查錯誤信息，必要時可以恢復備份');
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  safeMigrate();
}

module.exports = { safeMigrate };
