'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const applicationRoot = path.resolve(process.argv[2] || '.');
const sourcePath = path.join(__dirname, 'apply-sitewide-polish.js');

function fail(message) {
  console.error(`[sitewide-overlay-safe] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(sourcePath)) fail('missing apply-sitewide-polish.js');
let source = fs.readFileSync(sourcePath, 'utf8');
const startMarker = 'const audit = ';
const writeMarker = "write('tests/sitewide-visual-polish-v1798.test.js', audit);";
const startIndex = source.indexOf(startMarker);
const writeIndex = source.indexOf(writeMarker, startIndex);
if (startIndex < 0 || writeIndex < 0) fail('could not locate the generated visual-audit block');
if (source.indexOf(startMarker, startIndex + startMarker.length) >= 0) fail('found more than one visual-audit block');

const safeAudit = String.raw`"use strict";
const assert=require('assert');const fs=require('fs');const path=require('path');const root=path.join(__dirname,'..');
const signup=fs.readFileSync(path.join(root,'public/professional-signup.html'),'utf8');
const docs=fs.readFileSync(path.join(root,'public/document-tools.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/styles.css'),'utf8');
assert(signup.includes('Create your account now. Complete your profile at your pace.'));
assert(signup.includes('class="signup-agreement-list"'));
assert(signup.includes('styles.css?v=1.7.98-sitewide-polish-1'));
assert(docs.includes('Review, compare, plan, draft, and organize a preparation binder without sending text to us.'));
assert(docs.includes('class="section narrow document-tools-intro"'));
assert(docs.includes('styles.css?v=1.7.98-sitewide-polish-1'));
assert(css.includes('coordinated site-wide visual polish'));
assert(css.includes('grid-template-columns:minmax(330px,370px) minmax(0,1fr)'));
assert(css.includes('.signup-agreement-list .check'));
assert(css.includes('.document-tools-intro{display:grid'));
assert(css.includes('@media(max-width:1100px)'));
assert(css.includes('overflow-wrap:break-word;word-break:normal'));
const publicRoot=path.join(root,'public');const html=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))html.push(p)}}walk(publicRoot);assert(html.length>=90);
for(const file of html){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/(?:href|src)="([^"]+)"/g)){const u=m[1];if(!u.startsWith('/')||u.startsWith('//')||u.startsWith('/api/')||u.startsWith('/#'))continue;const pathname=u.split(/[?#]/)[0];if(pathname==='/'||!pathname)continue;let target=path.join(publicRoot,pathname.replace(/^\//,''));if(pathname.endsWith('/'))target=path.join(target,'index.html');assert(fs.existsSync(target),'Missing public target '+u+' from '+path.relative(publicRoot,file));}}
console.log('sitewide-visual-polish-v1798.test.js passed across '+html.length+' public HTML pages');`;

const replacement = `const audit = ${JSON.stringify(safeAudit)};\n${writeMarker}`;
source = source.slice(0, startIndex) + replacement + source.slice(writeIndex + writeMarker.length);

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

console.log('[sitewide-overlay-safe] replaced the generated audit without nested templates and applied site-wide visual polish');
