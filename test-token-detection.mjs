#!/usr/bin/env node
import fs from 'node:fs';

const key = process.env.TIINGO_KEY;
if (!key) {
  console.log('No TIINGO_KEY found in environment. Skipping scan.');
  process.exit(0);
}

const filesToScan = [
  'TIINGO_VERIFICATION.md',
  'debug-tiingo-connection.mjs',
  'test-token-detection.mjs',
];

let leakDetected = false;
for (const file of filesToScan) {
  if (!fs.existsSync(file)) continue;
  const contents = fs.readFileSync(file, 'utf8');
  if (contents.includes(key)) {
    console.error(`❌ Secret detected in ${file}. Remove it before committing.`);
    leakDetected = true;
  }
}

if (leakDetected) {
  process.exit(1);
}

console.log('✅ No Tiingo secrets detected in tracked helper files.');
