'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getNpxCommand() {
  return 'npx';
}

function maybeBreakpoint(label) {
  const breakpoint = process.env.MARKDOWN_TOOL_BREAKPOINT;
  if (breakpoint === '1' || breakpoint === label) {
    debugger;
  }
}

function copyDir(src, dest, options = {}) {
  const { ignoreTopLevelDirs = new Set() } = options;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (ignoreTopLevelDirs.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function extractCustomStyles(content) {
  const yamlMatch = content.match(/^---\s*\n([\s\S]+?)\n---/);
  if (!yamlMatch) return '';
  const styleMatch = yamlMatch[1].match(/style:\s*\|\s*\n([\s\S]+?)(?=\n---|\n\S+:|$)/);
  if (!styleMatch) return '';
  return styleMatch[1]
    .split('\n')
    .map((line) => line.replace(/^  /, ''))
    .join('\n')
    .trim();
}

function renderHtml(options) {
  const {
    inputFile,
    outputDir = 'output',
    stem = 'portfolio',
    logger = console,
  } = options;

  const outputHtml = path.join(outputDir, `${stem}.html`);

  logger.log('🚀 開始執行 HTML 靜態文件渲染管線...');
  logger.log(`📥 輸入：${inputFile}`);
  logger.log(`📤 輸出：${outputHtml}\n`);

  maybeBreakpoint('render-html:start');

  if (!fs.existsSync(inputFile)) {
    throw new Error(`找不到輸入檔：${inputFile}`);
  }
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  logger.log('-> [1/3] 以 Marp 產出 slide deck HTML...');
  const result = spawnSync(
    getNpxCommand(),
    ['marp', inputFile, '--output', outputHtml, '--allow-local-files', '--html', '--no-stdin'],
    { stdio: 'inherit', shell: process.platform === 'win32' }
  );
  if (result.error || result.status !== 0) {
    if (result.error) {
      throw new Error(result.error.message);
    }
    throw new Error(`marp exited with code ${result.status}`);
  }

  logger.log('-> [2/3] 保留 Markdown front matter 的樣式設定...');
  logger.log('   ✓ 由 Marp 直接套用投影片樣式');

  logger.log('-> [3/3] 複製 assets/ 資料夾...');
  if (fs.existsSync('assets')) {
    // Keep rendered diagrams generated under output/assets/diagrams as the source of truth.
    copyDir('assets', path.join(outputDir, 'assets'), { ignoreTopLevelDirs: new Set(['diagrams']) });
    logger.log('   ✓ assets 資料夾已複製');
  }

  logger.log('\n✅ HTML 渲染完成！');
  logger.log(`   📂 輸出位置：${outputHtml}`);

  return outputHtml;
}

function main(argv) {
  const inputFile = argv[0] || 'content.md';
  const outputDir = argv[1] || 'output';
  const stem = argv[2] || 'portfolio';

  try {
    renderHtml({ inputFile, outputDir, stem });
  } catch (err) {
    console.error('❌ 渲染過程發生錯誤:', err.message);
    process.exit(1);
  }
}

module.exports = {
  copyDir,
  extractCustomStyles,
  renderHtml,
  main,
};

if (require.main === module) {
  main(process.argv.slice(2));
}
