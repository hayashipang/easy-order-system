#!/bin/bash

echo "🚀 開始 Railway 部署流程..."

echo "📡 運行 Prisma 遷移..."
npx prisma migrate deploy

echo "🔨 生成 Prisma 客戶端..."
npx prisma generate

echo "🔧 修復資料庫設定..."
npm run railway:fix

echo "🎉 啟動應用程式..."
npm start
