'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98', pub=path.join(root,'public');
const MARK='SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH';
function page(name){const p=path.join(pub,name);if(!fs.existsSync(p))throw new Error(`PRE50 missing ${name}`);return{p,s:fs.readFileSync(p,'utf8')}}
function save(x){fs.writeFileSync(x.p,x.s,'utf8')}
function r(x,a,b){x.s=x.s.split(a).join(b);return x}
function mark(x,label,needle){if(!x.s.includes(MARK)){if(!x.s.includes(needle))throw new Error(`PRE50 marker seam missing ${label}`);x.s=x.s.replace(needle,needle+`<!-- ${MARK}_${label} -->`)}return x}

// Quick demonstration entry.
{
 const x=mark(page('attorney-call-tour.html'),'QUICK','<!-- SMARTER_JUSTICE_PRE46_GROWTH_OPERATIONS_COMPLIANCE_STORY -->');
 r(x,'Attorney quick tour','Attorney demonstration');
 r(x,'Growth, operations, and compliance—under one roof.','See the complete path—from a person needing legal help to a better-prepared professional opportunity.');
 r(x,'Smarter Justice is building one professional platform to help firms be discovered by better-prepared prospective clients, organize what happens after an inquiry, and put jurisdiction-aware guardrails around marketing before publication.','In a few minutes, see what a prospective client sees, how your professional presence fits into that journey, what better preparation can look like before contact, and how Smarter Justice connects growth, operations, and marketing guardrails for the firm.');
 r(x,'href="/growth-operations-compliance.html">See the platform</a><a class="secondary button-link" href="/attorney-partner-tour.html">Take the full tour</a>','href="/attorney-partner-tour.html?mode=presenter&practice=divorce">Start the guided demonstration</a><a class="secondary button-link" href="/growth-operations-compliance.html">See the professional workspace</a>');
 r(x,'<h2>Why connect the three?</h2>','<h2>What the attorney should understand by the end</h2>');
 r(x,'href="/professionals.html">Find or claim a profile</a><a class="secondary button-link" href="/professional-membership.html">Review membership</a>','href="/attorney-partner-tour.html?mode=presenter&practice=divorce">Start the 7-step demonstration</a><a class="secondary button-link" href="/attorney-launch.html?campaign=ATTORNEY-DEMO">See the profile path</a>');
 save(x);
}

// Full presenter tour: outcome-first language.
{
 const x=mark(page('attorney-partner-tour.html'),'FULL','<!-- SMARTER_JUSTICE_PRE46_GROWTH_OPERATIONS_COMPLIANCE_STORY -->');
 const pairs=[
 ['For attorneys and firms</p><h1>Growth + operations + compliance, connected to where prospective clients begin.','Attorney demonstration</p><h1>See the path your prospective client and your firm can follow—start to finish.'],
 ['Start short tour','Start 7-step demonstration'],['View full tour','Explore the full page'],
 ['Choose a practice area','Choose a demonstration example'],['Which area should this tour emphasize?','Which legal area should we use in the walkthrough?'],
 ['Choosing an area changes examples only. Professional participation depends on appropriate credentials, jurisdiction, and practice fit.','These four are demonstration examples, not the limits of Smarter Justice. The platform supports a broader legal-area directory. Participation still depends on appropriate credentials, jurisdiction, and practice fit.'],
 ['1. One roof','1. The whole path'],['2. Growth','2. Public starting point'],['3. Professional record','3. Your presence'],['4. Preparation','4. Better preparation'],['5. Operations','5. Firm workspace'],['6. Compliance & rollout','6. Marketing guardrails'],['7. Continue','7. Next step'],
 ['Growth starts where people already need help','What the prospective client sees first'],['Professional record','Your professional presence'],['Better-prepared prospects','Before the person contacts the firm'],['<p class="eyebrow">Operations</p>','<p class="eyebrow">Inside the firm workspace</p>'],['Compliance and rollout truth','Marketing guardrails'],
 ['Grow with guardrails, without pretending every capability is already live.','Check marketing before publication—and require human review when the rules are uncertain.'],
 ['<p class="eyebrow">Continue</p><h2>Choose the next step that fits your firm.</h2>','<p class="eyebrow">Your next step</p><h2>Find your profile, create one if needed, or continue into the professional workspace.</h2>'],
 ['Find, claim, or create a profile','Find or create my professional profile'],['Law firm platform','Professional workspace'],['Review membership','See free profile + optional growth']
 ]; for(const [a,b] of pairs)r(x,a,b); save(x);
}

// Profile lookup: remove legacy/migration presentation.
{
 const x=mark(page('professionals.html'),'PROFILE_LOOKUP','<body class="professional-directory-page">');
 const pairs=[
 ['Find or Claim an Existing Profile','Find or Claim Your Professional Profile'],['temporary noindexed lookup','source-backed profile search'],['Focused Portals','Legal Areas'],['Find or Claim Profile','Find My Profile'],['For Professionals','Attorney Tour</a><a href="/professional-membership.html">Professional Options'],['Join the Network','Create Professional Account'],['Temporary profile lookup','Professional profile search'],['Find or claim an existing professional profile.','Find your professional profile—or create one if it is not here yet.'],['Choose a Focused Portal','Search My Profile'],['Attorney or Firm Account','Create or Claim a Profile'],['Existing source-backed records','Source-backed professional records'],['Locate a profile before claiming or correcting it','Search first, then claim, correct, or create'],['Temporary claim and migration lookup','Can’t find the exact record?'],['Compatibility lookup','Professional profile lookup'],['New York attorney profile launch','Attorney profile setup'],['Starting with useful New York attorney and firm profiles','Search first. Create only when needed.'],['View Membership','Return to Attorney Tour'],['focused legal portals','Smarter Justice legal areas'],['focused legal portal','Smarter Justice legal area'],['focused portal','legal area'],['legacy lookup','profile lookup']
 ]; for(const [a,b] of pairs)r(x,a,b); save(x);
}

// Claim/create pathway: broader legal-area model.
{
 const x=mark(page('attorney-launch.html'),'ATTORNEY_LAUNCH','<body class="attorney-launch-page">');
 const pairs=[
 ['Attorney Profile Launch','Claim or Create Your Attorney Profile'],['Manage one professional record across four focused legal portals.','Find, claim, or create your professional presence in one place.'],['Find or Claim My Profile','Search for My Profile'],['Initial participating portals','Demonstration legal-area examples'],['Choose only the specialties that accurately fit your practice.','Choose the legal areas that accurately fit your practice.'],['Continue with Selected Portals','Continue with Selected Legal Areas'],['Prepare each portal presence','Choose accurate legal areas'],['Approve publication separately','Review public participation separately'],['portal-interest information','practice-area interest information'],['Portal interests','Legal-area interests'],['micro-portal owns','Smarter Justice review controls govern'],['four focused legal portals','Smarter Justice legal areas'],['focused legal portals','Smarter Justice legal areas'],['portal participation','practice-area participation']
 ]; for(const [a,b] of pairs)r(x,a,b); save(x);
}

// Membership: same value proposition and vocabulary as tour.
{
 const x=mark(page('professional-membership.html'),'MEMBERSHIP','<body class="professional-membership-page">');
 const pairs=[
 ['Attorney and law-firm network','Attorneys and law firms'],['Control your basic profile free. Add paid growth only when it fits your practice.','Start with free profile control. Add paid growth only when it is open and useful.'],['Profile Lookup','Find My Profile'],['portal participation','practice-area participation'],['portal interests','legal-area interests'],['Initial legal launch portals','Continue the attorney demonstration'],['See the initial four-portal network','See the professional pathway in context'],['View Initial Launch Portals','Return to Attorney Demonstration'],['participating specialty portals','Smarter Justice legal areas']
 ]; for(const [a,b] of pairs)r(x,a,b); save(x);
}

// Signup: one-platform language and monthly-only pilot consistency.
{
 const x=mark(page('professional-signup.html'),'SIGNUP','<body class="professional-signup-page">');
 const annual=/<label class="account-type-card"><input name="billingCadence" type="radio" value="annual">[\s\S]*?<\/label>/;
 x.s=x.s.replace(annual,'');
 const pairs=[
 ['Public specialty profiles stay on the legal portals','One account across Smarter Justice legal areas'],['Publication on a focused micro-portal','Public participation in Smarter Justice legal areas'],['firm authority, and portal participation','firm authority, and practice-area participation'],['selected Smarter Justice practice areas','selected Smarter Justice legal areas'],['Initial legal portals that fit your work','Legal areas that fit your work'],['Full public profiles remain on the focused portal.','Public participation is reviewed separately.'],['Need another specialty later? Your central account can request additional portals after this initial pilot is proven.','Need another area? Your professional account can request additional Smarter Justice legal areas as coverage expands.'],['Current internal pilot preview only; final terms require owner approval.','Monthly is the currently approved pilot cadence. Final checkout terms are shown before any payment.'],['focused-portal platform','Smarter Justice legal-area platform'],['membership, payment, participation, and optional opportunities remain separate.','membership, payment, practice-area participation, and optional opportunities remain separate.']
 ]; for(const [a,b] of pairs)r(x,a,b); save(x);
}
console.log('PRE50_ATTORNEY_DEMO_PATH_APPLIED');
