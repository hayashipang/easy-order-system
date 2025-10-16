# 🛒 Easy Order System

一個基於 Next.js 的全端訂單管理系統，支援客戶訂購、管理員後台、促銷活動等功能。

## ✨ 主要功能

### 🛍️ 客戶端功能
- **商品瀏覽** - 分類展示商品，支援圖片上傳與壓縮
- **購物車** - 即時計算價格，支援數量調整
- **訂單系統** - 完整的下單流程，包含客戶資訊收集
- **訂單查詢** - 透過訂單編號查詢訂單狀態
- **促銷活動** - 自動計算免運費與贈品優惠

### 👨‍💼 管理員功能
- **儀表板** - 訂單統計與系統概覽
- **客戶管理** - 客戶資料維護與訂單歷史
- **菜單管理** - 商品新增、編輯、排序
- **訂單管理** - 訂單狀態更新、確認、付款處理
- **系統設定** - 促銷規則、免運費門檻設定
- **圖片管理** - 商品圖片上傳與資料庫儲存

## 🏗️ 技術架構

### 前端技術
- **Next.js 14** - React 全端框架
- **TypeScript** - 型別安全
- **Tailwind CSS** - 響應式 UI 設計
- **React Hook Form** - 表單管理
- **Zustand** - 狀態管理
- **React DnD** - 拖拽排序功能

### 後端技術
- **Next.js API Routes** - 服務端 API
- **Prisma ORM** - 資料庫操作
- **PostgreSQL** - 主要資料庫
- **Sharp** - 圖片壓縮處理

### 部署平台
- **Vercel** - 前端部署
- **Railway** - 後端服務與資料庫

## 🚀 快速開始

### 環境需求
- Node.js 18+
- PostgreSQL 資料庫
- npm 或 yarn

### 本地開發

1. **克隆專案**
```bash
git clone <repository-url>
cd easy-order-system
```

2. **安裝依賴**
```bash
npm install
```

3. **設定環境變數**
```bash
# 建立 .env.local 檔案
echo 'DATABASE_URL="postgresql://user:password@host:port/database"' > .env.local
```

4. **初始化資料庫**
```bash
npx prisma generate
npx prisma migrate deploy
```

5. **啟動開發伺服器**
```bash
npm run dev
```

6. **開啟瀏覽器**
```
http://localhost:4000
```

### 管理員登入
- 路徑：`/admin/login`
- 預設帳號：請查看資料庫中的管理員設定

## 📁 專案結構

```
easy-order-system/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理員頁面
│   │   ├── dashboard/     # 儀表板
│   │   ├── customers/     # 客戶管理
│   │   ├── menu/          # 菜單管理
│   │   ├── product-details/ # 商品詳情
│   │   └── settings/      # 系統設定
│   ├── api/               # API 路由
│   │   ├── customers/     # 客戶 API
│   │   ├── menu/          # 菜單 API
│   │   ├── orders/        # 訂單 API
│   │   ├── settings/      # 設定 API
│   │   └── upload/        # 上傳 API
│   ├── checkout/          # 結帳頁面
│   ├── order-confirmation/ # 訂單確認
│   └── order-query/       # 訂單查詢
├── components/            # 共用元件
├── lib/                   # 工具函數
│   ├── api.ts            # API 呼叫
│   ├── cors.ts           # CORS 設定
│   └── prisma.ts         # 資料庫連接
├── prisma/               # 資料庫設定
│   ├── schema.prisma     # 資料庫結構
│   └── migrations/       # 資料庫遷移
└── public/               # 靜態資源
```

## 🔧 主要 API 端點

### 客戶管理
- `GET /api/customers` - 獲取客戶列表
- `POST /api/customers` - 新增客戶
- `GET /api/customers/[phone]` - 查詢特定客戶

### 訂單管理
- `GET /api/orders` - 獲取訂單列表
- `POST /api/orders` - 建立新訂單
- `GET /api/orders/[id]` - 查詢特定訂單
- `PUT /api/orders/[id]/status` - 更新訂單狀態
- `POST /api/orders/[id]/confirm` - 確認訂單
- `POST /api/orders/[id]/payment` - 處理付款

### 菜單管理
- `GET /api/menu` - 獲取菜單項目
- `POST /api/menu` - 新增菜單項目
- `PUT /api/menu/[id]` - 更新菜單項目
- `DELETE /api/menu/[id]` - 刪除菜單項目

### 系統設定
- `GET /api/settings` - 獲取系統設定
- `PUT /api/settings` - 更新系統設定
- `GET /api/promotion-settings` - 獲取促銷設定
- `PUT /api/promotion-settings` - 更新促銷設定

### 圖片管理
- `POST /api/upload` - 上傳圖片
- `GET /api/image/[id]` - 獲取圖片

## 🎯 促銷系統

### 免運費功能
- 可設定免運費門檻金額
- 訂單摘要會顯示距離免運費的差額

### 贈品功能
- 支援多層級贈品規則
- 可設定不同購買數量對應的贈品數量
- 自動計算並顯示贈品資訊

### 設定範例
```json
{
  "isFreeShippingEnabled": true,
  "freeShippingThreshold": 20,
  "isGiftEnabled": true,
  "giftRules": [
    {"threshold": 15, "quantity": 1},
    {"threshold": 20, "quantity": 2},
    {"threshold": 30, "quantity": 3}
  ],
  "giftProductName": "隨機送一瓶",
  "promotionText": "滿15送1瓶，滿20送2瓶，滿30送3瓶"
}
```

## 🚀 部署指南

### Vercel 部署 (前端)
1. 連接 GitHub 倉庫到 Vercel
2. 設定環境變數：
   - `DATABASE_URL` - PostgreSQL 連接字串
3. 自動部署

### Railway 部署 (後端)
1. 連接 GitHub 倉庫到 Railway
2. 新增 PostgreSQL 服務
3. 設定環境變數：
   - `DATABASE_URL` - 自動從 PostgreSQL 服務取得
4. 部署

## 📊 資料庫結構

### 主要表格
- **Customer** - 客戶資料
- **Order** - 訂單資訊
- **OrderItem** - 訂單項目
- **Menu** - 菜單項目
- **SystemSetting** - 系統設定
- **PromotionSetting** - 促銷設定
- **ImageStorage** - 圖片儲存

## 🛠️ 開發指令

```bash
# 開發模式
npm run dev

# 建置專案
npm run build

# 啟動生產模式
npm start

# 程式碼檢查
npm run lint

# Prisma 相關
npm run prisma:generate    # 生成 Prisma 客戶端
npm run prisma:migrate     # 執行資料庫遷移
npm run prisma:studio      # 開啟 Prisma Studio
```

## 🔍 故障排除

### 常見問題

1. **圖片無法顯示**
   - 檢查 `ImageStorage` 表格是否有資料
   - 確認圖片 API 路由正常運作

2. **促銷設定無法更新**
   - 確認 API 路由有 `export const dynamic = 'force-dynamic'`
   - 檢查 CORS 設定

3. **資料庫連接失敗**
   - 確認 `DATABASE_URL` 環境變數正確
   - 檢查資料庫服務是否正常

## 📝 更新日誌

### v0.1.0
- ✅ 基本訂單系統功能
- ✅ 管理員後台
- ✅ 促銷活動系統
- ✅ 圖片上傳與管理
- ✅ 響應式設計

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

此專案採用 MIT 授權條款。

## 📞 聯絡資訊

如有問題或建議，請透過 GitHub Issues 聯絡。

---

**Happy Coding! 🎉**

