# SDD v2.0：Mermaid 支援 + 任意路徑輸入

> 本文件記錄 markdown-tool v2.0 的系統設計，內容已對齊目前實作（`src/cli/build-cli.js`、`src/steps/*`）。

---

## 1. 版本目標

| 版本 | 目標 |
| --- | --- |
| **v1.0** | 固定讀取 `content.md`，輸出 HTML / PDF / PPTX |
| **v2.0** | 任意路徑輸入、Mermaid 圖表渲染、單一 data/ 資料區 |

---

## 2. 問題陳述

### 2.1 Mermaid 支援缺失

v1.0 下，Mermaid 常顯示為 code block 或空白。

**解法**：在 pipeline 前端增加前處理，將 Mermaid block 預先渲染為 PNG，後續輸出流程只需處理標準圖片標記。

### 2.2 路徑硬編碼

v1.0 的流程綁定固定輸入，不利於多檔案情境。

**解法**：改由 `src/cli/build-cli.js` 作為統一入口，所有步驟以 CLI 參數接收輸入/輸出設定。

### 2.3 資料管理簡化

公開/私有資料分區會增加治理成本。

**解法**：統一使用 `data/` 作為 Markdown 原始檔集中區。

---

## 3. 架構對比

### v1.0 Pipeline

```text
content.md（固定）
    ├─→ [legacy html step]  →  output/portfolio.html
    └─→ [Marp CLI]          →  output/portfolio.pdf
                            →  output/portfolio.pptx
```

### v2.0 Pipeline

```text
<任意 input.md>
    │
    ▼
[src/cli/build-cli.js]  ← 統一入口，解析 CLI 參數
    │
    ▼
[src/steps/preprocess-mermaid.js]  ← Mermaid block → PNG
    │  input:  <input.md>
    │  output: output/<out>/.work/_temp_render.md
    │          output/<out>/assets/diagrams/diagram-N.png
    ▼
output/<out>/.work/_temp_render.md
    │
    ├─→ [src/steps/render-html.js]  →  output/<stem>.html
    └─→ [Marp CLI]                  →  output/<stem>.pdf
                                    →  output/<stem>.pptx
    │
    ▼
清除 output/<out>/.work
```

---

## 4. 元件規格

### 4.1 `src/cli/build-cli.js` — 統一入口

#### CLI 介面

```text
node src/cli/build-cli.js [options] <input.md>

Options:
  --out,  -o <dir>       輸出目錄（預設 output）
  --stem, -s <name>      輸出檔名主幹（預設取自輸入檔名）
  --format   <list>      輸出格式：html,pdf,pptx（預設全部）
  --help, -h             顯示說明
```

#### 職責

1. 解析 CLI 參數
2. 驗證輸入檔存在與格式合法
3. 依序呼叫 Mermaid 前處理、HTML 渲染、PDF/PPTX 輸出
4. 清除暫存目錄 `output/<out>/.work`

#### 設計決策

- 外部命令以參數化子程序執行（`spawnSync`），避免 shell 字串拼接風險。

### 4.2 `src/steps/preprocess-mermaid.js` — Mermaid 前處理

#### CLI 介面（Mermaid 前處理）

```text
node src/steps/preprocess-mermaid.js <input.md> <output.md>
```

#### IPO 規格

| | 說明 |
| --- | --- |
| **Input** | 任意 Markdown，可含零到多個 Mermaid fence block |
| **Output** | 處理後 Markdown + `output/<out>/assets/diagrams/diagram-N.png` |

#### 處理流程

1. 掃描 Mermaid fence block（支援最多 3 個前導空白）
2. 無 Mermaid 時直接複製原始檔
3. 有 Mermaid 時逐一渲染：
    - 寫入暫存 `.mmd`
    - 呼叫 `npx mmdc` 渲染 PNG
    - 刪除暫存 `.mmd`
    - 將 code block 替換為相對路徑圖片標記（例如 `../assets/diagrams/diagram-N.png`）
    - 單張渲染失敗時保留原 block，流程不中斷
4. 輸出處理後 Markdown

### 4.3 `src/steps/render-html.js` — HTML 渲染

#### CLI 介面（HTML 渲染）

```text
node src/steps/render-html.js <input.md> <output-dir> [stem]
```

#### HTML 渲染職責

- 呼叫 Marp 產出 slide deck HTML
- 複製 `assets/` 到輸出目錄
- 回傳輸出檔案路徑

---

## 5. 資料目錄結構

```text
data/
└── ...       # Markdown 原始檔集中存放
```

`.gitignore` 規則：

```text
output/          # 建置產出
assets/diagrams/ # Mermaid 渲染圖（build artifact）
output/**/.work/ # 建置暫存目錄
```

---

## 6. 新增套件

| 套件 | 版本 | 用途 |
| --- | --- | --- |
| `@mermaid-js/mermaid-cli` | ^10.9.1 | `mmdc` CLI，Puppeteer-based Mermaid 渲染 |

---

## 7. npm scripts

| Script | 指令 | 說明 |
| --- | --- | --- |
| `build` | `node src/cli/build-cli.js` | 接受任意參數，轉發給 CLI |
| `build:html` | `node src/cli/build-cli.js --format html` | 同上，鎖定 HTML |
| `build:pdf` | `node src/cli/build-cli.js --format pdf` | 同上，鎖定 PDF |
| `build:pptx` | `node src/cli/build-cli.js --format pptx` | 同上，鎖定 PPTX |
| `build:all` | `node src/cli/build-cli.js content.md` | v1.0 相容捷徑 |
| `clean` | inline node | 清除 output/、assets/diagrams/、暫存檔 |

---

## 8. 向下相容性保證

| 驗收項目 | v1.0 | v2.0 | 相容 |
| --- | --- | --- | :---: |
| `npm run build:all` 存在且可執行 | ✅ | ✅ | ✅ |
| 無 Mermaid 的 Markdown → HTML | ✅ | ✅ | ✅ |
| 無 Mermaid 的 Markdown → PDF | ✅ | ✅ | ✅ |
| 無 Mermaid 的 Markdown → PPTX | ✅ | ✅ | ✅ |
| 含 Mermaid → 三種格式顯示圖表 | ⚠️ 空白 | ✅ | ✅（改善） |
| 輸出目錄為 `output/` | ✅ | ✅（預設） | ✅ |
| 輸出檔名包含 `portfolio.*` | ✅ | ✅（預設 stem） | ✅ |

---

## 9. v2.0 驗收與驗證

### 9.1 核心需求達成

- ✅ 任意路徑輸入與 CLI 參數化（`--out`、`--stem`、`--format`）
- ✅ Mermaid 前處理渲染後可輸出至 HTML / PDF / PPTX
- ✅ 資料區集中於 `data/`

### 9.2 測試覆蓋現況

- ✅ 單元測試：CLI 參數解析與格式驗證
- ✅ 單元測試：Mermaid 區塊提取、替換、縮排 fence 相容
- ✅ 整合測試：PDF / HTML / PPTX 建置流程
- ✅ 煙霧測試：HTML 輸出建置

### 9.3 安全性驗證

- ✅ `npm run audit:prod` 可作為正式依賴安全檢查入口
