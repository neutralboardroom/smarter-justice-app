
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
for (const f of ['server.js','package.json','README.md','public/index.html','public/logo.svg','data/practiceAreas.js','data/officialSourceCatalog.js']) {
  assert(fs.existsSync(path.join(root, f)), `missing ${f}`);
}
console.log('zip integrity source check passed');
