# 本地開發指南

## 🏠 本地開發環境設置

### 1. 環境變數設置

複製環境變數範例檔案：
```bash
cp .env.local.example .env.local
```

編輯 `.env.local` 檔案，根據您的需求設置：

**選項 A：完全本地開發**
```bash
# 前端和後端都在本地運行
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL="postgresql://username:password@localhost:5432/easy_order_dev"
NODE_ENV=development
```

**選項 B：前端本地，後端使用雲端**
```bash
# 前端本地開發，後端使用 Railway
NEXT_PUBLIC_API_URL=https://easy-order-system-production-0490.up.railway.app
NODE_ENV=development
```

### 2. 本地開發流程

#### 前端開發（推薦方式）
```bash
# 1. 安裝依賴
npm install

# 2. 啟動本地開發服務器
npm run dev

# 3. 訪問 http://localhost:4000
```

#### 後端開發（如果需要）
```bash
# 1. 進入後端目錄
cd backend

# 2. 安裝依賴
npm install

# 3. 設置環境變數
cp env.example .env
# 編輯 .env 檔案

# 4. 生成 Prisma 客戶端
npm run prisma:generate

# 5. 啟動後端服務器
npm run dev
```

### 3. 開發工作流程

1. **修改 UI**：在本地進行 UI 修改和測試
2. **測試功能**：確保所有功能正常運作
3. **提交代碼**：使用 git 提交變更
4. **推送到雲端**：推送到 GitHub，自動觸發部署

### 4. 環境分離說明

- **本地開發**：使用 `.env.local` 中的設置
- **雲端部署**：使用 Vercel 和 Railway 的環境變數設置
- **不會互相影響**：本地修改不會影響雲端程式

### 5. 常見問題

**Q: 本地修改會影響雲端嗎？**
A: 不會。本地開發使用 `.env.local`，雲端使用各自的環境變數。

**Q: 如何確保本地和雲端使用相同的數據？**
A: 如果後端使用雲端，數據會自動同步。如果後端也在本地，需要設置本地數據庫。

**Q: 如何測試 API 連接？**
A: 訪問 `/test-env` 頁面查看環境變數和測試 API 連接。

## 🔧 技術細節

- 前端：Next.js (port 4000)
- 後端：Express.js (port 3000)
- 數據庫：PostgreSQL
- 部署：Vercel (前端) + Railway (後端)
