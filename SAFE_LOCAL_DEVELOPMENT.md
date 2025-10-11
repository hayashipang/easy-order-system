# 🛡️ 安全的本地開發指南

## ⚠️ 重要提醒
**雲端版本是生產版本，絕對不能修改！**  
本指南確保您在本地開發時不會影響到雲端版本。

## 🏗️ 本地開發架構

### 目前狀況
- **雲端版本**：穩定的生產版本（Vercel + Railway）
- **本地版本**：開發測試版本，使用雲端的 API 和數據

### 安全措施
1. **環境變數分離**：使用 `.env.local`（不會提交到 Git）
2. **Git 分支保護**：使用開發分支，避免直接修改 main
3. **API 指向雲端**：本地 UI 使用雲端的 API，確保數據一致性

## 🚀 本地開發設置

### 1. 創建本地環境檔案
```bash
# 複製環境變數範例
cp .env.local.example .env.local

# 編輯本地環境變數
nano .env.local
```

### 2. 本地環境變數設置
```bash
# .env.local 內容
NEXT_PUBLIC_API_URL=https://easy-order-system-production-0490.up.railway.app
NODE_ENV=development
PORT=4000
```

### 3. 啟動本地開發服務器
```bash
# 安裝依賴
npm install

# 啟動本地開發服務器（port 4000）
npm run dev
```

### 4. 訪問本地版本
- **本地開發**：http://localhost:4000
- **雲端版本**：您的 Vercel 網址

## 🔒 Git 分支策略

### 保護雲端版本
```bash
# 1. 創建開發分支
git checkout -b development

# 2. 在開發分支進行所有修改
git add .
git commit -m "本地 UI 修改"
git push origin development

# 3. 測試完成後，合併到 main（如果需要）
git checkout main
git merge development
git push origin main
```

### 分支說明
- **main 分支**：對應雲端版本，謹慎修改
- **development 分支**：本地開發分支，可以自由修改

## 🎯 開發工作流程

### 1. 本地 UI 開發
```bash
# 在 development 分支
git checkout development

# 修改 UI 檔案
# 例如：app/page.tsx, components/, styles/

# 本地測試
npm run dev
# 訪問 http://localhost:4000 測試
```

### 2. 測試與驗證
- ✅ 本地 UI 功能正常
- ✅ 與雲端 API 連接正常
- ✅ 數據顯示正確

### 3. 部署到雲端（謹慎操作）
```bash
# 只有在確認無誤後才執行
git checkout main
git merge development
git push origin main
# 這會觸發雲端自動部署
```

## 🛡️ 安全檢查清單

### 每次修改前
- [ ] 確認在 development 分支
- [ ] 確認 `.env.local` 存在且正確
- [ ] 確認不會修改 API 相關檔案

### 每次提交前
- [ ] 本地測試通過
- [ ] 與雲端 API 連接正常
- [ ] 沒有敏感資訊（API keys, 密碼等）

### 部署到雲端前
- [ ] 所有功能測試通過
- [ ] 沒有破壞性修改
- [ ] 備份重要數據

## 🚨 緊急情況處理

### 如果意外修改了雲端版本
1. **立即停止**：不要繼續修改
2. **檢查狀態**：`git status` 查看修改
3. **回滾修改**：`git checkout -- .` 撤銷修改
4. **聯繫支援**：如果已經推送到雲端

### 如果本地版本無法連接雲端 API
1. 檢查 `.env.local` 中的 API URL
2. 確認雲端 API 服務正常
3. 檢查網路連接

## 📞 支援

如果遇到問題：
1. 檢查本指南的常見問題
2. 查看 Git 狀態和分支
3. 確認環境變數設置

**記住：雲端版本是生產版本，安全第一！**
