'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, validateFormats } = require('../src/cli/build-cli');

test('parseArgs should parse input and options', () => {
  const args = parseArgs(['data/public/slides.md', '--out', 'output/x', '--stem', 'demo', '--format', 'html,pdf']);
  assert.equal(args.input, 'data/public/slides.md');
  assert.equal(args.out, 'output/x');
  assert.equal(args.stem, 'demo');
  assert.deepEqual(args.formats, ['html', 'pdf']);
});

test('validateFormats should reject unsupported format', () => {
  assert.throws(() => validateFormats(['html', 'docx']), /不支援的格式/);
});
