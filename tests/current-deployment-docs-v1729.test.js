'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');const root=path.join(__dirname,'..');
const env=fs.readFileSync(path.join(root,'.env.example'),'utf8');const deploy=fs.readFileSync(path.join(root,'DEPLOY_RENDER.md'),'utf8');const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
assert(env.split(/\r?\n/)[0].includes('v1.7.83'));assert(!env.includes('v1.7.20'));
for(const phrase of ['smarter-justice-v1.7.82.zip','production is **not deployed or accepted**','146 total readiness parts','145 dependency-independent','auto deploy remains off'])assert(deploy.toLowerCase().includes(phrase.toLowerCase()),phrase);
assert(readme.startsWith('# Smarter Justice v1.7.83'));assert(readme.includes('self-contained umbrella legal platform'));
const manifest=require('../portal-manifest.json');assert.equal(manifest.currentDevelopmentVersion,'1.7.83');assert.equal(manifest.testSuiteParts,146);assert.equal(manifest.releaseEvidence,'RELEASE_EVIDENCE_V1.7.83.json');assert.equal(manifest.profileGrowthReport,'PROFILE_GROWTH_REPORT_V1.7.50.json');
console.log('current-deployment-docs-v1729.test.js passed');
