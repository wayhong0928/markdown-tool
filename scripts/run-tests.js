'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function main() {
  const root = process.cwd();
  const testsDir = path.join(root, 'tests');
  const testFiles = fs
    .readdirSync(testsDir)
    .filter((file) => file.endsWith('.test.js'))
    .sort();

  const startedAt = new Date();
  console.log(`🧪 Test start: ${formatTimestamp(startedAt)}`);
  console.log(`📦 Total test files: ${testFiles.length}`);

  for (let index = 0; index < testFiles.length; index += 1) {
    const file = testFiles[index];
    const absolutePath = path.join(testsDir, file);
    console.log(`\n[${index + 1}/${testFiles.length}] Running ${file}`);

    const result = spawnSync(process.execPath, ['--test', absolutePath], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
      shell: false,
    });

    if (result.status !== 0) {
      const failedAt = new Date();
      console.log(`\n❌ Test failed at: ${formatTimestamp(failedAt)}`);
      process.exit(result.status || 1);
    }
  }

  const finishedAt = new Date();
  const durationSeconds = ((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1);
  console.log(`\n✅ All tests passed at: ${formatTimestamp(finishedAt)}`);
  console.log(`⏱️  Total duration: ${durationSeconds}s`);
}

main();