# 發佈指南

## 版本號規則

採簡化的語義版本：

- v2.x.x：小功能補充、bug 修復
- v3.x.x：重大功能或架構升級

示例：v2.0.0 是目前版本。

## 發佈前檢查清單

1. **本地驗證**
   ```bash
   npm test
   npm run audit:prod
   npm run build:sample -- --format pdf
   ```

2. **提交訊息 Commit Message**
   - feat: 新功能（例如 feat: add PDF password protection）
   - fix: bug 修復（例如 fix: handle duplicate mermaid blocks correctly）
   - docs: 文件改動
   - chore: 建置、依賴等改動

3. **更新版本和 Changelog**
   ```bash
   # 編輯 package.json version 欄位
   # 新增條目到 CHANGELOG.md
   ```

4. **Git 流程**
   ```bash
   git add .
   git commit -m "bump: v2.1.0 - add feature X"
   git tag v2.1.0
   git push origin main
   git push origin v2.1.0
   ```

## 簡單示例

若修復 Mermaid 重複區塊的渲染問題，提交過程：

```bash
# 1. 修復程式碼 + 測試
npm test  # 確保通過

# 2. 更新版本
# package.json: version: "2.0.1"
# CHANGELOG.md: 新增 [2.0.1] 條目

# 3. 提交
git add .
git commit -m "fix: resolve duplicate mermaid block replacement"
git tag v2.0.1
git push
```
