# markdown-tool

> 以 Markdown 為單一來源，一鍵輸出 HTML、PDF、PPTX — 支援 Mermaid 圖表、自訂 CSS 注入、CJK 中文字型

本工具實踐「**內容與呈現分離 (Decouple Content and Rendering)**」的核心理念：你只需維護一份 Markdown，即可自動產生三種格式的文件。

---

## Features

| 功能 | v1 | v2（當前） |
| --- | :---: | :---: |
| Markdown → HTML 投影片（Marp slide deck） | ✅ | ✅ |
| Markdown → PDF (16:9 簡報) | ✅ | ✅ |
| Markdown → PPTX (可編輯簡報) | ✅ | ✅ |
| YAML front matter 樣式萃取與注入 | ✅ | ✅ |
| **指定任意檔案路徑轉檔** | ❌ | ✅ |
| **Mermaid 圖表渲染** | ❌ | ✅ |
| CJK 中文字型支援 | ✅ | ✅ |

---

## Quick Start

```bash
# 1. 安裝依賴（含 Mermaid CLI）
npm install

# 2. 透過 npm script 快速轉檔
npm run build -- data/slides.md

# 或直接呼叫 CLI
node src/cli/build-cli.js data/slides.md

# 輸出至 output/slides.html, output/slides.pdf, output/slides.pptx
```

> **環境需求**：Node.js v18+  
> **完整架構說明**：見 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Installation

### 系統需求

| 軟體 | 版本 | 驗證指令 |
| --- | --- | --- |
| Node.js | v18.0.0+ | `node -v` |
| npm | v9.0.0+ | `npm -v` |

### Linux / macOS 額外依賴

Marp 與 Mermaid CLI 底層皆使用 Puppeteer（headless Chromium），部分 Linux 環境需額外安裝：

```bash
# Ubuntu / Debian — CJK 字型 + Chromium 系統依賴
sudo apt-get update && sudo apt-get install -y \
  fonts-noto-cjk fonts-noto-cjk-extra \
  libnss3 libatk-bridge2.0-0 libcups2 \
  libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2

# macOS（通常內建中文字型，有問題時使用）
brew install --cask font-noto-sans-cjk
```

### 安裝套件

```bash
npm install
```

| 套件 | 版本 | 用途 |
| --- | --- | --- |
| `@marp-team/marp-cli` | ^4.2.3 | Markdown → PDF / PPTX |
| `@mermaid-js/mermaid-cli` | ^10.9.1 | Mermaid 圖表 → PNG |

---

## Usage

### 基本指令

```bash
# 轉換指定檔案（全格式輸出）
npm run build -- <input.md> [options]

# 或直接使用 CLI
node src/cli/build-cli.js <input.md> [options]

# 範例：轉換 data/ 下的檔案
npm run build -- data/slides.md
npm run build -- data/report.md --out output/report --stem report

# 僅輸出特定格式
npm run build:html -- data/note.md
npm run build -- data/note.md --format pdf,pptx

# 清除所有建置產出
npm run clean
```

### Options

| 參數 | 說明 | 預設值 |
| --- | --- | --- |
| `--out, -o <dir>` | 輸出目錄 | `output` |
| `--stem, -s <name>` | 輸出檔名主幹 | 取自輸入檔名 |
| `--format <list>` | 輸出格式（逗號分隔：`html,pdf,pptx`） | `html,pdf,pptx` |
| `--help, -h` | 顯示說明 | — |

### npm scripts 捷徑

```bash
# 舊版相容：轉換 content.md（需存在於根目錄）
npm run build:all

# 帶參數的快速呼叫
npm run build -- data/slides.md
npm run build:html -- data/note.md

# 執行測試
npm test

# 僅檢查正式環境依賴安全
npm run audit:prod
```

### 建置流程（v2.0）

```text
<input.md>  (例：data/slides.md)
    │
    ▼
[src/cli/build-cli.js]  ← 統一入口 (解析參數、驗證)
    │
    ▼
[src/steps/preprocess-mermaid.js]  ← Mermaid block → PNG
    ├─ 掃描 ```mermaid 區塊
    ├─ 呼叫 mmdc 渲染為 PNG → assets/diagrams/
    └─ 輸出 ._temp_render.md（已替換為圖片路徑）
    │
    ▼
._temp_render.md
    │
    ├─ [src/steps/render-html.js] ─────► output/<stem>.html
    │      ├─ 由 Marp 直接輸出 slide deck HTML
    │      ├─ 套用 YAML front matter 的樣式設定
    │      └─ 複製 assets/ 至輸出目錄
    │
    ├─ [marp CLI] ────────────────────► output/<stem>.pdf
    └─ [marp CLI] ────────────────────► output/<stem>.pptx
    │
    ▼
清除 ._temp_render.md ✓
```

---

## Project Structure

```text
markdown-tool/
├── src/
│   ├── cli/
│   │   └── build-cli.js           # 統一 CLI 入口 (v2.0)
│   └── steps/
│       ├── preprocess-mermaid.js  # Mermaid block → PNG
│       └── render-html.js         # HTML 渲染 + CSS 注入
│
├── tests/                  # Node 內建 test runner 套件
│   ├── *.test.js
│   └── fixtures/          # 測試資料
│
├── docs/
│   ├── ARCHITECTURE.md    # 專案架構說明
│   ├── PROJECTIZATION_PLAN.md    # v3.0 路線規劃
│   ├── spec/
│   │   ├── SDD-v2.0.md           # 系統設計文件
│   │   ├── SDD-v1.0.md           # 歷史參考
│
├── data/                   # Markdown 原始內容
│
├── assets/                 # 靜態資源
│   ├── css/
│   ├── fonts/
│   └── diagrams/           # Mermaid 渲染 PNG（build artifact）
│
├── .github/workflows/
│   └── ci.yml              # GitHub Actions CI（Node 18 gate + Node 20 compatibility）
│
├── package.json
├── .gitignore
├── CHANGELOG.md            # 版本記錄
├── RELEASE.md              # 發佈指南
├── README.md               # 本檔案
├── content.example.md      # 格式範例
│
└── output/                 # 建置輸出（build artifact）
```

---

## Troubleshooting

### PDF/PPTX 中文顯示為方塊

```bash
# Ubuntu/Debian
sudo apt-get install -y fonts-noto-cjk

# macOS
brew install --cask font-noto-sans-cjk
```

### Marp CLI 或 mmdc 渲染失敗（Chromium/Puppeteer 錯誤）

```bash
# 安裝系統依賴
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 libgbm1

# Docker / CI 環境
export PUPPETEER_ARGS='--no-sandbox --disable-setuid-sandbox'
```

### Mermaid 圖表渲染失敗但流程繼續

`preprocess-mermaid.js` 採「失敗不中斷」策略：渲染失敗的圖表會保留原始 code block，其餘正常繼續。請查看 terminal 的 ❌ 訊息修正語法後重新執行。

### Node.js 版本過低

```bash
nvm install 18 && nvm use 18
```

---

## Roadmap

- **v1**：Markdown → HTML / PDF / PPTX，固定讀取 `content.md`
- **v2**（當前）：任意路徑輸入、Mermaid 圖表渲染、單一 data/ 資料區

---

## References

- [Marp CLI](https://github.com/marp-team/marp-cli)
- [Mermaid](https://mermaid.js.org/)
- [mermaid-js/mermaid-cli](https://github.com/mermaid-js/mermaid-cli)
- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)

---

## Architecture Planning

- [Projectization Plan](docs/PROJECTIZATION_PLAN.md)
- [System Design](docs/spec/SDD-v2.0.md)
