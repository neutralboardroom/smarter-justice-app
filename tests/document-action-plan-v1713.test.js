const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const tools=require('../public/document-tools.js');
const text=name=>fs.readFileSync(path.join(root,name),'utf8');

const source=[
  'NOTICE OF REVIEW',
  'Date: July 30, 2026',
  'You must provide the requested records.',
  'Reference Number: TEST-12345',
  'Original name: Example Person'
].join('\n');
const valid=tools.validateText(source,'source');
const analysis=tools.analyzeDocument('Synthetic source',valid.text,valid.lines);
const findings=tools.planFindingsFromAnalysis(analysis);
assert(findings.some(item=>item.kind==='stated-date' && item.line===2));
assert(findings.some(item=>item.kind==='action-language' && item.line===3));
assert(findings.some(item=>item.kind==='reference' && item.line===4));
assert.equal(new Set(findings.map(item=>item.key)).size,findings.length,'source finding keys must be unique');

const planItem=tools.createPlanItemRecord('next-action','Confirm which records are requested.','2026-08-01');
assert.equal(planItem.error,undefined);
assert.equal(planItem.item.label,'Next action I choose');
assert.equal(planItem.item.targetDate,'2026-08-01');
assert(tools.createPlanItemRecord('question','   ','').error);
assert(tools.createPlanItemRecord('question','Question','08/01/2026').error);

const correction=tools.createCorrectionRecord('5','The current spelling may be different.',valid.lines);
assert.equal(correction.error,undefined);
assert.equal(correction.correction.line,5);
assert.equal(correction.correction.original,'Original name: Example Person');
assert.equal(correction.correction.note,'The current spelling may be different.');
assert(tools.createCorrectionRecord('0','Bad line',valid.lines).error);
assert(tools.createCorrectionRecord('99','Bad line',valid.lines).error);
assert(tools.createCorrectionRecord('5','',valid.lines).error);

const selected=findings.filter(item=>['stated-date','action-language'].includes(item.kind));
const data=tools.buildActionPlanData('Synthetic source',selected,[planItem.item],[correction.correction]);
assert.equal(data.sourceName,'Synthetic source');
assert.equal(data.selectedSourceFindings.length,2);
assert.equal(data.userItems.length,1);
assert.equal(data.separateCorrections.length,1);
assert.equal(data.separateCorrections[0].originalSourceLine,'Original name: Example Person');
assert(data.limitations.some(item=>/not necessarily a legal deadline/i.test(item)));
const output=tools.actionPlanAsText(data);
assert(/SELECTED SOURCE FINDINGS/.test(output));
assert(/Line 2/.test(output));
assert(/User correction or note/.test(output));
assert(/user-chosen target date/i.test(output));

const html=text('public/document-tools.html');
const script=text('public/document-tools.js');
assert(/Source-linked action plan/i.test(html));
assert(/Original text and your notes stay separate/i.test(html));
assert(/does not overwrite the document/i.test(html));
assert(/Build or Update Action Plan/i.test(html));
assert(/Download Structured Plan/i.test(html));
for(const forbidden of [/\bfetch\s*\(/,/XMLHttpRequest/,/localStorage/,/sessionStorage/,/indexedDB/,/navigator\.sendBeacon/]) assert(!forbidden.test(script),`device-only planner must not use ${forbidden}`);
assert(!/\.innerHTML\s*=/.test(script),'source and user text must not be rendered with innerHTML');
assert(/textContent/.test(script));
assert(/originalSourceLine/.test(script));
assert(/userCorrectionOrNote/.test(script));

console.log('document-action-plan-v1713.test.js passed: source-linked findings, separate corrections, user-chosen tasks, local exports, and no-network/no-persistence boundaries verified');
