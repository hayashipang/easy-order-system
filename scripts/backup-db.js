const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  try {
    const sourcePath = path.join(__dirname, '../prisma/dev.db');
    const backupDir = path.join(__dirname, '../backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `dev-${timestamp}.db`);

    // 創建備份目錄
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 複製資料庫文件
    fs.copyFileSync(sourcePath, backupPath);
    
    console.log(`✅ 資料庫備份完成: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ 資料庫備份失敗:', error);
    throw error;
  }
}

async function restoreDatabase(backupPath) {
  try {
    const targetPath = path.join(__dirname, '../prisma/dev.db');
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`備份文件不存在: ${backupPath}`);
    }

    // 複製備份文件到目標位置
    fs.copyFileSync(backupPath, targetPath);
    
    console.log(`✅ 資料庫恢復完成: ${backupPath} -> ${targetPath}`);
  } catch (error) {
    console.error('❌ 資料庫恢復失敗:', error);
    throw error;
  }
}

// 如果直接執行此腳本，則進行備份
if (require.main === module) {
  const command = process.argv[2];
  const backupPath = process.argv[3];

  if (command === 'backup') {
    backupDatabase();
  } else if (command === 'restore' && backupPath) {
    restoreDatabase(backupPath);
  } else {
    console.log('使用方法:');
    console.log('  node scripts/backup-db.js backup                    # 備份資料庫');
    console.log('  node scripts/backup-db.js restore <backup-file>     # 恢復資料庫');
  }
}

module.exports = { backupDatabase, restoreDatabase };
