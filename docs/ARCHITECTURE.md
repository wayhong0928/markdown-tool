# 專案架構說明 (v2.0)

## 目錄結構

```
markdown-tool/
├── src/                      # 核心模組（生產程式碼）
│   ├── cli/
│   │   └── build-cli.js      # CLI 入口 - 參數解析 + 建置流程編排
│   ├── steps/
│   │   ├── preprocess-mermaid.js    # 前置處理：Mermaid block → PNG
│   │   └── render-html.js           # HTML 渲染：Markdown → HTML + CSS 注入
│   └── utils/
│       └── helpers.js               # 共用工具函式
│
├── tests/                    # 測試套件
│   ├── build-cli.test.js            # CLI 參數解析單元測試
│   ├── preprocess-mermaid.test.js   # Mermaid 前處理單元測試
│   ├── integration.test.js          # 整合測試 (PDF/HTML 完整流程)
│   ├── smoke-html-build.test.js     # HTML 煙霧測試
│   └── fixtures/                    # 測試資料
│       ├── no-mermaid.md
│       ├── one-mermaid.md
│       ├── duplicate-mermaid-blocks.md
│       └── invalid-mermaid.md
│
├── docs/                     # 文件
│   ├── spec/                        # 規格文件
│   │   ├── SDD-v2.0.md      # 系統設計文件 (v2.0)
│   │   ├── SDD-v1.0.md      # 系統設計文件 (v1.0, 歷史參考)
│   ├── ARCHITECTURE.md      # 本文件 - 專案結構說明
│   ├── PROJECTIZATION_PLAN.md       # v3.0 路線規劃
│
├── data/                     # Markdown 資料目錄
│
├── assets/                   # 靜態資源
│   ├── css/                 # 自訂樣式檔
│   ├── fonts/               # 中文字型
│   └── diagrams/            # Mermaid 渲染 PNG (自動生成)
│
├── output/                   # 建置產物（自動生成）
├── .github/workflows/        # CI/CD 流程
│   └── ci.yml               # GitHub Actions 工作流程
│
├── package.json             # 依賴定義 + npm scripts
├── package-lock.json        # 依賴鎖定檔
├── .gitignore               # Git 忽略清單
├|| CHANGELOG.md             # 版本歷史 (維護者指南)
├── RELEASE.md               # 發布指南 (維護者指南)
└── README.md                # 主入口文件
```

---

## 建置流程 (v2.0)

### 單檔轉檔流程

````
<任意 input.md>  (例：data/report.md)
         │
         ▼
[src/cli/build-cli.js]  ← 統一入口
    ├─ 解析 --out / --stem / --format 參數
    ├─ 驗證輸入檔案與格式
    └─ 調度 preprocess-mermaid.js 與轉檔工具
         │
         ▼
[src/steps/preprocess-mermaid.js]
    ├─ extractMermaidBlocks()  ← 掃描 ```mermaid 區塊
    ├─ renderDiagram()         ← mmdc (Mermaid CLI) 轉 PNG
    ├─ replaceMermaidBlocksWithImages()  ← 替換為 ![image](path)
  └─ 輸出：output/.work/_temp_render.md + output/assets/diagrams/*.png
         │
         ▼
output/.work/_temp_render.md
    │
    ├─→ [marp-cli] ──────────────→ output/report.pdf    (PDF 簡報)
    ├─→ [marp-cli] ──────────────→ output/report.pptx   (PPTX 簡報)
    │
    └─→ [src/steps/render-html.js]
         ├─ extractCustomStyles()     ← 萃取 YAML front matter 樣式
          ├─ Marp CLI                  ← 轉換 Markdown → HTML
         ├─ 注入自訂 CSS
         └─ 複製 assets/ 目錄
            │
            ▼
            output/report.html (靜態 HTML 網頁)

清除 output/.work ✓
````

---

## 核心模組說明

### src/cli/build-cli.js

**職責**：CLI 參數解析 + 建置流程編排

```javascript
// 匯出函式
parseArgs(args); // 解析 --out, --stem, --format 等參數
validateFormats(formats); // 驗證格式合法性
main(cliOptions); // 主要建置邏輯
```

**使用方式**：

```bash
node src/cli/build-cli.js data/slides.md --out myoutput --format pdf
npm run build -- data/report.md --format html,pdf
```

### src/steps/preprocess-mermaid.js

**職責**：Mermaid block 前處理 (block → PNG)

````javascript
// 關鍵函式
extractMermaidBlocks(content); // 掃描 ```mermaid 區塊
renderDiagram(options); // 呼叫 mmdc 轉圖
replaceMermaidBlocksWithImages(content, imagePaths); // 替換區塊
preprocessMermaid(options); // 主導出函式
````

**特色**：

- 支援多個 Mermaid 區塊的正確順序替換（避免全域副作用）
- 若渲染失敗，保留原始區塊作為降級方案
- 生成 PNG 存儲於 `assets/diagrams/diagram-N.png`

### src/steps/render-html.js

**職責**：Markdown → HTML，含 CSS 注入

```javascript
// 關鍵函式
extractCustomStyles(content); // 從 YAML front matter 萃取 <style>
renderHtml(options); // 主要 HTML 渲染邏輯
```

**流程**：

1. 清洗 YAML front matter（移除 Marp 專屬語法）
2. 呼叫 Marp CLI 轉換 Markdown → HTML
3. 提取自訂 CSS 並注入 `<head>`
4. 複製 `assets/` 目錄至輸出位置

---

## 測試架構

### 測試分類

| 檔案                       | 類型 | 覆蓋                       | 輸出格式              |
| -------------------------- | ---- | -------------------------- | --------------------- |
| build-cli.test.js          | 單元 | parseArgs, validateFormats | —                     |
| preprocess-mermaid.test.js | 單元 | 提取/替換 Mermaid 區塊     | —                     |
| integration.test.js        | 整合 | 完整 PDF/HTML 流程         | 🗂️ output/            |
| smoke-html-build.test.js   | 煙霧 | HTML 建置驗證              | 🗂️ output/test-smoke/ |

### 執行方式

```bash
# 運行所有測試
npm test

# 檢查測試產物
ls -la output/
```

### Fixtures（測試資料）

- `no-mermaid.md`：純文字，無 Mermaid 區塊
- `one-mermaid.md`：單一 Mermaid 區塊
- `duplicate-mermaid-blocks.md`：多個 Mermaid 區塊（測試順序正確性）
- `invalid-mermaid.md`：不合法 Mermaid 語法（測試錯誤處理）

---

## npm Scripts

| 指令                   | 用途                                     |
| ---------------------- | ---------------------------------------- |
| `npm run build`        | 直接叫用 CLI（需提供檔案路徑）           |
| `npm run build:html`   | 僅輸出 HTML                              |
| `npm run build:pdf`    | 僅輸出 PDF                               |
| `npm run build:pptx`   | 僅輸出 PPTX                              |
| `npm run build:all`    | 轉檔 content.md 到三種格式               |
| `npm run build:sample` | 快速預覽 content.example.md              |
| `npm test`             | 執行所有測試                             |
| `npm run clean`        | 清除 output/, assets/diagrams/, 臨時檔等 |
| `npm run audit`        | 完整依賴檢查（含 dev）                   |
| `npm run audit:prod`   | 正式環境依賴檢查                         |

---

## 安全性設定

### npm Overrides (package.json)

v2.0 通過 `overrides` 固定特定依賴版本，確保 0 vulnerabilities：

```json
{
  "overrides": {
    "@mermaid-js/mermaid-cli": {
      "puppeteer": {
        "tar-fs": "2.1.4",
        "ws": "8.17.1"
      }
    }
  }
}
```

**驗證方式**：

```bash
npm run audit:prod
# 預期輸出：found 0 vulnerabilities
```

---

## 環境需求

| 軟體    | 版本    | 驗證      |
| ------- | ------- | --------- |
| Node.js | ≥18.0.0 | `node -v` |
| npm     | ≥9.0.0  | `npm -v`  |

### 中文字型支援

- **macOS**：通常內建
- **Windows**：通常內建
- **Linux (Ubuntu/Debian)**：

```bash
sudo apt-get install fonts-noto-cjk fonts-noto-cjk-extra
```

---

## 效能優化方向（v3.0）

- [ ] Watch mode（檔案變更自動重建）
- [ ] 批量處理目錄
- [ ] 快取 Mermaid 渲染結果（避免重複轉圖）
- [ ] 並行處理多檔案
- [ ] 自訂 Mermaid 主題與配置

---

## 相關文件

- [README.md](../README.md) — 使用者指南
- [docs/spec/SDD-v2.0.md](spec/SDD-v2.0.md) — 系統設計文件
- [docs/PROJECTIZATION_PLAN.md](PROJECTIZATION_PLAN.md) — v3.0 路線規劃
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) — CI/CD 工作流
