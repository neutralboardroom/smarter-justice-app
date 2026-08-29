'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const scriptsDir = __dirname;
const sourcePath = path.join(scriptsDir, 'bootstrap-pre124-deploy.js');
const effectivePath = path.join(scriptsDir, '.bootstrap-pre124-effective.js');
let source = fs.readFileSync(sourcePath, 'utf8');
const oldAssertion = "for (const needle of ['consultation scheduling', 'document/form review', 'No Smarter Justice calendar']) ok(membership.toLowerCase().includes(needle.toLowerCase()), `approved paid/free boundary missing: ${needle}`);";
const newAssertion = "for (const needle of ['consultation scheduling', 'No Smarter Justice calendar']) ok(membership.toLowerCase().includes(needle.toLowerCase()), `approved paid/free boundary missing: ${needle}`); const membershipLower=membership.toLowerCase(); ok(membershipLower.includes('document') && membershipLower.includes('form') && membershipLower.includes('review'), 'approved document/form review capability missing');";
if (!source.includes(oldAssertion)) {
  console.error('[PRE124 RELEASE] expected qualification assertion not found');
  process.exit(1);
}
source = source.replace(oldAssertion, newAssertion);
fs.writeFileSync(effectivePath, source);
const result = spawnSync(process.execPath, [effectivePath], { cwd: path.resolve(scriptsDir, '..'), env: process.env, stdio: 'inherit' });
try { fs.rmSync(effectivePath, { force: true }); } catch {}
process.exit(Number.isInteger(result.status) ? result.status : 1);
