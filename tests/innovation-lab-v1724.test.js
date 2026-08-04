'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');const {INNOVATION_LAB_V1724}=require('../data/innovationLabV1724');
assert.equal(INNOVATION_LAB_V1724.version,'1.7.24');assert(INNOVATION_LAB_V1724.sources.length>=4);assert(INNOVATION_LAB_V1724.operatingRules.length>=6);
const implemented=INNOVATION_LAB_V1724.experiments.find(x=>x.id==='whole-situation-map');assert(implemented&&implemented.status.includes('implemented'));assert(implemented.safeguards.some(x=>/No network request/i.test(x)));
const voice=INNOVATION_LAB_V1724.experiments.find(x=>x.id==='accessible-guided-voice');assert(voice&&/closed/i.test(voice.status));
for(const phrase of ['general-purpose AI chatbot','legal-risk score','Automatic professional matching','Paid ranking'])assert(INNOVATION_LAB_V1724.rejectedShortcuts.some(x=>x.includes(phrase)),phrase);
const server=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');const control=fs.readFileSync(path.join(__dirname,'..','public','control-center.html'),'utf8');const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
assert(server.includes("'/api/owner/innovation-lab'"));assert(server.includes('requireOwner'));assert(control.includes('Smarter Justice Innovation Lab'));assert(app.includes('renderInnovationLab'));assert(app.includes('SMARTER_JUSTICE_INNOVATION_LAB_V1.7.25.json'));
console.log('innovation-lab-v1724.test.js passed');
