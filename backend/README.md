# Easy Order Backend API

這是 Easy Order 系統的後端 API 服務，部署在 Railway 上。

## 🚀 功能

- 客戶管理 (Customers)
- 訂單管理 (Orders)
- 菜單管理 (Menu)
- 數據庫集成 (Prisma + PostgreSQL)

## 📋 API 端點

### 健康檢查
- `GET /health` - 服務健康狀態

### 客戶管理
- `GET /api/customers` - 獲取所有客戶
- `POST /api/customers` - 創建新客戶

### 訂單管理
- `GET /api/orders` - 獲取所有訂單
- `POST /api/orders` - 創建新訂單
- `GET /api/orders/:id` - 獲取特定訂單

### 菜單管理
- `GET /api/menu` - 獲取菜單項目
- `POST /api/menu` - 創建菜單項目

## 🛠 本地開發

1. 安裝依賴：
```bash
cd backend
npm install
```

2. 設置環境變數：
```bash
cp env.example .env
# 編輯 .env 文件，設置 DATABASE_URL
```

3. 生成 Prisma 客戶端：
```bash
npm run prisma:generate
```

4. 運行開發服務器：
```bash
npm run dev
```

## 🚀 部署到 Railway

1. 在 Railway 創建新項目
2. 連接 GitHub 倉庫
3. 設置環境變數：
   - `DATABASE_URL` - PostgreSQL 數據庫連接
   - `NODE_ENV=production`
4. 部署

## 📊 數據庫

使用 PostgreSQL 作為生產數據庫，通過 Prisma ORM 進行數據管理。

## 🔧 技術棧

- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Railway (部署平台)
