'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const applicationRoot = path.resolve(process.argv[2] || '.');
const sourcePath = path.join(__dirname, 'apply-sitewide-polish.js');
const defective = 'assert(fs.existsSync(target),`Missing public target ${u} from ${path.relative(publicRoot,file)}`);';
const corrected = 'assert(fs.existsSync(target),`Missing public target \\${u} from \\${path.relative(publicRoot,file)}`);';

function fail(message) {
  console.error(`[sitewide-overlay-safe] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) fail('missing apply-sitewide-polish.js');
let source = fs.readFileSync(sourcePath, 'utf8');
const occurrences = source.split(defective).length - 1;
if (occurrences !== 1) {
  fail(`expected exactly one defective audit interpolation, found ${occurrences}`);
}
source = source.replace(defective, corrected);

const temporaryPath = path.join(os.tmpdir(), `apply-sitewide-polish-corrected-${process.pid}.js`);
fs.writeFileSync(temporaryPath, source, 'utf8');
try {
  const syntax = spawnSync(process.execPath, ['--check', temporaryPath], {
    stdio: 'inherit',
    env: process.env
  });
  if (syntax.error || syntax.status !== 0) {
    fail(`corrected overlay generator syntax check failed with status ${syntax.status ?? 'unknown'}`);
  }

  const run = spawnSync(process.execPath, [temporaryPath, applicationRoot], {
    stdio: 'inherit',
    env: process.env
  });
  if (run.error || run.status !== 0) {
    fail(`corrected overlay generator failed with status ${run.status ?? 'unknown'}`);
  }
} finally {
  fs.rmSync(temporaryPath, { force: true });
}

console.log('[sitewide-overlay-safe] corrected audit interpolation and applied site-wide visual polish');
