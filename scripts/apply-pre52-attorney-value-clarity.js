'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98', pub=path.join(root,'public');
const MARK='SMARTER_JUSTICE_PRE52_ATTORNEY_VALUE_CLARITY';
const PUBMARK='SMARTER_JUSTICE_PRE52_PUBLICATION_GATE';
function page(name){const p=path.join(pub,name);if(!fs.existsSync(p))throw new Error(`PRE52 missing ${name}`);return{p,s:fs.readFileSync(p,'utf8')}}
function save(x){fs.writeFileSync(x.p,x.s,'utf8')}
function replace(x,a,b,label){if(!x.s.includes(a))throw new Error(`PRE52 seam missing ${label||a.slice(0,70)}`);x.s=x.s.split(a).join(b);return x}
function mark(x,label,needle){if(!x.s.includes(MARK)){if(!x.s.includes(needle))throw new Error(`PRE52 marker seam missing ${label}`);x.s=x.s.replace(needle,needle+`<!-- ${MARK}_${label} -->`)}return x}

// Fast attorney-call page: lead with working value, not internal architecture or future capability.
{
 const x=mark(page('attorney-call-tour.html'),'QUICK','<!-- SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH_QUICK -->');
 const pairs=[
 ['See the complete path—from a person needing legal help to a better-prepared professional opportunity.','Help more of the right people find your firm—and show them a clearer path to the next step.'],
 ['In a few minutes, see what a prospective client sees, how your professional presence fits into that journey, what better preparation can look like before contact, and how Smarter Justice connects growth, operations, and marketing guardrails for the firm.','In about three minutes, see how Smarter Justice connects public legal starting help with your professional profile, better preparation before contact, and attorney-marketing checks that fail safely when the rules are uncertain.'],
 ['<h2>Growth</h2><p>Professional presence across relevant legal areas, public preparation tools, source attribution, referral foundations, and controlled future growth tools.</p>','<h2>Be easier to find</h2><p>Give people a clear, source-backed way to learn about you in the Smarter Justice legal areas that fit your practice and move toward a professional next step.</p>'],
 ['<h2>Operations</h2><p>Firm and office controls plus native-first contact, inquiry, intake, appointment, task, communication, consent, campaign, and handoff foundations.</p>','<h2>Help people arrive better prepared</h2><p>Public tools can help people organize facts, dates, documents, and questions before they contact a professional, without pretending the tool is a lawyer.</p>'],
 ['<h2>Compliance</h2><p>Sourced, versioned jurisdiction rules can check marketing claims, specialist language, responsible-lawyer identification, solicitation method, and other requirements before publication, with human review when uncertain.</p>','<h2>Market with guardrails</h2><p>Check mapped attorney-advertising issues before publication, see why something was flagged, and require human review when the rules are uncertain or not current enough.</p>'],
 ['<strong>Discovery keeps its source</strong><span>Know how an opportunity arrived without requiring a private matter narrative for attribution.</span>','<strong>One connected starting point</strong><span>People can move from a legal-area starting point or Navigator toward public preparation and professional discovery without bouncing among separate products.</span>'],
 ['<strong>Intake keeps its consent</strong><span>Suppression and communication choices should survive imports, sync, and handoffs.</span>','<strong>Preparation before contact</strong><span>People can organize useful facts, dates, documents, and questions before reaching out to a professional.</span>'],
 ['<strong>Marketing keeps its evidence</strong><span>Rule sources, version, review result, and reasons can be preserved instead of relying on memory.</span>','<strong>See why marketing was flagged</strong><span>Preserve the rule source, review result, and reason instead of relying on memory or a vague warning.</span>'],
 ['<strong>Feature status stays truthful</strong><span>Available, foundation, and gated capabilities are shown separately; payment does not turn an unfinished feature live.</span>','<strong>Only working features are shown publicly</strong><span>Unfinished capabilities remain preserved for development but stay out of ordinary public navigation until they are satisfactorily implemented and tested.</span>'],
 ['href="/attorney-partner-tour.html?mode=presenter&practice=divorce">Start the guided demonstration</a><a class="secondary button-link" href="/growth-operations-compliance.html">See the professional workspace</a>','href="/attorney-partner-tour.html?mode=presenter&practice=divorce">Start the guided demonstration</a><a class="secondary button-link" href="/professional-growth.html">Try the marketing preflight</a>']
 ]; for(const [a,b] of pairs) replace(x,a,b); save(x);
}

// Full attorney tour: make the seven-step demonstration itself the sales proof.
{
 const x=mark(page('attorney-partner-tour.html'),'FULL','<!-- SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH_FULL -->');
 const pairs=[
 ['See the path your prospective client and your firm can follow—start to finish.','See what Smarter Justice can demonstrate for your firm today—start to finish.'],
 ['Smarter Justice is more than a profile or lead listing. The professional platform is being built to help firms attract the right opportunities, organize the work that follows, and put jurisdiction-aware marketing checks before publication—all while connecting to the same public network people use to understand where to start.','Smarter Justice connects the public place where people start organizing a legal problem with professional discovery and attorney-side tools. The goal is simple: help the right people find you, help them arrive better prepared, and give your firm practical marketing guardrails without presenting unfinished features as ready.'],
 ['<strong>Growth</strong><span>Professional presence, better-prepared prospects, attribution, and future campaign tools.</span>','<strong>Get discovered</strong><span>Professional presence in relevant legal areas and a clearer path from public help to a professional next step.</span>'],
 ['<strong>Operations</strong><span>Firm, intake, contact, task, communication, consent, and handoff foundations.</span>','<strong>Better preparation</strong><span>Public tools help people organize useful information before they contact a professional.</span>'],
 ['<strong>Compliance</strong><span>Sourced, jurisdiction-aware marketing review with explainable flags and human-review fallbacks.</span>','<strong>Market responsibly</strong><span>Use sourced attorney-marketing checks, understandable flags, and human review when the answer is uncertain.</span>'],
 ['Three connected jobs: grow the firm, run the workflow, and market responsibly.','Three working advantages attorneys can understand quickly.'],
 ['Growth should not end at a profile view. Operations should not begin with re-keying the same information into another disconnected system. Compliance should not be a last-minute disclaimer check. Smarter Justice is building these as connected layers with clear feature-state boundaries.','Smarter Justice connects public legal starting help, source-backed professional discovery, better preparation before contact, and attorney-marketing checks in one platform. That connection is the current demonstration; unfinished operating features remain out of ordinary public view until qualified.'],
 ['<h3>Growth</h3><p>Public discovery, professional presence, better-prepared prospects, attribution, referrals, and gated growth tools.</p>','<h3>Help people find you</h3><p>Show a source-backed professional presence in relevant Smarter Justice legal areas and give people a clearer route from legal starting help to a professional next step.</p>'],
 ['<h3>Operations</h3><p>Firm roles, offices, intake, contacts, appointments, tasks, communications, consent, and handoffs.</p>','<h3>Help people prepare before contact</h3><p>Public preparation tools can organize facts, dates, documents, and questions so a conversation with a professional can start with better context.</p>'],
 ['<h3>Compliance</h3><p>Jurisdiction-aware prepublication review, sourced rules, explainable flags, evidence, and human review when uncertain.</p>','<h3>Check marketing before it goes out</h3><p>Review mapped advertising issues against sourced rules, explain flags, preserve evidence, and require human review when the system cannot determine the answer confidently.</p>'],
 ['Growth starts where people already need help','Where a new professional relationship can begin'],
 ['People can begin with their situation, a focused legal area, a free tool, or a professional search. The goal is not just more traffic; it is a clearer path from need to an appropriate professional.','People can begin with their situation, a Smarter Justice legal area, Navigator, a free preparation tool, or a professional search. The aim is not empty traffic—it is a clearer path from a real legal need to an appropriate professional next step.'],
 ['One controlled record can support discovery, firm administration, and future operating workflows.','Keep your professional presence connected to the legal areas you actually handle.'],
 ['Profile control, firm relationships, credential review, practice-area fit, consent, membership, and paid growth remain separate states instead of being blurred into one approval.','Your profile, firm relationship, credential review, practice fit, membership, and optional paid growth stay separate so one status never falsely implies another.'],
 ['5. Firm workspace','5. Working today'],
 ['<p class="eyebrow">Inside the firm workspace</p>','<p class="eyebrow">Working today</p>'],
 ['Move from inquiry to organized work without losing source, consent, or responsibility.','Demonstrate the pieces attorneys and prospective clients can use now.'],
 ['Marketing Compliance Engine foundations use sourced, versioned rules and human-review fallbacks.','Attorney-marketing checks use sourced, versioned rules and send uncertain questions to human review.'],
 ['Checks progressively cover claims, testimonials, disclaimers, responsible-lawyer identification, solicitation method, and filing or retention requirements where applicable.','Checks progressively cover claims, testimonials, disclaimers, responsible-lawyer identification, solicitation methods, and filing or record-retention requirements where mapped.'],
 ['Unmapped, stale, or conflicting rules fail closed or require human review.','If a rule is missing, stale, conflicting, or unclear, the system does not give a false approval—it requires human review.'],
 ['The difference is the connection.','Why Smarter Justice is different'],
 ['Growth platforms often stop at intake. Practice systems often start after intake. Compliance is often a separate manual checklist. Smarter Justice is building a professional layer where growth, operating context, and marketing guardrails can share one governed foundation while the public starting experience remains simple.','Many products focus on only one part of the journey. Smarter Justice connects public legal starting help, Navigator, professional discovery, better preparation, and attorney-marketing guardrails in one governed path while keeping the public experience simple.']
 ]; for(const [a,b] of pairs) if(x.s.includes(a)) replace(x,a,b);
 // Replace the former future-facing firm-workspace preview with only currently demonstrable surfaces.
 const dashboard=/<article class="tour-step" id="tour-dashboard">[\s\S]*?(?=<article class="tour-step" id="tour-membership">)/;
 if(!dashboard.test(x.s))throw new Error('PRE52 dashboard section seam missing');
 x.s=x.s.replace(dashboard,`<article class="tour-step" id="tour-dashboard"><div class="tour-step-number">5</div><div class="tour-step-content"><p class="eyebrow">Working today</p><h2>Four things you can demonstrate on the live platform.</h2><div class="tour-dashboard-preview"><article><span>Starting help</span><strong>Smarter Justice legal areas</strong><p>Show how a person can start in the legal area that matches the problem without leaving the main Smarter Justice platform.</p></article><article><span>Navigator</span><strong>AI-assisted organization with a no-AI option</strong><p>Show the governed public Navigator and its rules-based fallback without claiming that AI replaces a lawyer.</p></article><article><span>Professional presence</span><strong>Search, claim, or create a profile</strong><p>Show the source-backed professional search and the path for an attorney or firm to take control of its presence.</p></article><article><span>Preparation</span><strong>Free public tools</strong><p>Show tools that help people organize facts, dates, documents, and questions before contacting a professional.</p></article></div><a class="tour-next-link" href="#tour-membership">Next: marketing guardrails</a></div></article>`);
 // Do not advertise specific future capabilities on the public demonstration.
 x.s=x.s.replace(/<li>Full nationwide marketing-compliance automation, unrestricted outbound campaigns, AI front desk, and automatic CRM migration remain gated until qualified\.<\/li>/gi,'');
 x.s=x.s.replace(/<li>Nationwide automated compliance approval, unrestricted outbound campaigns, AI front-desk functions, and automatic CRM migration remain gated until they are separately qualified\.<\/li>/gi,'');
 x.s=x.s.replaceAll('href="/growth-operations-compliance.html"','href="/professional-growth.html"');
 x.s=x.s.replaceAll('See the full platform story','Try the marketing preflight');
 x.s=x.s.replaceAll('Law firm platform','Attorney marketing preflight');
 save(x);
}

// Membership: immediate truthful value, no future-feature sales pitch.
{
 const x=mark(page('professional-membership.html'),'MEMBERSHIP','<!-- SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH_MEMBERSHIP -->');
 const pairs=[
 ['Start with free profile control. Add paid growth only when it is open and useful.','Control your basic professional profile for free. Optional paid growth is offered only where the corresponding feature is actually available and qualified.'],
 ['See the professional pathway in context','See what Smarter Justice can demonstrate for your firm'],
 ['Return to the attorney demonstration to see how public starting help, professional presence, preparation, firm workflow, and marketing guardrails connect.','See how public legal starting help connects to professional discovery, better preparation, Navigator, and attorney-marketing guardrails.']
 ]; for(const [a,b] of pairs) if(x.s.includes(a)) replace(x,a,b); x.s=x.s.replaceAll('href="/growth-operations-compliance.html"','href="/attorney-partner-tour.html?mode=presenter&practice=divorce"'); save(x);
}

// Final attorney-facing jargon and stale-portal guard. Preserve internal terms in source contracts, not in the sales/demo copy.
const visible=['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html'];
const scrub=[
 [/native-first/gi,'connected'],[/external-primary/gi,'existing-system'],[/suppression travels with the record/gi,'communication choices stay attached'],[/purpose-limited access/gi,'role-based access'],[/structured lifecycle/gi,'organized follow-up'],[/professional record/gi,'professional profile'],[/focused legal portals/gi,'Smarter Justice legal areas'],[/focused legal portal/gi,'Smarter Justice legal area'],[/focused micro-portals/gi,'Smarter Justice legal areas'],[/focused micro-portal/gi,'Smarter Justice legal area']
];
for(const name of visible){const x=page(name);for(const [re,to] of scrub)x.s=x.s.replace(re,to);x.s=x.s.replaceAll('href="/portals.html"','href="/practice-areas.html"');x.s=x.s.replaceAll('href="/growth-operations-compliance.html"','href="/attorney-partner-tour.html?mode=presenter&practice=divorce"');save(x)}

// Remove ordinary links to preserved-but-unqualified public story/legacy routes across the whole public tree.
for(const name of fs.readdirSync(pub).filter(n=>n.endsWith('.html'))){const x=page(name);x.s=x.s.replaceAll('href="/portals.html"','href="/practice-areas.html"');x.s=x.s.replaceAll('href="/growth-operations-compliance.html"','href="/attorney-call-tour.html"');save(x)}

// Slightly reduce oversized desktop/laptop headings and improve attorney-tour scanability; preserve mobile sizing.
{
 const p=path.join(pub,'styles.css'); if(!fs.existsSync(p))throw new Error('PRE52 missing styles.css'); let s=fs.readFileSync(p,'utf8');
 if(!s.includes(MARK)) s+=`\n/* ${MARK} */\n.attorney-partner-tour-page .tour-hero-copy .lead,.attorney-partner-tour-page .tour-step-content>p{max-width:860px}.attorney-partner-tour-page .tour-proof-grid strong{font-size:1.04rem}.attorney-partner-tour-page .tour-dashboard-preview strong{line-height:1.2}.attorney-partner-tour-page .tour-dashboard-preview p{margin-top:.35rem}.attorney-partner-tour-page .tour-step-content h2{max-width:900px}.attorney-call-tour-page .cards .card h2{line-height:1.15}@media(min-width:721px){.hero h1{font-size:clamp(2.2rem,5.4vw,4.45rem)}.page-hero h1{font-size:clamp(2rem,4.2vw,3.75rem)}.attorney-partner-tour-page .tour-hero h1{font-size:clamp(2.25rem,4.5vw,4rem)}}\n`;
 fs.writeFileSync(p,s,'utf8');
}

// Advance release identity, preserve pre51 no-store protection, and hide unqualified public routes while retaining their source files.
{
 const p=path.join(root,'server.js'); let s=fs.readFileSync(p,'utf8');
 if(!s.includes('SMARTER_JUSTICE_PRE51_PUBLIC_DOMAIN_RELEASE_IDENTITY'))throw new Error('PRE52 requires pre51 release identity');
 s=s.replace("release:'v2.0.0-pre51'","release:'v2.0.0-pre52'");
 s=s.replace("demoPathRelease:'v2.0.0-pre50'","demoPathRelease:'v2.0.0-pre52'");
 s=s.replace("headers['X-Smarter-Justice-Demo-Path'] = 'v2.0.0-pre50';","headers['X-Smarter-Justice-Demo-Path'] = 'v2.0.0-pre52';");
 s=s.replace("marker:'SMARTER_JUSTICE_PRE51_PUBLIC_DOMAIN_RELEASE_IDENTITY'","marker:'SMARTER_JUSTICE_PRE52_ATTORNEY_VALUE_CLARITY'");
 const seam="  if (!target.startsWith(PUBLIC)) return text(res, 403, 'Forbidden');";
 if(!s.includes(PUBMARK)){
   if(!s.includes(seam))throw new Error('PRE52 publication gate seam missing');
   s=s.replace(seam,seam+`\n  const pre52HiddenPublicPage = new Set(['/growth-operations-compliance.html','/portals.html']).has(p); // ${PUBMARK}\n  if (pre52HiddenPublicPage && !envFlag('SJ_PREVIEW_UNFINISHED_PUBLIC_FEATURES')) return text(res, 404, 'Not found');`);
 }
 fs.writeFileSync(p,s,'utf8');
}
console.log('PRE52_ATTORNEY_VALUE_CLARITY_APPLIED');
