'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98', pub=path.join(root,'public');
const MARK='SMARTER_JUSTICE_PRE52_ATTORNEY_VALUE_CLARITY';
function page(name){const p=path.join(pub,name);if(!fs.existsSync(p))throw new Error(`PRE52 missing ${name}`);return{p,s:fs.readFileSync(p,'utf8')}}
function save(x){fs.writeFileSync(x.p,x.s,'utf8')}
function replace(x,a,b,label){if(!x.s.includes(a))throw new Error(`PRE52 seam missing ${label||a.slice(0,70)}`);x.s=x.s.split(a).join(b);return x}
function mark(x,label,needle){if(!x.s.includes(MARK)){if(!x.s.includes(needle))throw new Error(`PRE52 marker seam missing ${label}`);x.s=x.s.replace(needle,needle+`<!-- ${MARK}_${label} -->`)}return x}

// Fast attorney-call page: explain the value in the language a lawyer uses on a sales/demo call.
{
 const x=mark(page('attorney-call-tour.html'),'QUICK','<!-- SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH_QUICK -->');
 const pairs=[
 ['See the complete path—from a person needing legal help to a better-prepared professional opportunity.','Help more of the right people find your firm—and make the path from first click to follow-up easier.'],
 ['In a few minutes, see what a prospective client sees, how your professional presence fits into that journey, what better preparation can look like before contact, and how Smarter Justice connects growth, operations, and marketing guardrails for the firm.','In about three minutes, see how Smarter Justice connects public legal starting help with your professional profile, better-prepared inquiries, firm follow-up, and marketing checks—without pretending unfinished features are already live.'],
 ['<h2>Growth</h2><p>Professional presence across relevant legal areas, public preparation tools, source attribution, referral foundations, and controlled future growth tools.</p>','<h2>Be easier to find</h2><p>Give people a clear, source-backed way to learn about you in the Smarter Justice legal areas that fit your practice and move toward a professional next step.</p>'],
 ['<h2>Operations</h2><p>Firm and office controls plus native-first contact, inquiry, intake, appointment, task, communication, consent, campaign, and handoff foundations.</p>','<h2>Make follow-up easier</h2><p>Keep inquiry source, contact details, communication choices, tasks, appointments, and handoffs connected so your team can see what should happen next.</p>'],
 ['<h2>Compliance</h2><p>Sourced, versioned jurisdiction rules can check marketing claims, specialist language, responsible-lawyer identification, solicitation method, and other requirements before publication, with human review when uncertain.</p>','<h2>Market with guardrails</h2><p>Check mapped attorney-advertising issues before publication, see why something was flagged, and require human review when the rules are uncertain or not current enough.</p>'],
 ['<strong>Discovery keeps its source</strong><span>Know how an opportunity arrived without requiring a private matter narrative for attribution.</span>','<strong>Know what brought the inquiry</strong><span>Keep useful source information without requiring a private matter story just to understand where the opportunity came from.</span>'],
 ['<strong>Intake keeps its consent</strong><span>Suppression and communication choices should survive imports, sync, and handoffs.</span>','<strong>Respect communication choices</strong><span>Keep opt-out and contact preferences connected as information moves through the firm workflow.</span>'],
 ['<strong>Marketing keeps its evidence</strong><span>Rule sources, version, review result, and reasons can be preserved instead of relying on memory.</span>','<strong>See why marketing was flagged</strong><span>Preserve the rule source, review result, and reason instead of relying on memory or a vague warning.</span>'],
 ['<strong>Feature status stays truthful</strong><span>Available, foundation, and gated capabilities are shown separately; payment does not turn an unfinished feature live.</span>','<strong>Know what works now</strong><span>Working, developing, and gated capabilities stay separate so a paid plan never makes an unfinished feature appear ready.</span>']
 ]; for(const [a,b] of pairs) replace(x,a,b); save(x);
}

// Full attorney tour: benefit-first language, while preserving capability truth and compliance boundaries.
{
 const x=mark(page('attorney-partner-tour.html'),'FULL','<!-- SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH_FULL -->');
 const pairs=[
 ['See the path your prospective client and your firm can follow—start to finish.','See how Smarter Justice can help your firm be found, receive better-prepared inquiries, stay organized, and market with guardrails.'],
 ['Smarter Justice is more than a profile or lead listing. The professional platform is being built to help firms attract the right opportunities, organize the work that follows, and put jurisdiction-aware marketing checks before publication—all while connecting to the same public network people use to understand where to start.','Smarter Justice connects the public place where people start organizing a legal problem with the professional side of your firm. The goal is simple: help the right people find you, help them arrive better prepared, keep follow-up organized, and add attorney-marketing checks before publication.'],
 ['<strong>Growth</strong><span>Professional presence, better-prepared prospects, attribution, and future campaign tools.</span>','<strong>Get discovered</strong><span>Professional presence in relevant legal areas and a clearer path from public help to your firm.</span>'],
 ['<strong>Operations</strong><span>Firm, intake, contact, task, communication, consent, and handoff foundations.</span>','<strong>Handle inquiries</strong><span>Keep source, contacts, tasks, appointments, communication choices, and handoffs organized.</span>'],
 ['<strong>Compliance</strong><span>Sourced, jurisdiction-aware marketing review with explainable flags and human-review fallbacks.</span>','<strong>Market responsibly</strong><span>Use sourced attorney-marketing checks, understandable flags, and human review when the answer is uncertain.</span>'],
 ['Three connected jobs: grow the firm, run the workflow, and market responsibly.','What Smarter Justice is designed to do for your firm.'],
 ['Growth should not end at a profile view. Operations should not begin with re-keying the same information into another disconnected system. Compliance should not be a last-minute disclaimer check. Smarter Justice is building these as connected layers with clear feature-state boundaries.','People should be able to move from legal starting help to the right professional next step without your team rebuilding the same information from scratch. Smarter Justice connects discovery, preparation, firm follow-up, and marketing review while keeping unfinished capabilities clearly labeled.'],
 ['<h3>Growth</h3><p>Public discovery, professional presence, better-prepared prospects, attribution, referrals, and gated growth tools.</p>','<h3>Help people find you</h3><p>Show a source-backed professional presence in relevant legal areas and give people a clearer route from legal starting help to your firm.</p>'],
 ['<h3>Operations</h3><p>Firm roles, offices, intake, contacts, appointments, tasks, communications, consent, and handoffs.</p>','<h3>Keep the next step organized</h3><p>Connect firm roles, inquiries, contacts, appointments, tasks, communication choices, and handoffs so your team can see what needs attention.</p>'],
 ['<h3>Compliance</h3><p>Jurisdiction-aware prepublication review, sourced rules, explainable flags, evidence, and human review when uncertain.</p>','<h3>Check marketing before it goes out</h3><p>Review mapped advertising issues against sourced rules, explain flags, preserve evidence, and require human review when the system cannot determine the answer confidently.</p>'],
 ['Growth starts where people already need help','Where a new client relationship can begin'],
 ['People can begin with their situation, a focused legal area, a free tool, or a professional search. The goal is not just more traffic; it is a clearer path from need to an appropriate professional.','People can begin with their situation, a Smarter Justice legal area, a free preparation tool, or a professional search. The aim is not empty traffic—it is a clearer path from a real legal need to an appropriate professional next step.'],
 ['One controlled record can support discovery, firm administration, and future operating workflows.','Keep your professional presence connected to your firm.'],
 ['Profile control, firm relationships, credential review, practice-area fit, consent, membership, and paid growth remain separate states instead of being blurred into one approval.','Your profile, firm relationship, credential review, practice fit, communication choices, membership, and optional paid growth stay separate so one status never falsely implies another.'],
 ['Move from inquiry to organized work without losing source, consent, or responsibility.','Move from inquiry to follow-up with the important context still attached.'],
 ['<span>Firm & office</span><strong>Roles and seats</strong><p>Keep firm, office, professional, payer, and administrative roles distinct.</p>','<span>Firm & office</span><strong>Know who can do what</strong><p>Keep attorney, staff, office, billing, and administrative responsibilities clear.</p>'],
 ['<span>Intake</span><strong>Structured lifecycle</strong><p>Contact, inquiry, intake, appointment, task, communication, and handoff foundations share one model.</p>','<span>Intake</span><strong>Keep the next step visible</strong><p>Connect contact, inquiry, intake, appointment, task, communication, and handoff information instead of scattering it across disconnected steps.</p>'],
 ['<span>Consent</span><strong>Suppression travels with the record</strong><p>Opt-out and communication preferences are not discarded during imports or sync.</p>','<span>Communication choices</span><strong>Honor what the person asked for</strong><p>Keep opt-out and contact preferences attached when information moves through approved imports, sync, or handoffs.</p>'],
 ['<span>Attribution</span><strong>Know what created the opportunity</strong><p>Growth events can preserve source context without requiring a private matter narrative.</p>','<span>Source</span><strong>Know what brought the inquiry</strong><p>Preserve useful source context without requiring a private matter narrative just to measure where an opportunity came from.</p>'],
 ['<span>Interoperability</span><strong>Native, hybrid, or external-primary</strong><p>Firms are not forced into a one-day all-or-nothing migration.</p>','<span>Flexibility</span><strong>Work alongside systems you already use</strong><p>Smarter Justice can be introduced in stages instead of forcing an all-or-nothing systems change.</p>'],
 ['<span>Security</span><strong>Purpose-limited access</strong><p>Professional and firm controls remain subject to identity, authority, and tenant boundaries.</p>','<span>Security</span><strong>Limit access by role and firm</strong><p>Professional and firm information stays subject to identity checks, authority, and firm-level access boundaries.</p>'],
 ['Marketing Compliance Engine foundations use sourced, versioned rules and human-review fallbacks.','Attorney-marketing checks use sourced, versioned rules and send uncertain questions to human review.'],
 ['Checks progressively cover claims, testimonials, disclaimers, responsible-lawyer identification, solicitation method, and filing or retention requirements where applicable.','Checks progressively cover claims, testimonials, disclaimers, responsible-lawyer identification, solicitation methods, and filing or record-retention requirements where mapped.'],
 ['Unmapped, stale, or conflicting rules fail closed or require human review.','If a rule is missing, stale, conflicting, or unclear, the system does not give a false approval—it requires human review.'],
 ['Full nationwide marketing-compliance automation, unrestricted outbound campaigns, AI front desk, and automatic CRM migration remain gated until qualified.','Nationwide automated compliance approval, unrestricted outbound campaigns, AI front-desk functions, and automatic CRM migration remain gated until they are separately qualified.'],
 ['The difference is the connection.','Why Smarter Justice is different'],
 ['Growth platforms often stop at intake. Practice systems often start after intake. Compliance is often a separate manual checklist. Smarter Justice is building a professional layer where growth, operating context, and marketing guardrails can share one governed foundation while the public starting experience remains simple.','Many products focus on only one part of the journey. Smarter Justice is connecting public legal starting help, professional discovery, better preparation, firm follow-up, and attorney-marketing guardrails in one governed path—while keeping the public experience simple and the status of each feature truthful.']
 ]; for(const [a,b] of pairs) replace(x,a,b); save(x);
}

// Membership: put immediate value before platform terminology.
{
 const x=mark(page('professional-membership.html'),'MEMBERSHIP','<!-- SMARTER_JUSTICE_PRE50_ATTORNEY_DEMO_PATH_MEMBERSHIP -->');
 const pairs=[
 ['Start with free profile control. Add paid growth only when it is open and useful.','Control your basic professional profile for free. Add optional paid growth only when the feature is actually available and useful to your practice.'],
 ['See the professional pathway in context','See what Smarter Justice can do for your firm'],
 ['Return to the attorney demonstration to see how public starting help, professional presence, preparation, firm workflow, and marketing guardrails connect.','See how public legal starting help can connect to your professional presence, better-prepared inquiries, firm follow-up, and attorney-marketing guardrails.']
 ]; for(const [a,b] of pairs) if(x.s.includes(a)) replace(x,a,b); save(x);
}

// Final attorney-facing jargon and stale-portal guard. These terms are appropriate internally but not on the sales/demo pathway.
const visible=['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html'];
const scrub=[
 [/native-first/gi,'connected'],[/external-primary/gi,'existing-system'],[/suppression travels with the record/gi,'communication choices stay attached'],[/purpose-limited access/gi,'role-based access'],[/structured lifecycle/gi,'organized follow-up'],[/professional record/gi,'professional profile']
];
for(const name of visible){const x=page(name);for(const [re,to] of scrub)x.s=x.s.replace(re,to);save(x)}

// Attorney-tour-only visual polish: preserve global design while improving scanability and avoiding a redesign-for-redesign's-sake.
{
 const p=path.join(pub,'styles.css'); if(!fs.existsSync(p))throw new Error('PRE52 missing styles.css'); let s=fs.readFileSync(p,'utf8');
 if(!s.includes(MARK)) s+=`\n/* ${MARK} */\n.attorney-partner-tour-page .tour-hero-copy .lead,.attorney-partner-tour-page .tour-step-content>p{max-width:860px}.attorney-partner-tour-page .tour-proof-grid strong{font-size:1.04rem}.attorney-partner-tour-page .tour-dashboard-preview strong{line-height:1.2}.attorney-partner-tour-page .tour-dashboard-preview p{margin-top:.35rem}.attorney-partner-tour-page .tour-step-content h2{max-width:900px}.attorney-call-tour-page .cards .card h2{line-height:1.15}\n`;
 fs.writeFileSync(p,s,'utf8');
}

// Advance runtime release/demo identity without changing the pre51 no-store protection or deployment hold.
{
 const p=path.join(root,'server.js'); let s=fs.readFileSync(p,'utf8');
 if(!s.includes('SMARTER_JUSTICE_PRE51_PUBLIC_DOMAIN_RELEASE_IDENTITY'))throw new Error('PRE52 requires pre51 release identity');
 s=s.replace("release:'v2.0.0-pre51'","release:'v2.0.0-pre52'");
 s=s.replace("demoPathRelease:'v2.0.0-pre50'","demoPathRelease:'v2.0.0-pre52'");
 s=s.replace("headers['X-Smarter-Justice-Demo-Path'] = 'v2.0.0-pre50';","headers['X-Smarter-Justice-Demo-Path'] = 'v2.0.0-pre52';");
 s=s.replace("marker:'SMARTER_JUSTICE_PRE51_PUBLIC_DOMAIN_RELEASE_IDENTITY'","marker:'SMARTER_JUSTICE_PRE52_ATTORNEY_VALUE_CLARITY'");
 fs.writeFileSync(p,s,'utf8');
}
console.log('PRE52_ATTORNEY_VALUE_CLARITY_APPLIED');
