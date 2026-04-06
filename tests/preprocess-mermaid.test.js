'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractMermaidBlocks,
  replaceMermaidBlocksWithImages,
} = require('../src/steps/preprocess-mermaid');

test('extractMermaidBlocks should find all mermaid blocks', () => {
  const input = [
    '# title',
    '```mermaid',
    'graph TD',
    '  A --> B',
    '```',
    'text',
    '```mermaid',
    'graph TD',
    '  B --> C',
    '```',
  ].join('\n');

  const blocks = extractMermaidBlocks(input);
  assert.equal(blocks.length, 2);
  assert.match(blocks[0].code, /A --> B/);
  assert.match(blocks[1].code, /B --> C/);
});

test('extractMermaidBlocks should ignore mermaid fences inside example code blocks', () => {
  const input = [
    '````markdown',
    '```mermaid',
    'graph LR',
    '  A --> B',
    '```',
    '````',
    '```mermaid',
    'graph TD',
    '  B --> C',
    '```',
  ].join('\n');

  const blocks = extractMermaidBlocks(input);
  assert.equal(blocks.length, 1);
  assert.match(blocks[0].code, /B --> C/);
});

test('extractMermaidBlocks should support up to 3-space indented mermaid fences', () => {
  const input = [
    '   ```mermaid',
    '   graph TD',
    '     A --> B',
    '   ```',
  ].join('\n');

  const blocks = extractMermaidBlocks(input);
  assert.equal(blocks.length, 1);
  assert.match(blocks[0].code, /A --> B/);
});

test('replaceMermaidBlocksWithImages should map blocks by order', () => {
  const input = [
    '```mermaid',
    'graph TD',
    '  A --> B',
    '```',
    'text',
    '```mermaid',
    'graph TD',
    '  A --> B',
    '```',
  ].join('\n');

  const output = replaceMermaidBlocksWithImages(input, [
    './assets/diagrams/diagram-0.png',
    './assets/diagrams/diagram-1.png',
  ]);

  assert.match(output, /<img[^>]+diagram-0/);
  assert.match(output, /<img[^>]+diagram-1/);
  assert.match(output, /width:88%/);
  assert.match(output, /\n<img[^\n]+diagram-0[^\n]+\/>\n/);
});

test('replaceMermaidBlocksWithImages should keep original block on null image', () => {
  const input = [
    '```mermaid',
    'graph TD',
    '  A --> B',
    '```',
  ].join('\n');

  const output = replaceMermaidBlocksWithImages(input, [null]);
  assert.match(output, /```mermaid/);
});
