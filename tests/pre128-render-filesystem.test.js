'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
for (const release of ['pre126','pre127','pre128']) {
  const file = path.join(root, 'scripts', `bootstrap-${release}-release.js`);
  const source = fs.readFileSync(file, 'utf8');
  assert(!source.includes('os.tmpdir()'), `${release} staging must not use the operating-system temporary filesystem`);
  assert.match(source, /const runtimeRoot = path\.dirname\(target\);/, `${release} must derive its swap root from the target`);
  assert.match(source, new RegExp('const staging = path\\.join\\(runtimeRoot, `\\.' + release + '-staging-'), `${release} staging must be a target sibling`);
  assert.match(source, new RegExp('const retired = path\\.join\\(runtimeRoot, `\\.' + release + '-retired-'), `${release} retirement must be a target sibling`);
  assert.match(source, /fs\.renameSync\(staging, target\);/, `${release} must retain the atomic staged-target rename`);
}
console.log('pre128-render-filesystem.test.js passed');
