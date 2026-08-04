'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');const root=path.join(__dirname,'..');const report=require('../STORAGE_CONSERVATION_V1.7.32.json');
assert.equal(report.version,'1.7.32');assert.equal(report.removedFiles.length,8);assert.equal(report.removedBytes,1775362);for(const item of report.removedFiles)assert(!fs.existsSync(path.join(root,item.path)),item.path);for(const required of ['tests','AUDIT_REPORT_V1.7.31.md','CONTINUATION_PROMPT_V1.7.31.md','RELEASE_EVIDENCE_V1.7.31.json'])assert(fs.existsSync(path.join(root,required)),required);assert(report.retained.some(x=>/regression/i.test(x)));assert(/Do not remove v1.7.31/.test(report.safeCleanupRule));
console.log('storage-conservation-v1732.test.js passed');
