# 更動日誌

## [2.0.0] - 2026-04-06

### 新增
- 任意路徑輸入：可指定 `data/` 或任何路徑下的 markdown 檔案進行轉檔
- Mermaid 圖表支援：```mermaid 區塊在 HTML/PDF/PPTX 三種格式中自動渲染
- 單一 data/ 資料區：所有 Markdown 原始檔集中管理，簡化文件結構
- 專案化架構：src/ 分層模組，便於維護和測試

### 改動
- 重構三個核心腳本為分層模組（CLI、步驟、工具函式）
- 保留根目錄腳本作為相容入口，既有命令無需改變

### 安全
- 完整 npm audit 達到 0 vulnerabilities（透過 overrides 修補 transitive 依賴）

---

## [1.0.0] - 早期版本

- 固定讀取 content.md
- 支援 HTML / PDF / PPTX 輸出
- 支援 CJK 字體與自訂 CSS 注入
- 詳細資料請查看 [SDD-v2.0](docs/spec/SDD-v2.0.md)
