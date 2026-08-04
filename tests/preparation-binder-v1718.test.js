const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const tools=require('../public/document-tools.js');

const sourceText=[
  'NOTICE OF REVIEW',
  'Reference number: AB-1234',
  'Please respond by August 20, 2026.',
  'Amount shown: $120.00',
  'Contact: records@example.org'
].join('\n');
const lines=sourceText.split('\n');
const analysis=tools.analyzeDocument('Review notice',sourceText,lines);
const findings=tools.planFindingsFromAnalysis(analysis);
assert(findings.length>=4,'fixture should produce source findings');
const selected=findings.slice(0,3);

const item=tools.createPlanItemRecord('question','Ask whether an online response is accepted.','2026-08-18').item;
const correction=tools.createCorrectionRecord(4,'The amount may already have been paid.',lines).correction;
const plan=tools.buildActionPlanData('Review notice',selected.slice(0,2),[item],[correction]);
const communicationResult=tools.createCommunicationDraft({
  sourceName:'Review notice',
  type:'clarification',
  recipient:'Records Office',
  subject:'Question about review notice',
  sender:'Jordan Lee',
  context:'I received the notice this week.',
  request:'Please clarify whether the response may be submitted online.',
  responseDate:'2026-08-18',
  closing:'Thank you'
},selected.slice(0,2));
assert(!communicationResult.error);
const communication=communicationResult.data;
const editedBody=`${communication.draftBody}\n\nUser-added sentence.`;

let result=tools.buildPreparationBinderData({
  sourceName:'Review notice',
  title:'Preparation binder for review notice',
  purpose:'professional-conversation',
  summary:'I want to organize the notice before deciding whom to contact.',
  includePlan:true,
  includeCommunication:true
},selected,plan,communication,editedBody);
assert(!result.error,result.error);
const binder=result.data;
assert.equal(binder.tool,'Smarter Justice device-only preparation binder');
assert.equal(binder.binderTitle,'Preparation binder for review notice');
assert.equal(binder.purposeLabel,'Prepare before speaking with a professional');
assert.equal(binder.selectedSourceFindings.length,3);
assert.equal(binder.selectedSourceFindings[0].line,selected[0].line);
assert.equal(binder.selectedSourceFindings[0].exactExcerpt,selected[0].quote);
assert.equal(binder.actionPlan.userItems[0].text,item.text);
assert.equal(binder.actionPlan.separateCorrections[0].originalSourceLine,lines[3]);
assert.equal(binder.actionPlan.separateCorrections[0].userCorrectionOrNote,correction.note);
assert(binder.communicationDraft.editableDraft.includes('User-added sentence.'));
assert.equal(binder.communicationDraft.selectedSourceFindings[0].exactExcerpt,communication.selectedSourceFindings[0].exactExcerpt);
assert(binder.limitations.some(x=>/not filed, uploaded, sent/i.test(x)));

const exportText=tools.preparationBinderAsText(binder);
for(const expected of ['USER-ENTERED SUMMARY','SELECTED SOURCE FINDINGS','ACTION PLAN AND SEPARATE CORRECTIONS','EDITABLE COMMUNICATION DRAFT','IMPORTANT LIMITS','Line 4 original','User-added sentence.']) assert(exportText.includes(expected),`binder export missing ${expected}`);

result=tools.buildPreparationBinderData({sourceName:'x',title:'',purpose:'personal-records'},selected,null,null,'');
assert(result.error);
result=tools.buildPreparationBinderData({sourceName:'x',title:'Binder',purpose:'personal-records',includePlan:true},selected,null,null,'');
assert(/action plan/i.test(result.error));
result=tools.buildPreparationBinderData({sourceName:'x',title:'Binder',purpose:'personal-records',includeCommunication:true},selected,null,null,'');
assert(/communication draft/i.test(result.error));
result=tools.buildPreparationBinderData({sourceName:'x',title:'Binder',purpose:'personal-records'},[],null,null,'');
assert(/source finding/i.test(result.error));

const js=fs.readFileSync(path.join(root,'public','document-tools.js'),'utf8');
for(const forbidden of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'WebSocket']) assert(!js.includes(forbidden),`device-only binder workflow must not use ${forbidden}`);
const html=fs.readFileSync(path.join(root,'public','document-tools.html'),'utf8');
for(const expected of ['id="preparation-binder"','id="preparationBinderForm"','id="binderSourceFindings"','id="binderIncludePlan"','id="binderIncludeCommunication"','Build Preparation Binder','Download Structured Binder']) assert(html.includes(expected),`document tools missing ${expected}`);
assert(!/Send Binder|Upload Binder|Share with a professional/i.test(html),'binder must not imply automatic sending, upload, or professional sharing');
const free=fs.readFileSync(path.join(root,'public','free-tools.html'),'utf8');
assert(free.includes('/document-tools.html#preparation-binder'));
assert(free.includes('Original source and user notes stay distinct'));
console.log('preparation-binder-v1718.test.js passed: exact-source binder, separate corrections, optional plan/draft inclusion, local exports, and no-network/no-persistence boundaries verified');
