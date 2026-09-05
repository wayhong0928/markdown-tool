'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { preprocessMermaid } = require('../steps/preprocess-mermaid');
const { renderHtml } = require('../steps/render-html');

function getNpxCommand() {
  return 'npx';
}

function maybeBreakpoint(label) {
  const breakpoint = process.env.MARKDOWN_TOOL_BREAKPOINT;
  if (breakpoint === '1' || breakpoint === label) {
    debugger;
  }
}

function parseArgs(argv) {
  const args = { input: null, out: 'output', stem: null, formats: ['html', 'pdf', 'pptx'] };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      args.help = true;
    } else if ((a === '--out' || a === '-o') && argv[i + 1]) {
      args.out = argv[++i];
    } else if ((a === '--stem' || a === '-s') && argv[i + 1]) {
      args.stem = argv[++i];
    } else if (a === '--format' && argv[i + 1]) {
      args.formats = argv[++i].split(',').map((f) => f.trim().toLowerCase());
    } else if (!a.startsWith('-')) {
      positional.push(a);
    }
  }

  args.input = positional[0] || null;
  return args;
}

function printHelp() {
  console.log(`
md-to-slides — Build CLI

用法：
  node build.js [options] <input.md>

Options:
  --out,  -o <dir>       輸出目錄（預設 output）
  --stem, -s <name>      輸出檔名主幹（預設取自輸入檔名）
  --format   <formats>   輸出格式，逗號分隔：html,pdf,pptx（預設全部）
  --help, -h             顯示說明

範例：
  node build.js content.md
  node build.js data/slides.md --out output/slides
  node build.js data/note.md --format html
  node build.js data/report.md -s report -o output/report
`.trim());
}

function run(command, args, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error || result.status !== 0) {
    if (result.error) console.error(`❌ 執行失敗：${result.error.message}`);
    console.error(`❌ 失敗：${label}`);
    process.exit(1);
  }
}

function validateFormats(formats) {
  const allowed = new Set(['html', 'pdf', 'pptx']);
  const invalid = formats.filter((f) => !allowed.has(f));
  if (invalid.length > 0) {
    throw new Error(`不支援的格式：${invalid.join(', ')}`);
  }
}

function main(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    return;
  }

  if (!args.input) {
    console.error('❌ 請指定輸入檔案。\n   用法：node build.js <input.md> [options]');
    console.error('   說明：node build.js --help');
    process.exit(1);
  }

  if (!fs.existsSync(args.input)) {
    console.error(`❌ 找不到輸入檔：${args.input}`);
    process.exit(1);
  }

  try {
    validateFormats(args.formats);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  const stem = args.stem || path.basename(args.input, path.extname(args.input));
  const outputDir = args.out;
  const tempMd = path.join(outputDir, '._temp_render.md');
  const diagramsDir = path.join(outputDir, 'assets', 'diagrams');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log('╔═══════════════════════════════════════════╗');
  console.log('║          md-to-slides  Build CLI          ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`📥 輸入：${args.input}`);
  console.log(`📤 輸出：${outputDir}/${stem}.*`);
  console.log(`🖨  格式：${args.formats.join(', ')}`);

  maybeBreakpoint('build-cli:before-preprocess');

  console.log('\n▶ Mermaid 前處理');
  try {
    preprocessMermaid({
      input: args.input,
      output: tempMd,
      diagramsDir,
      imagePathPrefix: './assets/diagrams',
    });
  } catch (err) {
    console.error(`❌ Mermaid 前處理失敗：${err.message}`);
    process.exit(1);
  }

  if (args.formats.includes('html')) {
    maybeBreakpoint('build-cli:before-html');
    console.log(`\n▶ HTML → ${outputDir}/${stem}.html`);
    try {
      renderHtml({ inputFile: tempMd, outputDir, stem });
    } catch (err) {
      console.error(`❌ HTML 渲染失敗：${err.message}`);
      process.exit(1);
    }
  }

  if (args.formats.includes('pdf')) {
    maybeBreakpoint('build-cli:before-pdf');
    run(
      getNpxCommand(),
      ['marp', tempMd, '-o', `${outputDir}/${stem}.pdf`, '--allow-local-files', '--html', '--no-stdin'],
      `PDF  → ${outputDir}/${stem}.pdf`
    );
  }

  if (args.formats.includes('pptx')) {
    maybeBreakpoint('build-cli:before-pptx');
    run(
      getNpxCommand(),
      ['marp', tempMd, '-o', `${outputDir}/${stem}.pptx`, '--allow-local-files', '--html', '--no-stdin'],
      `PPTX → ${outputDir}/${stem}.pptx`
    );
  }

  if (fs.existsSync(tempMd)) fs.unlinkSync(tempMd);

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log(`║  ✅ 完成！輸出位置：${outputDir}/`);
  console.log('╚═══════════════════════════════════════════╝');
}

module.exports = {
  parseArgs,
  validateFormats,
  main,
};

if (require.main === module) {
  main(process.argv.slice(2));
}
