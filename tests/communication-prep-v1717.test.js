const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const tools=require('../public/document-tools.js');

const source=[
  'NOTICE OF REVIEW',
  'Reference number: AB-12345',
  'Please submit the requested records by August 15, 2026.',
  'Questions may be sent to records@example.org.'
].join('\n');
const validated=tools.validateText(source,'sample notice');
assert(!validated.error);
const analysis=tools.analyzeDocument('Sample notice',validated.text,validated.lines);
const findings=tools.planFindingsFromAnalysis(analysis);
const dateFinding=findings.find(item=>item.kind==='stated-date');
const actionFinding=findings.find(item=>item.kind==='action-language');
assert(dateFinding && dateFinding.line===3,'stated date must retain one-based source line');
assert(actionFinding && actionFinding.line===3,'action language must retain one-based source line');

let result=tools.createCommunicationDraft({type:'clarification',recipient:'Records Office',request:'Please explain whether electronic submission is accepted.',closing:'Thank you',sourceName:'Sample notice'},[dateFinding,actionFinding]);
assert(result.data,'valid source-grounded draft should be created');
assert(result.data.draftBody.includes('Hello Records Office,'));
assert(result.data.draftBody.includes('Please explain whether electronic submission is accepted.'));
assert(result.data.draftBody.includes('source line 3'));
assert.equal(result.data.selectedSourceFindings[0].line,3);
assert.equal(result.data.selectedSourceFindings[0].exactExcerpt,dateFinding.quote);
assert.equal(result.data.userChosenResponseDate,null);
assert(!/attorney|legal conclusion|guarantee/i.test(result.data.draftBody),'draft must not invent professional conclusions');

result=tools.createCommunicationDraft({type:'correction',recipient:'Benefits Office',request:'Please review the spelling of my name.',responseDate:'2026-08-20',closing:'Respectfully',sourceName:'Benefit notice'},[dateFinding]);
assert.equal(result.data.userChosenResponseDate,'2026-08-20');
assert(result.data.draftBody.includes('If possible, please respond by 2026-08-20.'));
const exportText=tools.communicationDraftAsText(result.data,result.data.draftBody+'\nUser edit.');
assert(exportText.includes('SOURCE APPENDIX'));
assert(exportText.includes('User edit.'));
assert(exportText.includes('Line 3'));
assert(exportText.includes('not a message sent by Smarter Justice'));

assert(tools.createCommunicationDraft({recipient:'',request:'Question',sourceName:'x'},[dateFinding]).error);
assert(tools.createCommunicationDraft({recipient:'Office',request:'',sourceName:'x'},[dateFinding]).error);
assert(tools.createCommunicationDraft({recipient:'Office',request:'Question',sourceName:'x'},[]).error);
assert(tools.createCommunicationDraft({recipient:'Office',request:'Question',responseDate:'08/20/2026',sourceName:'x'},[dateFinding]).error);

const js=fs.readFileSync(path.join(root,'public','document-tools.js'),'utf8');
for(const forbidden of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'WebSocket']){
  assert(!js.includes(forbidden),`device-only communication workflow must not use ${forbidden}`);
}
const html=fs.readFileSync(path.join(root,'public','document-tools.html'),'utf8');
assert(html.includes('id="communication-prep"'));
assert(html.includes('id="communicationDraftEditor"'));
assert(html.includes('Build Editable Draft'));
assert(!html.includes('Send Message'),'tool must not imply Smarter Justice sends the communication');
assert(html.includes('id="action-plan"'),'existing action-plan deep link must resolve');
const free=fs.readFileSync(path.join(root,'public','free-tools.html'),'utf8');
assert(free.includes('/document-tools.html#communication-prep'));
assert(free.includes('No invented facts or automatic sending'));
console.log('communication-prep-v1717.test.js passed: source-grounded editable drafts, exact-line appendix, user control, and no-network/no-persistence boundaries verified');
