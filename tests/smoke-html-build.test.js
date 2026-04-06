'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { execSync } = require('child_process');

test('smoke build html should generate output file', () => {
  const outDir = 'output/test-smoke';
  const outFile = `${outDir}/smoke.html`;

  if (fs.existsSync(outFile)) fs.rmSync(outFile, { force: true });

  execSync('node src/cli/build-cli.js content.example.md --format html --out output/test-smoke --stem smoke', {
    stdio: 'inherit',
  });

  assert.equal(fs.existsSync(outFile), true);
});
