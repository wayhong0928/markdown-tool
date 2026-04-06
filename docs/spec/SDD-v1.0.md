# AIASE 2026 - HW1: Markdown to Rich Output

> 歷史註記：本文件屬於 v1.0 設計快照，文中 `render-resume.js` 為舊名稱；現行實作於 v2.0 之後已改為 `src/steps/render-html.js`。

## 1. 專案簡介

本專案為生成式 AI 應用系統與工程 (AIASE 2026) 的第一份作業。主要目標是實踐「Decouple Content and Rendering (內容與呈現分離)」的軟體工程概念。

### 📄 內容主題

本專案的 `content.md` 定位為 **「綜合型技術與學術作品集 (Technical & Academic Portfolio)」**，內容涵蓋：

- **企業實習經歷**：資誠 (PwC Taiwan) 前端工程師實習，參與製造執行系統 (MES) 開發
- **系統開發專案**：ColorFour 服裝管理系統（大學畢業專題，獲系上複賽第一名）
- **學術研究方向**：生成式 AI 於數位學習之應用，聚焦認知負荷理論
- **跨領域實務**：EMT-1 緊急救護技術員認證與急救推廣經驗

### 🛠️ 渲染工具選用理由

建構支援多種格式輸出的自動化 Node.js 建置流程 (Build Pipeline)，並客製化中介轉換腳本：

| 工具                        | 用途                 | 選用理由                                                         |
| --------------------------- | -------------------- | ---------------------------------------------------------------- |
| **Marp CLI**                | 渲染 PDF / PPTX 簡報 | 原生支援 Markdown 語法、可自訂 CSS 主題、16:9 版面完美呈現       |
| **Marp CLI**                | 渲染靜態 HTML 網頁   | GitHub 風格排版、輕量快速、易於整合                              |
| **render-resume.js** (自製) | 中介轉換腳本         | 實現 YAML 樣式萃取、CSS 注入、資源自動配置，確保多格式視覺一致性 |

---

## 🚀 快速開始（一鍵執行）

> **適用環境**：Ubuntu/Debian 乾淨環境（可連網）
> **前置條件**：已安裝 Node.js v18+（可透過 `nvm install 18` 安裝）

```bash
# 1. 安裝系統依賴（中文字型 + Puppeteer/Chromium 依賴）
sudo apt-get update && sudo apt-get install -y \
  fonts-noto-cjk fonts-noto-cjk-extra \
  libnss3 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2

# 2. 安裝 Node.js 專案依賴
npm install

# 3. 執行渲染（產出 HTML, PDF, PPTX 至 output/）
npm run build:all

# 4. 驗證輸出（應看到 portfolio.html, portfolio.pdf, portfolio.pptx）
ls -la output/
```

**預期結果**：`output/` 目錄下產生 `portfolio.html`、`portfolio.pdf`、`portfolio.pptx` 三個檔案及 `assets/` 資源目錄。

---

## 2. 環境需求

### 作業系統

- ✅ Windows 10/11
- ✅ macOS 12+ (Monterey 或以上)
- ✅ Linux (Ubuntu 20.04+, Debian 11+)

### Runtime 環境

| 軟體    | 版本要求                        | 驗證指令  |
| ------- | ------------------------------- | --------- |
| Node.js | **v18.0.0 或以上**              | `node -v` |
| npm     | v9.0.0 或以上 (隨 Node.js 安裝) | `npm -v`  |

### Linux/macOS 額外系統依賴

Marp CLI 底層使用 Puppeteer (headless Chromium) 進行 PDF/PPTX 渲染，在部分 Linux 環境可能需要安裝額外依賴。

#### Ubuntu / Debian

```bash
# 安裝 CJK 中文字型（避免 PDF 中文顯示為方塊）
sudo apt-get update
sudo apt-get install -y fonts-noto-cjk fonts-noto-cjk-extra

# 安裝 Puppeteer/Chromium 所需系統依賴（若渲染失敗時執行）
sudo apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libcups2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libasound2
```

#### macOS

```bash
# macOS 通常內建中文字型，若有問題可透過 Homebrew 安裝
brew install --cask font-noto-sans-cjk
```

---

## 3. 安裝步驟

### Step 1：確認環境版本

```bash
# 確認 Node.js 版本 >= 18
node -v

# 確認 npm 版本
npm -v
```

### Step 2：安裝專案依賴

```bash
# Clone 專案後，進入專案目錄
cd hw1-markdown-creation-and-rendering-practice-wayhong0928

# 安裝所有定義於 package.json 中的渲染套件與開發環境依賴
npm install
```

安裝的主要套件：

| 套件名稱                    | 版本   | 用途                      |
| --------------------------- | ------ | ------------------------- |
| `@marp-team/marp-cli`       | ^4.2.3 | Markdown 轉 PDF/PPTX 簡報 |
| `@marp-team/marp-cli`       | ^4.2.3 | Markdown 轉 HTML 靜態網頁 |
| `jstransformer-markdown-it` | ^3.0.0 | Markdown 解析引擎         |

---

## 4. 執行渲染

本專案已將渲染邏輯封裝於 npm scripts 中，透過客製化的 Node.js 腳本自動處理 Markdown 語法過濾與跨平台轉檔。

### 一鍵建置（推薦）

```bash
# 執行完整自動化建置流程，產出 HTML, PDF, PPTX
npm run build:all
```

### 分步建置

```bash
# 僅產出 HTML 靜態網頁
npm run build:document

# 僅產出 PDF 與 PPTX 簡報
npm run build:presentation
```

### 建置流程說明

`npm run build:all` 內部執行順序：

1. **`build:document`** (`node render-resume.js`)
   - 讀取 `content.md` 並萃取 YAML front matter 中的自訂 CSS
   - 過濾 Marp 專屬語法，產出乾淨的 Markdown
  - 透過 Marp CLI 渲染為 HTML
   - 動態注入萃取的 CSS 樣式至 HTML
   - 自動複製 `assets/` 資源至輸出目錄

2. **`build:presentation`** (`marp content.md -o output/...`)
   - 使用 Marp CLI 將 Markdown 渲染為 16:9 簡報版面的 PDF
   - 使用 Marp CLI 將 Markdown 渲染為可編輯的 PPTX 簡報

---

## 5. 預期輸出

執行完畢後，所有編譯結果與靜態資源將自動匯集於 `output/` 目錄下：

| 檔案             | 格式   | 說明                                     |
| ---------------- | ------ | ---------------------------------------- |
| `portfolio.html` | HTML   | 靜態網頁文件，含自訂 CSS 樣式注入        |
| `portfolio.pdf`  | PDF    | 16:9 簡報版面文件，適合列印或分享        |
| `portfolio.pptx` | PPTX   | 動態簡報檔，可用 PowerPoint/Keynote 編輯 |
| `assets/`        | 資料夾 | 自動複製的靜態圖片資源                   |

### 輸出預覽

- **HTML**：GitHub 風格排版，支援響應式設計，可直接用瀏覽器開啟
- **PDF**：16:9 簡報版面，共 7 頁，含完整視覺樣式
- **PPTX**：可編輯簡報，保留原始排版與動畫效果

---

## 📁 專案結構

```
hw1-markdown-creation-and-rendering-practice-wayhong0928/
├── content.md          # 主要 Markdown 內容（作品集原始碼）
├── README.md           # 本說明文件
├── render-resume.js    # 自製 HTML 渲染腳本（跨平台相容）
├── package.json        # npm 專案設定與 scripts 定義
├── assets/
│   └── profile.jpg     # 個人照片資源
└── output/
    ├── portfolio.html  # 輸出：靜態網頁
    ├── portfolio.pdf   # 輸出：PDF 簡報
    ├── portfolio.pptx  # 輸出：PowerPoint 簡報
    └── assets/         # 輸出：複製的靜態資源
```

---

## 🔧 疑難排解

### PDF/PPTX 中文字型顯示異常

**症狀**：中文字顯示為方塊或亂碼

**解決方案**：安裝 CJK 字型

```bash
# Ubuntu/Debian
sudo apt-get install -y fonts-noto-cjk

# macOS
brew install --cask font-noto-sans-cjk
```

### Marp CLI 渲染失敗

**症狀**：出現 Chromium/Puppeteer 相關錯誤

**解決方案**：安裝系統依賴

```bash
# Ubuntu/Debian
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 libgbm1

# 若在 Docker/CI 環境，可能需要額外設定 sandbox
export PUPPETEER_ARGS='--no-sandbox --disable-setuid-sandbox'
```

### Node.js 版本過低

**症狀**：`npm install` 或 `npm run build:all` 出現語法錯誤

**解決方案**：升級 Node.js 至 v18+

```bash
# 使用 nvm 管理 Node.js 版本
nvm install 18
nvm use 18
```

---

## 6. 參考資料

### 工具官方文件

- [Marp CLI - Official Documentation](https://github.com/marp-team/marp-cli)
- [Marp - Markdown Presentation Ecosystem](https://marp.app/)
- [Marp CLI - Official Documentation](https://github.com/marp-team/marp-cli)
- [Node.js - Official Website](https://nodejs.org/)

### 相關技術資源

- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)
- [Google Noto CJK Fonts](https://fonts.google.com/noto/fonts?query=noto+sans+tc)

---

## 🤖 AI 協作聲明

本專案之核心經歷、創意與邏輯架構皆為個人真實原創故事。在以下環節使用生成式 AI 輔助：

- 自動化渲染腳本 (`render-resume.js`) 的除錯與優化
- CSS 視覺排版語法建議
- README 跨平台相容性說明撰寫

特此聲明。
