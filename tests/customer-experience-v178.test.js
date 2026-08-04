const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const pub=path.join(root,'public');
const {listPortalSummaries,recommendPortalForPractice}=require('../data/portals');

const internalOnly=new Set([
  'admin.html','staff.html','control-center.html','launch-activation.html','launch-readiness.html',
  'production-readiness.html','ai-summary.html','owner-login.html','internal-access.html'
]);
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

const forbiddenVisible=[
  /restricted Smarter Justice file/i,
  /private matters/i,
  /storage and security approval/i,
  /matter-file workflow/i,
  /starting preview/i,
  /routing preview/i,
  /starter file/i,
  /starter files?/i,
  /private file/i,
  /private files?/i,
  /delivery blockers/i,
  /source check needed/i,
  /controlled field campaign/i,
  /campaign’s verified status/i,
  /official domain being selected/i,
  /public and professional path/i,
  /protected future features/i,
  /not represented as active/i,
  /opportunity eligibility/i,
  /production upload/i,
  /deployment configuration/i,
  /environment variable/i,
  /owner token/i,
  /admin token/i,
  /staff queue/i,
  /service queue/i,
  /before paying or expecting forms/i
];
let htmlCount=0;
for(const name of fs.readdirSync(pub).filter(name=>name.endsWith('.html')&&!internalOnly.has(name))){
  const text=visibleText(fs.readFileSync(path.join(pub,name),'utf8'));
  for(const pattern of forbiddenVisible){
    assert(!pattern.test(text),`${name} exposes internal, technical, or confusing customer language: ${pattern}`);
  }
  htmlCount++;
}

const home=fs.readFileSync(path.join(pub,'index.html'),'utf8');
assert(home.includes('Start with the problem—not the legal category.'),'homepage must lead with the public value proposition');
assert(home.includes('I Need Legal Help'),'homepage must clearly identify the public path');
assert(home.includes('Attorney Partner Tour')&&home.includes('/professional-membership.html'),'homepage must clearly identify the professional path');
assert((home.match(/data-story-example=/g)||[]).length>=6,'homepage must include useful quick-start examples');
assert(home.includes('What happens next')||home.includes('public-start-expectations'),'homepage must explain the next steps');

const homeJs=fs.readFileSync(path.join(pub,'home.js'),'utf8');
assert(homeJs.includes("document.querySelectorAll('[data-story-example]')"),'quick-start examples must populate the public form');
assert(homeJs.includes('Find Professionals'),'routing results must provide a professional-discovery action');
assert(homeJs.includes('Describe a Notice'),'routing results must provide a notice-description action');

const dashboard=visibleText(fs.readFileSync(path.join(pub,'dashboard.html'),'utf8'));
assert(/Continue your saved Smarter Justice work/i.test(dashboard),'dashboard must use understandable continuation language');
assert(/Private access code/i.test(dashboard),'dashboard must use an understandable access-code label');
assert(!/restricted|storage and security approval|private matters/i.test(dashboard),'dashboard must not expose internal access or readiness wording');

const nextPath=visibleText(fs.readFileSync(path.join(pub,'next-path.html'),'utf8'));
assert(/See your likely next step/i.test(nextPath),'next-step page must state its value clearly');
assert(!/Upload the full document/i.test(nextPath),'next-step page must not contradict the no-upload notice path');
assert(/without uploading confidential pages/i.test(nextPath),'next-step page must give an accurate safe alternative');

const app=fs.readFileSync(path.join(pub,'app.js'),'utf8');
assert(app.includes('function customerText(value)'),'dynamic saved-work messages must pass through a customer-language boundary');
assert(app.includes('Your saved work'),'saved-work rendering must use customer language');
assert(app.includes('What is still needed before a draft can be shown'),'draft status must explain the user action instead of an internal gate');
assert(app.includes('Separate website not open yet'),'focused website status must use public language');
assert(!app.includes('<h4>Your file</h4>'),'legacy internal dashboard label must not return');
assert(!app.includes('<strong>Private continuation link:</strong>'),'legacy continuation terminology must not return');
assert(!app.includes('<h4>Possible official-form path</h4>'),'legacy form-path terminology must not return');
assert(app.includes('No saved work on this browser yet.'),'browser-local continuation must use saved-work language');
assert(app.includes('Start free or describe a notice to begin.'),'empty dashboard must offer accurate current actions');

for(const portal of listPortalSummaries()){
  assert(!/being developed|in development|starting preview|routing preview/i.test(portal.availabilityMessage),`${portal.slug} exposes build terminology`);
}
const housing=recommendPortalForPractice('landlord-tenant-housing');
assert(/not open yet|available now|planned/i.test(housing.userRouteMessage),'focused portal result must explain availability in public language');
assert(!/being developed|starting preview/i.test(housing.userRouteMessage),'focused portal result must not expose build language');

const professionalJs=fs.readFileSync(path.join(pub,'professional.js'),'utf8');
assert(professionalJs.includes('Professional opportunities'),'professional dashboard must use an understandable opportunity label');
assert(!professionalJs.includes('Opportunity eligibility</strong>'),'professional dashboard must not show operational eligibility terminology');
assert(professionalJs.includes('Useful professional tools from the start'),'membership value must be stated positively and clearly');

const css=fs.readFileSync(path.join(pub,'styles.css'),'utf8');
assert(css.includes('v1.7.8 customer-experience refinements'),'release-specific responsive safeguards must be present');
assert(/\.quick-start-chips button\{[^}]*min-height:44px/.test(css),'quick-start choices must meet the touch-target foundation');
assert(/@media\(max-width:430px\)\{\.quick-start-chips\{grid-template-columns:1fr\}/.test(css),'quick-start choices must become one column on narrow phones');
assert(/\.result-actions \.link-btn[^}]*width:100%/.test(css),'result actions must stack on mobile');
assert(/scroll-margin-top:88px/.test(css),'anchored form sections must remain visible below the responsive header');

console.log(`customer-experience-v178.test.js passed: ${htmlCount} customer-facing HTML pages, dynamic messages, public routing, professional UX, and responsive completion safeguards audited`);
