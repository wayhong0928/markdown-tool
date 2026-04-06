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

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function getFenceMatch(line) {
  const match = line.match(/^ {0,3}([`~]{3,})(.*)$/);
  if (!match) return null;
  return {
    marker: match[1][0],
    length: match[1].length,
    info: match[2].trim(),
  };
}

function extractMermaidBlocks(content) {
  const blocks = [];
  let cursor = 0;
  let openFence = null;
  let mermaidBlock = null;

  while (cursor < content.length) {
    const lineStart = cursor;
    const newlineIndex = content.indexOf('\n', cursor);
    const lineEnd = newlineIndex === -1 ? content.length : newlineIndex + 1;
    const line = content.slice(cursor, newlineIndex === -1 ? content.length : newlineIndex).replace(/\r$/, '');
    cursor = lineEnd;
    const fence = getFenceMatch(line);

    if (!openFence && fence) {
      openFence = fence;
      if (fence.info === 'mermaid') {
        mermaidBlock = {
          start: lineStart,
          contentStart: lineEnd,
        };
      }
      continue;
    }

    if (openFence) {
      const closingFence = line.match(new RegExp(`^\\s{0,3}${openFence.marker}{${openFence.length},}\\s*$`));
      if (closingFence) {
        if (mermaidBlock) {
          blocks.push({
            start: mermaidBlock.start,
            end: lineEnd,
            full: content.slice(mermaidBlock.start, lineEnd),
            code: content.slice(mermaidBlock.contentStart, lineStart).trim(),
          });
          mermaidBlock = null;
        }
        openFence = null;
      }
    }

    if (lineEnd >= content.length) break;
  }

  return blocks;
}

function renderDiagram(options) {
  const {
    code,
    index,
    diagramsDir,
    imageFormat = 'png',
    imageWidth = 1600,
    bgColor = 'white',
    runCommand = spawnSync,
    logger = console,
  } = options;

  const tempInput = path.join(diagramsDir, `.temp-${index}.mmd`);
  const outputFile = path.join(diagramsDir, `diagram-${index}.${imageFormat}`);
  const puppeteerConfigFile = path.resolve(__dirname, '../../puppeteer.config.json');

  fs.writeFileSync(tempInput, code, 'utf-8');

  try {
    const result = runCommand(
      getNpxCommand(),
      ['mmdc', '-i', tempInput, '-o', outputFile, '--backgroundColor', bgColor, '--width', String(imageWidth), '-p', puppeteerConfigFile],
      { stdio: 'pipe', shell: process.platform === 'win32' }
    );
    if (result.error || result.status !== 0) {
      if (result.error) throw result.error;
      const stderr = (result.stderr || '').toString().trim();
      const stdout = (result.stdout || '').toString().trim();
      const details = [stderr, stdout].filter(Boolean).join('\n');
      throw new Error(details || `mmdc exited with code ${result.status}`);
    }
    logger.log(`  ✅ diagram-${index}.${imageFormat}`);
    return path.basename(outputFile);
  } catch (err) {
    logger.error(`  ❌ diagram-${index} 渲染失敗：${err.message}`);
    throw new Error(`diagram-${index} 渲染失敗：${err.message}`);
  } finally {
    if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
  }
}

function replaceMermaidBlocksWithImages(content, imagePaths) {
  const blocks = extractMermaidBlocks(content);
  if (blocks.length === 0) return content;

  let result = '';
  let cursor = 0;

  blocks.forEach((block, index) => {
    result += content.slice(cursor, block.start);

    const imagePath = imagePaths[index];
    if (!imagePath) {
      result += block.full;
    } else {
      result += `\n<img src="${imagePath}" alt="diagram-${index}" class="mermaid-diagram" style="display:block;width:88%;max-width:88%;height:auto;margin:0 auto;" />\n`;
    }

    cursor = block.end;
  });

  result += content.slice(cursor);
  return result;
}

function preprocessMermaid(options) {
  const {
    input,
    output,
    diagramsDir = path.join('assets', 'diagrams'),
    imagePathPrefix = './assets/diagrams',
    imageFormat = 'png',
    imageWidth = 1600,
    bgColor = 'white',
    logger = console,
  } = options;

  logger.log('╔════════════════════════════════════════╗');
  logger.log('║   Mermaid Pre-Renderer  (SDD v2.0)     ║');
  logger.log('╚════════════════════════════════════════╝\n');
  logger.log(`📥 輸入：${input}`);
  logger.log(`📤 輸出：${output}\n`);

  maybeBreakpoint('preprocess-mermaid:start');

  if (!fs.existsSync(input)) {
    throw new Error(`找不到輸入檔：${input}`);
  }

  const rawContent = fs.readFileSync(input, 'utf-8');
  const blocks = extractMermaidBlocks(rawContent);
  const outputDir = path.dirname(output);
  ensureDir(outputDir);

  if (blocks.length === 0) {
    logger.log('ℹ️  未偵測到 Mermaid 圖表，直接複製原始檔\n');
    fs.writeFileSync(output, rawContent, 'utf-8');
    logger.log(`✅ 完成：${output}`);
    return { total: 0, rendered: 0 };
  }

  logger.log(`📊 偵測到 ${blocks.length} 張 Mermaid 圖表，開始渲染...\n`);
  ensureDir(diagramsDir);

  const imagePaths = blocks.map((block, i) => {
    maybeBreakpoint(`preprocess-mermaid:block-${i}`);
    const renderedFileName = renderDiagram({
      code: block.code,
      index: i,
      diagramsDir,
      imageFormat,
      imageWidth,
      bgColor,
      logger,
    });
    const normalizedPrefix = imagePathPrefix.replace(/\\/g, '/').replace(/\/$/, '');
    return `${normalizedPrefix}/${renderedFileName}`;
  });

  const rendered = imagePaths.filter(Boolean).length;
  if (rendered !== blocks.length) {
    throw new Error(`Mermaid 渲染不完整：${rendered}/${blocks.length}`);
  }
  const processed = replaceMermaidBlocksWithImages(rawContent, imagePaths);

  fs.writeFileSync(output, processed, 'utf-8');

  logger.log('\n────────────────────────────────────────');
  logger.log(`✅ 完成！成功渲染 ${rendered}/${blocks.length} 張圖表`);
  logger.log(`📄 輸出：${output}`);
  logger.log(`🖼️  圖片：${diagramsDir}/`);

  return { total: blocks.length, rendered, diagramsDir };
}

function main(argv) {
  const input = argv[0] || 'content.md';
  const output = argv[1] || 'content-processed.md';

  try {
    preprocessMermaid({ input, output });
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  ensureDir,
  removeDir,
  extractMermaidBlocks,
  replaceMermaidBlocksWithImages,
  preprocessMermaid,
  main,
};

if (require.main === module) {
  main(process.argv.slice(2));
}
