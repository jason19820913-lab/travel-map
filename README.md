# ✈️ 旅行漫遊地圖 v2

漫畫風格旅行地圖網站，支援多國景點、行程規劃（含距離自動排序）與後台管理。

---

## 📁 檔案結構

```
travel-map/
├── index.html        ← 前台（給所有訪客瀏覽）
├── admin.html        ← 後台管理（你專用，密碼保護）
├── data.json         ← ★ 所有景點資料，只需更新這個檔案
├── css/
│   └── style.css
└── js/
    ├── data.js       ← 讀取 data.json
    ├── map.js        ← Leaflet 地圖與圖釘
    ├── planner.js    ← 行程規劃器（含距離排序）
    └── app.js        ← 主要邏輯
```

---

## 🚀 發佈到 GitHub Pages（首次設定）

### Step 1 — 建立 Repository

1. 登入 [github.com](https://github.com)
2. 右上角 `+` → `New repository`
3. Name: `travel-map`（可自訂）
4. 選 **Public**
5. 點 `Create repository`

### Step 2 — 上傳所有檔案

1. 在 repository 頁面點 `uploading an existing file`
2. 將整個 `travel-map/` 資料夾內的所有檔案和子資料夾拖進去
3. 確認 `data.json`、`index.html`、`admin.html`、`css/`、`js/` 都在根目錄下
4. 點 `Commit changes`

### Step 3 — 開啟 GitHub Pages

1. 點 repository 的 `Settings`
2. 左側 `Pages`
3. Source → `Deploy from a branch`
4. Branch → `main`，資料夾 → `/ (root)`
5. 點 `Save`

✅ 約 1-3 分鐘後，網站上線：
```
https://你的GitHub帳號.github.io/travel-map/
```

---

## 📝 更新景點（日常流程）

### 推薦方式：後台 → 下載 → 上傳

1. 瀏覽 `你的網址/admin.html`
2. 輸入密碼（預設 `travel2024`）
3. 新增或編輯景點
4. 點「⬇️ 下載 data.json」
5. 到 GitHub 的 `data.json` → 點鉛筆圖示 → 貼上新內容 → Commit
6. 幾分鐘後自動更新 ✅

### 進階方式：直接在 GitHub 上編輯 data.json

1. 到 GitHub repository → 點 `data.json`
2. 點右上角鉛筆圖示
3. 修改景點資料
4. 點 `Commit changes`

---

## 🗓️ 行程規劃功能說明

| 功能 | 操作 |
|------|------|
| 加入行程 | 點景點卡片的 ➕ 或地圖彈窗的「加行程」 |
| 新增一天 | 行程面板右上角「+ 加天」 |
| 重新命名天數 | 直接點天數標題文字編輯 |
| 手動排序 | 拖曳 ⠿ 把景點拖到想要的順序 |
| 跨天移動 | 直接拖曳景點到另一天的欄位 |
| 依距離排序 | 點每天的「🗺️ 排序」，或頂部「全部排序」 |
| 查看路線 | 點「🗺️ 排序」後地圖顯示動線折線 |
| 分享行程 | 點「🔗 分享行程」產生連結 |
| 匯出文字 | 點「📋 複製文字」 |

---

## 🔐 修改後台密碼

編輯 `data.json`：
```json
"site": {
  "adminPassword": "你的新密碼"
}
```
上傳到 GitHub 後即生效。

---

## 🗺️ 如何取得景點座標

**方法一（最快）**：在 Google Maps 對景點右鍵，第一行就是「緯度, 經度」，點一下複製。

**方法二**：後台新增景點表單中，點「📡 使用我的位置」可自動填入目前座標。

---

## 🎨 景點類型

| type 值 | 顯示 | 顏色 |
|---------|------|------|
| `sight` | 🏛️ 景點 | 藍色 |
| `restaurant` | 🍽️ 餐廳 | 橘色 |
| `nature` | 🌿 自然 | 綠色 |

---

## 💡 常見問題

**Q：手機上地圖太小？**  
CSS 已有 responsive 設計，手機上地圖在上、清單在下。

**Q：分享連結太長？**  
可用 [bit.ly](https://bit.ly) 或 [reurl.cc](https://reurl.cc) 縮短後分享。

**Q：地圖底圖可以換成 Google Maps 風格嗎？**  
目前使用 Stadia Maps（免費，無 API key）。若要換 Google Maps 底圖需要 API key，可在 `js/map.js` 修改圖磚來源。
