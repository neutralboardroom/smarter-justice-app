'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const pub=path.join(root,'public'), src=path.resolve(__dirname,'..','public');
const marker='SMARTER_JUSTICE_PRE46_GROWTH_OPERATIONS_COMPLIANCE_STORY';
for(const name of ['growth-operations-compliance.html','attorney-partner-tour.html','attorney-call-tour.html']){
  const from=path.join(src,name),to=path.join(pub,name); if(!fs.existsSync(from))throw new Error(`Missing pre46 payload ${name}`); fs.copyFileSync(from,to);
}
const home=path.join(pub,'index.html');
let hs=fs.readFileSync(home,'utf8');
if(!hs.includes(marker)){
  hs=hs.replace('One professional presence across a wider help network.','Growth, operations, and compliance — under one roof.');
  hs=hs.replace('Manage profile, firm, credentials, security, and participation from one Smarter Justice account while keeping specialty-area fit clear.','Smarter Justice connects professional visibility and better-prepared prospects with firm operations and jurisdiction-aware marketing safeguards—so growth, intake, follow-up, firm administration, and responsible marketing can work from one professional platform.');
  hs=hs.replace(/<a([^>]+)href="\/professional-membership\.html"([^>]*)>See the professional network<\/a>/,`<a$1href="/growth-operations-compliance.html"$2>See the law-firm platform</a>`);
  if(!/Growth, operations, and compliance/.test(hs))throw new Error('PRE46 home professional story did not apply');
  hs=hs.replace('</body>',`<!-- ${marker} --></body>`); fs.writeFileSync(home,hs);
}
const member=path.join(pub,'professional-membership.html');
let ms=fs.readFileSync(member,'utf8');
if(!ms.includes(marker)){
  const anchor='<section class="section" id="plans">';
  if(!ms.includes(anchor))throw new Error('PRE46 membership insertion anchor missing');
  ms=ms.replace('Control your basic profile free. Add paid growth only when it fits your practice.','Start with free profile control. See the larger law-firm platform behind it.');
  const story=`<section class="section" id="growth-operations-compliance"><div class="section-heading centered-heading"><p class="eyebrow">More than membership</p><h2>Growth, operations, and compliance—under one roof.</h2><p>Smarter Justice is building one professional platform so visibility and better-prepared prospects can connect to intake and firm workflows, while marketing content can move through jurisdiction-aware review before publication.</p></div><div class="cards three"><article class="card"><h3>Growth</h3><p>Professional presence, public preparation pathways, attribution, referral foundations, and controlled future growth tools.</p></article><article class="card"><h3>Operations</h3><p>Firm, office, role, contact, inquiry, intake, appointment, task, communication, consent, and handoff foundations.</p></article><article class="card"><h3>Compliance</h3><p>Sourced, versioned marketing rules, explainable flags, evidence preservation, and human-review or fail-closed handling when requirements are uncertain.</p></article></div><div class="hero-actions"><a class="primary link-btn" href="/growth-operations-compliance.html">See the law-firm platform</a><a class="secondary link-btn" href="/attorney-call-tour.html">Open the 3-minute tour</a></div><p class="fine-print">Full nationwide marketing-compliance automation, unrestricted outbound campaigns, AI front desk, custom-domain activation, and automatic CRM migration remain gated until separately qualified.</p></section>`;
  ms=ms.replace(anchor,`<!-- ${marker} -->${story}${anchor}`); fs.writeFileSync(member,ms);
}
console.log('PRE46_GROWTH_OPERATIONS_COMPLIANCE_STORY_APPLIED');
