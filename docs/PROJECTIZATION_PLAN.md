# markdown-tool 專案化藍圖

> 文件狀態：v3.0 規劃草案（已依目前 v2.0 實作名稱校正）

## 目標

在不破壞既有行為（HTML / PDF / PPTX 輸出）的前提下，將目前腳本型工具升級為可維護、可測試、可持續發布的專案。

## 現況基線

- 入口腳本：src/cli/build-cli.js
- Mermaid 前處理：src/steps/preprocess-mermaid.js
- HTML 渲染：src/steps/render-html.js
- 輸出格式：HTML、PDF、PPTX
- 依賴安全：npm audit 已可達 0 vulnerabilities

## 建議專案架構模式

### 模式 A：分層式 Pipeline（建議先採用）

適合目前專案：改動小、風險低、可逐步重構。

```text
src/
├─ cli/
│  └─ index.js              # 參數解析、命令入口
├─ app/
│  └─ build-service.js      # 組裝整個建置流程
├─ pipeline/
│  ├─ preprocess-mermaid.js # Mermaid 區塊處理
│  ├─ render-html.js        # HTML 步驟
│  ├─ render-pdf.js         # PDF 步驟
│  └─ render-pptx.js        # PPTX 步驟
├─ domain/
│  ├─ models.js             # BuildOptions / BuildResult
│  └─ errors.js             # 錯誤分類與代碼
└─ infra/
   ├─ fs.js                 # 檔案操作封裝
   └─ process.js            # 外部命令呼叫封裝
```

### 模式 B：Hexagonal / Ports and Adapters（中長期）

適合未來要做插件化（例如支援 PlantUML、Kroki、watch mode、雲端渲染）的情境。

- Core：只保留「文件轉檔流程」與「策略決策」
- Port：RendererPort、DiagramPreprocessorPort
- Adapter：MarpAdapter、MermaidCliAdapter、HtmlRendererAdapter

建議：現在先採模式 A，等測試體系完成後再演進到模式 B。

## 專案目錄與文件治理

```text
markdown-tool/
├─ src/
├─ tests/
├─ docs/
│  ├─ spec/
│  ├─ ARCHITECTURE.md
│  └─ PROJECTIZATION_PLAN.md
├─ data/         # Markdown 原始資料集中放置
└─ output/       # build artifact，不入版控
```

## 設計原則

1. 單一責任：每個步驟只做一件事
2. 可重試：每個步驟可獨立重跑
3. 可觀測：所有步驟有一致的 log 前綴與錯誤代碼
4. 可測試：核心邏輯不直接依賴 shell 命令
5. 向下相容：保留現有 CLI 用法與 npm scripts

## 測試策略

三層測試：

1. 單元測試：參數解析、Mermaid 區塊替換、YAML style 萃取
2. 整合測試：以 fixture Markdown 跑完整 pipeline
3. 煙霧測試：CI 執行 HTML/PDF/PPTX 基本命令

建議 fixture：

- no-mermaid.md
- one-mermaid.md
- duplicate-mermaid-blocks.md
- invalid-mermaid.md

## 遷移路線（低風險）

### Phase 1：穩定化（已完成）

- 補齊安全修補策略
- 補齊稽核 scripts

### Phase 2：模組化

- 將腳本穩定在 `src/cli` 與 `src/steps`（已完成）
- 逐步抽取可重用模組（持續進行）

### Phase 3：契約化

- 定義 BuildOptions / BuildResult
- 統一錯誤碼與輸出格式

### Phase 4：產品化

- CI gate（audit、test、build smoke）
- changelog 與發布規範

## 近期可執行工作

1. 建立 src/ 與 wrapper，不改功能。
2. 導入測試框架並建立首批 fixture。
3. 修正 Mermaid 重複區塊替換策略，避免 split/join 全域副作用。
4. 新增 CI workflow，至少包含 `npm ci`、`npm run audit:prod`、`npm run build:sample`。
