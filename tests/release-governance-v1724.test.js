'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');
for(const f of ['AUDIT_REPORT_V1.7.24.md','CHANGE_MAP_V1.7.24.md','NO_CHANGE_LEDGER_V1.7.24.md','CONTINUATION_PROMPT_V1.7.24.md','RELEASE_EVIDENCE_V1.7.24.json','INNOVATION_RESEARCH_V1.7.24.md','INNOVATION_RESEARCH_V1.7.24.json'])assert(fs.existsSync(path.join(__dirname,'..',f)),f);
const evidence=require('../RELEASE_EVIDENCE_V1.7.24.json');assert.equal(evidence.version,'1.7.24');assert.equal(evidence.deployed,false);assert.equal(evidence.activationGatesChanged,false);assert.equal(evidence.innovationResearch.completed,true);assert.equal(evidence.publicTool.wholeSituationMap,true);assert.equal(evidence.ownerTools.innovationLab,true);assert.equal(evidence.profileGrowth.publicDirectory.total,117);assert.equal(evidence.profileGrowth.strictQualifying.total,114);
console.log('release-governance-v1724.test.js historical evidence passed');
