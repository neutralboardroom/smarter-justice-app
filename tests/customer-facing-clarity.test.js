const assert=require('assert');
const fs=require('fs');
const path=require('path');
const pub=path.join(__dirname,'..','public');
const internalOnly=new Set(['admin.html','staff.html','control-center.html','launch-activation.html','launch-readiness.html','production-readiness.html','ai-summary.html','owner-login.html','internal-access.html']);
function visibleText(html){
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;|&#160;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&quot;|&#34;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/\s+/g,' ')
    .trim();
}
const forbidden=[
  /routing preview/i,
  /starter file/i,
  /starter files?/i,
  /private file/i,
  /private files?/i,
  /production upload/i,
  /controlled founding pilot/i,
  /payment-readiness/i,
  /owner token/i,
  /admin token/i,
  /environment variable/i,
  /deployment configuration/i,
  /release gate/i,
  /staff queue/i,
  /internal queue/i,
  /source-grounded/i,
  /technical problem/i,
  /first-cohort evidence/i
];
let checked=0;
for(const name of fs.readdirSync(pub).filter(x=>x.endsWith('.html')&&!internalOnly.has(x))){
  const text=visibleText(fs.readFileSync(path.join(pub,name),'utf8'));
  for(const pattern of forbidden) assert(!pattern.test(text),`${name} exposes customer-facing internal or technical language: ${pattern}`);
  checked++;
}
const customerScripts=['home.js','professional.js','founding-portals.js','notice-route.js'];
const forbiddenVisibleStrings=[
  'Controlled founding pilot','Submit for Owner Review','payment-readiness evidence',
  'Withdraw this unpaid pilot application?','Technical problem','Founding-member feedback',
  'Protected hold','The routing preview is temporarily unavailable.'
];
for(const name of customerScripts){
  const js=fs.readFileSync(path.join(pub,name),'utf8');
  for(const phrase of forbiddenVisibleStrings) assert(!js.includes(phrase),`${name} contains customer-facing internal phrase: ${phrase}`);
}
const home=fs.readFileSync(path.join(pub,'index.html'),'utf8');
assert(home.includes('Tell us what happened.'),'homepage must preserve a clear public starting point');
assert(home.includes('Find My Starting Point'),'homepage must provide a direct public action');
assert(home.includes('Attorney Partner Tour')&&home.includes('/professional-membership.html'),'homepage must provide a direct professional action and membership path');
assert(/Justice Truck remains the community-access/i.test(fs.readFileSync(path.join(pub,'our-story.html'),'utf8')),'Our Story must present Justice Truck as an active community-access brand');
const css=fs.readFileSync(path.join(pub,'styles.css'),'utf8');
assert(/input,select,textarea\{font-size:16px\}/.test(css),'phone forms should prevent automatic mobile input zoom');
assert(/min-height:44px/.test(css),'mobile interactive controls should meet the 44px touch-target foundation');
assert(/overflow-x:auto/.test(css),'wide customer content needs a mobile horizontal-overflow fallback');
assert(/overflow-wrap:anywhere/.test(css),'long customer-facing text and URLs need overflow protection');
console.log(`customer-facing-clarity.test.js passed: ${checked} customer-facing HTML pages plus public scripts and responsive safeguards audited`);
