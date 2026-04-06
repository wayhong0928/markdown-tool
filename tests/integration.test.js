'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

test('整合測試：完整建置含 Mermaid 圖表', () => {
  const fixture = 'tests/fixtures/one-mermaid.md';
  const outDir = 'output/integration-test';
  const stem = 'mermaid-test';

  // 測試前清理
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

  // 執行 PDF 建置
  execSync(`node src/cli/build-cli.js ${fixture} --out ${outDir} --stem ${stem} --format pdf`, {
    stdio: 'pipe',
  });

  // 驗證 PDF 輸出存在
  const pdfFile = path.join(outDir, `${stem}.pdf`);
  assert.equal(fs.existsSync(pdfFile), true, 'PDF 輸出應存在');

  // 驗證檔案大小合理（PDF 應當有內容）
  const stats = fs.statSync(pdfFile);
  assert.ok(stats.size > 1000, 'PDF 檔案應有合理大小');
});

test('整合測試：不含 Mermaid 的建置應正常完成', () => {
  const fixture = 'tests/fixtures/no-mermaid.md';
  const outDir = 'output/integration-test-no-mermaid';
  const stem = 'no-mermaid-test';

  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

  execSync(`node src/cli/build-cli.js ${fixture} --out ${outDir} --stem ${stem} --format pdf`, {
    stdio: 'pipe',
  });

  const pdfFile = path.join(outDir, `${stem}.pdf`);
  assert.equal(fs.existsSync(pdfFile), true, 'PDF 應該存在，即使沒有圖表');
});

test('整合測試：複製 Markdown 轉換為 HTML', () => {
  const fixture = 'tests/fixtures/one-mermaid.md';
  const outDir = 'output/integration-test-html';
  const stem = 'html-test';

  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

  execSync(`node src/cli/build-cli.js ${fixture} --out ${outDir} --stem ${stem} --format html`, {
    stdio: 'pipe',
  });

  const htmlFile = path.join(outDir, `${stem}.html`);
  assert.equal(fs.existsSync(htmlFile), true, 'HTML 輸出應存在');

  // 驗證圖表被渲染，而且輸出為 Marp slide deck
  const html = fs.readFileSync(htmlFile, 'utf-8');
  assert.match(html, /diagram/, 'HTML 應參照圖表');
  assert.match(html, /<section[\s>]/, 'HTML 應輸出為 slide deck 內容');
});

test('整合測試：含 Mermaid 的建置可輸出 PPTX', () => {
  const fixture = 'tests/fixtures/one-mermaid.md';
  const outDir = 'output/integration-test-pptx';
  const stem = 'pptx-test';

  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

  execSync(`node src/cli/build-cli.js ${fixture} --out ${outDir} --stem ${stem} --format pptx`, {
    stdio: 'pipe',
  });

  const pptxFile = path.join(outDir, `${stem}.pptx`);
  assert.equal(fs.existsSync(pptxFile), true, 'PPTX 輸出應存在');

  const stats = fs.statSync(pptxFile);
  assert.ok(stats.size > 1000, 'PPTX 檔案應有合理大小');
});
