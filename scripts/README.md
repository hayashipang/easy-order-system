# 資料庫管理腳本

這些腳本幫助您安全地管理資料庫，避免意外丟失數據。

## 📋 可用腳本

### 1. 初始化腳本

#### `init-settings.js` - 初始化系統設定
```bash
node scripts/init-settings.js
```
- 只會更新系統設定，不會影響菜單項目
- 使用 `upsert` 操作，安全更新

#### `init-menu.js` - 初始化菜單項目
```bash
node scripts/init-menu.js
```
- **安全操作**：只會添加不存在的菜單項目
- **不會刪除**：現有的菜單項目會被保留
- 會顯示跳過已存在的項目

#### `init-all.js` - 完整初始化
```bash
node scripts/init-all.js
```
- 初始化系統設定、促銷設定和菜單項目
- 所有操作都是安全的，不會刪除現有數據

### 2. 備份和恢復腳本

#### `backup-db.js` - 資料庫備份和恢復
```bash
# 備份資料庫
node scripts/backup-db.js backup

# 恢復資料庫
node scripts/backup-db.js restore <backup-file>
```

#### `safe-migrate.js` - 安全遷移
```bash
node scripts/safe-migrate.js
```
- 自動備份資料庫
- 執行 Prisma 遷移
- 重新生成客戶端
- 如果失敗，提供恢復指令

#### `test-promotion.js` - 促銷系統測試
```bash
node scripts/test-promotion.js
```
- 檢查促銷設定是否正常
- 驗證菜單項目
- 檢查訂單中的促銷信息
- 模擬促銷計算邏輯

## 🛡️ 安全保證

### 菜單項目保護
- 所有初始化腳本都使用 `create` 而不是 `upsert`
- 會先檢查項目是否存在，只創建不存在的項目
- **絕對不會刪除**您手動添加的菜單項目

### 資料庫備份
- 每次重要操作前都會自動備份
- 備份文件包含時間戳，方便識別
- 提供簡單的恢復命令

## 📝 使用建議

### 日常使用
1. 正常使用管理後台添加菜單項目
2. 定期運行 `node scripts/backup-db.js backup` 備份資料庫

### 程式更新時
1. 先備份：`node scripts/backup-db.js backup`
2. 執行遷移：`node scripts/safe-migrate.js`
3. 如果需要初始化：`node scripts/init-all.js`

### 緊急恢復
```bash
# 列出備份文件
ls scripts/backups/

# 恢復到特定時間點
node scripts/backup-db.js restore scripts/backups/dev-2025-10-12T00-40-00-000Z.db
```

## ⚠️ 注意事項

1. **永遠不要**直接刪除 `prisma/dev.db` 文件
2. **程式更新前**務必備份資料庫
3. 如果遇到問題，先嘗試恢復備份
4. 初始化腳本可以安全地重複執行

## 🔧 故障排除

### 菜單項目消失
```bash
# 檢查資料庫
sqlite3 prisma/dev.db "SELECT name FROM menu_items;"

# 如果有備份，恢復
node scripts/backup-db.js restore <backup-file>

# 如果沒有備份，重新初始化（只會添加預設項目）
node scripts/init-menu.js
```

### API 錯誤
```bash
# 重新生成 Prisma 客戶端
npx prisma generate

# 重啟開發伺服器
npm run dev
```
