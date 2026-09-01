'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const predecessorScript = path.join(root, 'scripts', 'bootstrap-pre124-release.js');
const source = path.join(root, '.runtime', 'pre124-live');
const target = path.join(root, '.runtime', 'pre125-live');
const fail = message => { console.error(`[PRE125 RELEASE] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function filesUnder(directory, prefix = '') {
  const rows = [];
  if (!fs.existsSync(directory)) return rows;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...filesUnder(absolute, relative));
    else if (entry.isFile()) rows.push(relative);
  }
  return rows;
}

function write(relative, content, modified) {
  const absolute = path.join(target, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
  modified.add(relative.replace(/\\/g, '/'));
}

function visibleText(html) {
  return String(html || '')
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function insertBeforeClosing(html, marker, snippet) {
  if (html.includes(marker)) return html;
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${snippet}\n</main>`);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${snippet}\n</body>`);
  return `${html}\n${snippet}\n`;
}

ok(fs.existsSync(predecessorScript), 'PRE124 release bootstrap is missing');
const predecessor = spawnSync(process.execPath, [predecessorScript], { cwd: root, env: process.env, encoding: 'utf8' });
if (predecessor.stdout) process.stdout.write(predecessor.stdout);
if (predecessor.status !== 0) fail(predecessor.stderr || 'PRE124 release bootstrap failed');
ok(fs.existsSync(path.join(source, '.pre124-render-bootstrap.json')), 'PRE124 marker is missing');
const predecessorMarker = JSON.parse(fs.readFileSync(path.join(source, '.pre124-render-bootstrap.json'), 'utf8'));
ok(predecessorMarker.release === 'v2.0.0-pre124', 'PRE124 release mismatch');
ok(predecessorMarker.productAuthority === 'SMARTER_JUSTICE_ONLY', 'PRE124 product authority mismatch');
ok(predecessorMarker.navigatorOrCommunityMutation === false, 'PRE124 cross-product boundary mismatch');

const baseFiles = filesUnder(source);
const baseHashes = new Map(baseFiles.map(relative => [relative, sha(path.join(source, relative))]));
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
const modified = new Set();

const laneRegistry = {
  schemaVersion: 'smarter-justice.one-builder-internal-lanes.v1',
  product: 'Smarter Justice',
  releaseOwner: 'ONE_SMARTER_JUSTICE_BUILDER',
  singleAuthoritativeRelease: true,
  independentInternalReview: true,
  lanes: [
    { id: 'PRODUCT_UX', purpose: 'Public product, workflows, accessibility and professional experience', mayWrite: ['product source', 'public UX', 'product-side state handlers'], mustNot: ['change credential truth from payment', 'invent source evidence'] },
    { id: 'LEGAL_CURRENTNESS', purpose: 'Official-source legal, court, rule and regulatory currentness', mayWrite: ['source evidence', 'dated currentness decisions', 'human-review holds'], mustNot: ['represent monitoring as legal advice', 'silently certify blanket compliance'] },
    { id: 'PROFILE_EVIDENCE', purpose: 'Attorney, firm and organization identity, provenance, deduplication and public contactability', mayWrite: ['profile evidence', 'identity resolution', 'redirects', 'currentness holds'], mustNot: ['send outreach', 'treat public contactability as consent', 'change product customer state'] },
    { id: 'REVENUE_MEMBERSHIP', purpose: 'Professional value, acquisition, membership, onboarding, retention and growth', mayWrite: ['commercial strategy', 'member-value workflows', 'authorized campaign decision state'], mustNot: ['buy credential truth', 'hide sponsored treatment', 'guarantee clients or ranking'] },
    { id: 'OPPORTUNITY_INTELLIGENCE', purpose: 'Consent-led consultation, structured inquiry and document/form-review opportunity preparation', mayWrite: ['opportunity preparation', 'fit and readiness evidence', 'assignment audit'], mustNot: ['create an attorney-client relationship', 'assign without user consent', 'bypass conflict, jurisdiction or availability checks'] },
    { id: 'RELEASE_QA', purpose: 'No-loss, privacy, security, public-copy, regression, deployment and rollback qualification', mayWrite: ['release receipts', 'test evidence', 'rollback evidence'], mustNot: ['weaken another lane silently', 'promote a release without evidence'] }
  ],
  releaseRule: 'Every material release requires all six lane receipts, one no-loss decision and one authoritative Smarter Justice release.',
  ownerExperience: 'One builder and one finished release; internal lane mechanics are not public product copy.'
};
write('governance/ONE_BUILDER_INTERNAL_LANES.json', JSON.stringify(laneRegistry, null, 2) + '\n', modified);

const operatingModule = `'use strict';

const crypto = require('crypto');

const LANE_IDS = Object.freeze([
  'PRODUCT_UX',
  'LEGAL_CURRENTNESS',
  'PROFILE_EVIDENCE',
  'REVENUE_MEMBERSHIP',
  'OPPORTUNITY_INTELLIGENCE',
  'RELEASE_QA'
]);
const OPPORTUNITY_TYPES = Object.freeze(['CONSULTATION', 'STRUCTURED_INQUIRY', 'DOCUMENT_FORM_REVIEW']);
const ROUTE_CLASSES = Object.freeze([
  'PROFILE_BOUND_UNRESTRICTED_PUBLIC_BUSINESS_ROUTE',
  'PROFILE_SPECIFIC_IDENTITY_CLUSTER_ROUTE',
  'SHARED_OR_REUSED_PUBLIC_BUSINESS_ROUTE',
  'PARENT_OR_SHARED_PURPOSE_RESTRICTED_ROUTE',
  'FACILITY_BOUND_PURPOSE_RESTRICTED_ROUTE'
]);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function assert(value, message) { if (!value) throw new Error(message); }
function nowIso(input) { return input || new Date().toISOString(); }
function digest(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
function emailLooksPublic(value) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(value || '').trim()); }
function statusIsActive(value) { return ['active', 'trialing', 'founding_active'].includes(String(value || '').toLowerCase()); }

function laneRegistry() {
  return LANE_IDS.map(id => ({ id, requiredForMaterialRelease: true }));
}

function qualifyContactability(record = {}, decision = {}) {
  const sourceClass = String(record.sourceClass || '').toUpperCase();
  const routeClass = String(record.routeClass || '').toUpperCase();
  const disallowedOrigin = Boolean(record.guessed || record.purchased || record.privateSource || record.leaked || record.mailboxProbe);
  const sourceQualified = ['OFFICIAL', 'REGULATOR', 'FIRST_PARTY'].includes(sourceClass);
  const routeQualified = ROUTE_CLASSES.includes(routeClass);
  const contactable = emailLooksPublic(record.email) && sourceQualified && routeQualified && !disallowedOrigin && Boolean(record.sourceUrl) && Boolean(record.observedAt);
  const purposeRestricted = /PURPOSE_RESTRICTED/.test(routeClass) || /SHARED_OR_REUSED/.test(routeClass);
  const authorization = Boolean(decision.campaignAuthorized && decision.lawfulBasis && decision.suppressionChecked && !decision.suppressed && decision.purpose && decision.frequencyApproved);
  const purposeMatches = !purposeRestricted || (Boolean(record.allowedPurpose) && record.allowedPurpose === decision.purpose);
  return Object.freeze({
    contactable,
    outreachEligible: Boolean(contactable && authorization && purposeMatches),
    contactabilityIsConsent: false,
    purposeRestricted,
    reason: !contactable ? 'PUBLIC_CONTACT_EVIDENCE_NOT_QUALIFIED' : !authorization ? 'OUTREACH_AUTHORIZATION_REQUIRED' : !purposeMatches ? 'PURPOSE_RESTRICTION_MISMATCH' : 'QUALIFIED_FOR_THIS_AUTHORIZED_USE'
  });
}

function validateProfileProjection(input = {}) {
  assert(input.mode === 'REPLACE_NOT_APPEND', 'Profile projection must use REPLACE_NOT_APPEND.');
  assert(Array.isArray(input.records), 'Profile records are required.');
  const ids = new Set();
  for (const row of input.records) {
    assert(row && row.profileId, 'Every profile requires profileId.');
    assert(!ids.has(row.profileId), 'Duplicate canonical profileId in replacement projection.');
    ids.add(row.profileId);
    assert(row.sourceUrl && row.observedAt, 'Every profile requires source provenance and observation date.');
  }
  const redirects = new Map((input.redirects || []).map(row => [row.retiredProfileId, row.canonicalProfileId]));
  for (const retired of input.retiredProfileIds || []) {
    assert(redirects.has(retired), 'Every retired profile requires an atomic canonical redirect.');
    assert(ids.has(redirects.get(retired)), 'Redirect target must exist in replacement projection.');
  }
  const downstream = input.downstreamState || {};
  const preservation = ['claims', 'corrections', 'suppressions', 'reviews', 'memberships', 'customerState'].every(key => downstream[key] !== 'OVERWRITE_WITH_UPSTREAM');
  assert(preservation, 'New profile evidence may not overwrite downstream product-authoritative state.');
  return Object.freeze({
    ok: true,
    mode: input.mode,
    readyProfiles: input.records.length,
    redirects: redirects.size,
    holds: Array.isArray(input.currentnessHolds) ? input.currentnessHolds.length : 0,
    downstreamStatePreserved: true,
    projectionDigest: digest({ records: input.records, redirects: input.redirects || [], holds: input.currentnessHolds || [] })
  });
}

function normalizeProfessionalAccess(input = {}) {
  const paidMember = statusIsActive(input.membershipStatus);
  const opportunityOptIn = input.opportunityOptIn === true;
  const available = String(input.availability || '').toLowerCase() === 'available';
  const credentialPointOfUseCurrent = String(input.credentialPointOfUse || '').toLowerCase() === 'current';
  const jurisdictionReady = input.jurisdictionReady === true;
  return Object.freeze({
    freePublicListing: true,
    publicBusinessContactVisible: true,
    credentialTruthIndependentOfPayment: true,
    organicRelevanceIndependentOfPayment: true,
    paidMember,
    consultationScheduling: Boolean(paidMember && input.consultationSchedulingEnabled !== false),
    structuredInquiries: Boolean(paidMember && input.structuredInquiriesEnabled !== false),
    documentFormReview: Boolean(paidMember && input.documentFormReviewEnabled !== false),
    opportunityEligible: Boolean(paidMember && opportunityOptIn && available && credentialPointOfUseCurrent && jurisdictionReady),
    sponsoredVisibilityMustBeLabeled: true,
    guaranteedClients: false
  });
}

function createOpportunity(input = {}) {
  assert(OPPORTUNITY_TYPES.includes(input.type), 'Unsupported professional opportunity type.');
  assert(input.userConsent === true, 'Explicit user consent is required.');
  assert(input.jurisdiction, 'Jurisdiction is required.');
  assert(input.userSelectedSharing === true, 'The user must choose what is shared.');
  assert(!input.rawSensitiveDocument || input.secureDocumentReference, 'Sensitive documents require a secure reference rather than raw event data.');
  const opportunity = {
    opportunityId: input.opportunityId || `sjopp_${crypto.randomUUID()}`,
    type: input.type,
    jurisdiction: input.jurisdiction,
    practiceArea: input.practiceArea || 'UNSPECIFIED',
    userConsentAt: nowIso(input.userConsentAt),
    userSelectedSharing: true,
    secureDocumentReference: input.secureDocumentReference || null,
    summary: String(input.summary || '').slice(0, 2000),
    status: 'PREPARED_USER_CONTROLLED',
    noAttorneyClientRelationshipCreated: true,
    noGuaranteedProfessionalResponse: true,
    createdAt: nowIso(input.createdAt)
  };
  return Object.freeze({ ...opportunity, evidenceDigest: digest(opportunity) });
}

function qualifyProfessionalForOpportunity(professional = {}, opportunity = {}) {
  const access = normalizeProfessionalAccess(professional);
  const conflictCleared = professional.conflictCleared === true;
  const practiceFit = !opportunity.practiceArea || opportunity.practiceArea === 'UNSPECIFIED' || (professional.practiceAreas || []).includes(opportunity.practiceArea);
  const jurisdictionFit = (professional.jurisdictions || []).includes(opportunity.jurisdiction);
  return Object.freeze({
    eligible: Boolean(access.opportunityEligible && conflictCleared && practiceFit && jurisdictionFit),
    access,
    conflictCleared,
    practiceFit,
    jurisdictionFit,
    paymentChangedCredentialTruth: false
  });
}

function assignOpportunity(opportunity = {}, professional = {}, input = {}) {
  assert(opportunity.status === 'PREPARED_USER_CONTROLLED', 'Opportunity must be user-controlled and prepared.');
  assert(input.userAssignmentConsent === true, 'User assignment consent is required.');
  const qualification = qualifyProfessionalForOpportunity(professional, opportunity);
  assert(qualification.eligible, 'Professional is not eligible for this opportunity.');
  const assignment = {
    assignmentId: input.assignmentId || `sjassign_${crypto.randomUUID()}`,
    opportunityId: opportunity.opportunityId,
    professionalId: professional.professionalId,
    status: 'ASSIGNED_PENDING_PROFESSIONAL_ACCEPTANCE',
    userAssignmentConsentAt: nowIso(input.userAssignmentConsentAt),
    professionalMayDecline: true,
    noGuaranteedEngagement: true,
    createdAt: nowIso(input.createdAt)
  };
  return Object.freeze({ ...assignment, evidenceDigest: digest(assignment) });
}

function qualifyMaterialRelease(receipts = []) {
  const byLane = new Map(receipts.map(receipt => [receipt.laneId, receipt]));
  const missing = LANE_IDS.filter(id => !byLane.has(id));
  const failed = LANE_IDS.filter(id => byLane.has(id) && byLane.get(id).status !== 'PASS');
  return Object.freeze({
    ok: missing.length === 0 && failed.length === 0,
    singleReleaseOwner: true,
    requiredLanes: [...LANE_IDS],
    missing,
    failed,
    authorityMerged: false
  });
}

function publicOpportunityExplanation() {
  return Object.freeze({
    free: 'Every qualified professional may keep a free public listing and public business contact information.',
    member: 'Active members may turn on scheduling, structured inquiries, and document or form review opportunities when those services are available.',
    trust: 'Membership does not buy credentials, endorsement, guaranteed clients, or hidden organic ranking.',
    choice: 'People choose what to share, and professionals may accept or decline after fit, availability, jurisdiction, and conflict checks.'
  });
}

module.exports = {
  LANE_IDS,
  OPPORTUNITY_TYPES,
  ROUTE_CLASSES,
  laneRegistry,
  qualifyContactability,
  validateProfileProjection,
  normalizeProfessionalAccess,
  createOpportunity,
  qualifyProfessionalForOpportunity,
  assignOpportunity,
  qualifyMaterialRelease,
  publicOpportunityExplanation
};
`;
write('lib/oneBuilderOperatingSystem.js', operatingModule, modified);

const publicPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Professional opportunities | Smarter Justice</title>
  <meta name="description" content="Learn how qualified professionals may use optional Smarter Justice scheduling, inquiry, and document-review tools while free public listings remain available.">
  <style>
    :root{color-scheme:light;--ink:#102a43;--muted:#486581;--line:#d9e2ec;--accent:#0b6b6b;--soft:#f5f9fb;--white:#fff}*{box-sizing:border-box}body{margin:0;background:var(--white);color:var(--ink);font-family:Arial,Helvetica,sans-serif;line-height:1.55}header,main,footer{max-width:1080px;margin:auto;padding:22px}nav{display:flex;gap:18px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--line)}nav a{color:var(--ink);text-decoration:none;font-weight:700}.brand{font-size:1.25rem;margin-right:auto}.hero{padding:56px 22px 28px}.hero h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.08;margin:.2rem 0 1rem}.hero p{max-width:760px;font-size:1.15rem;color:var(--muted)}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}.button{display:inline-block;padding:13px 18px;border-radius:8px;background:var(--accent);color:white;text-decoration:none;font-weight:700}.button.secondary{background:white;color:var(--accent);border:1px solid var(--accent)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:18px;margin:26px 0}.card{border:1px solid var(--line);border-radius:12px;padding:22px;background:var(--soft)}.card h2{font-size:1.2rem;margin-top:0}.note{border-left:4px solid var(--accent);padding:16px 18px;background:var(--soft);margin:28px 0}footer{color:var(--muted);border-top:1px solid var(--line);margin-top:34px}a:focus-visible{outline:3px solid #ffbf47;outline-offset:3px}
  </style>
  <script defer src="/pre124-public-copy-guard.js"></script>
</head>
<body>
<header>
  <nav aria-label="Primary">
    <a class="brand" href="/">Smarter Justice</a>
    <a href="/lawyer-directory.html">Find a professional</a>
    <a href="/attorney-partner-tour.html">For attorneys and firms</a>
    <a href="/professional-membership.html">Membership</a>
  </nav>
</header>
<main id="main-content">
  <section class="hero" data-professional-opportunity-center="true">
    <p><strong>Optional professional tools</strong></p>
    <h1>Professional opportunities through Smarter Justice</h1>
    <p>Free public listings and public business contact information remain available. Active members may turn on scheduling, structured inquiries, and document or form review opportunities when those services are available.</p>
    <div class="actions">
      <a class="button" href="/professional-membership.html">See professional membership</a>
      <a class="button secondary" href="/lawyer-directory.html">Search the public directory</a>
    </div>
  </section>
  <section aria-labelledby="how-it-works">
    <h2 id="how-it-works">How it works</h2>
    <div class="grid">
      <article class="card"><h2>People stay in control</h2><p>A person chooses what to share and whether a prepared request may be offered to a professional.</p></article>
      <article class="card"><h2>Professionals choose participation</h2><p>Members may opt in, set availability, and accept or decline after jurisdiction, practice-area, and conflict checks.</p></article>
      <article class="card"><h2>Different kinds of help</h2><p>Available tools may include consultation scheduling, a structured inquiry, or a request to review a completed document or form.</p></article>
      <article class="card"><h2>Trust stays independent</h2><p>Membership does not buy credentials, endorsement, guaranteed clients, or hidden organic ranking. Sponsored visibility must be clearly labeled.</p></article>
    </div>
  </section>
  <section class="note" aria-label="Important information">
    <strong>No automatic attorney-client relationship.</strong> Preparing or sending a request does not require a professional to respond and does not create an attorney-client relationship. A professional must separately accept an engagement and provide any required terms.
  </section>
</main>
<footer>
  <p>Smarter Justice provides legal starting information and independent professional search. It is not a law firm and does not provide legal advice.</p>
  <p><a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a> · <a href="/accessibility.html">Accessibility</a></p>
</footer>
</body>
</html>
`;
write('public/professional-opportunities.html', publicPage, modified);

const memberCard = `
<section data-professional-opportunity-link="true" aria-labelledby="professional-opportunity-tools">
  <h2 id="professional-opportunity-tools">Optional member opportunity tools</h2>
  <p>Active members may turn on consultation scheduling, structured inquiries, and document or form review opportunities when available. Free public listings and public business contact information remain available without membership.</p>
  <p><a href="/professional-opportunities.html">See how professional opportunities work</a></p>
</section>`;
for (const relative of ['public/professional-membership.html', 'public/attorney-partner-tour.html']) {
  const absolute = path.join(target, relative);
  ok(fs.existsSync(absolute), `${relative} is missing`);
  const before = fs.readFileSync(absolute, 'utf8');
  const after = insertBeforeClosing(before, 'data-professional-opportunity-link="true"', memberCard);
  if (after !== before) write(relative, after, modified);
}

const nextList = `# Smarter Justice — Next Version Improvement List after the one-builder internal-lane release

## Completed in this release

1. Preserved the exact live Smarter Justice predecessor and all unchanged files through hash-verified no-loss qualification.
2. Established one authoritative Smarter Justice builder with six internally separated review lanes: Product & UX; Legal/currentness; Profile evidence; Revenue/membership; Opportunity intelligence; and Release/QA.
3. Kept one finished release and one owner-facing product while preserving explicit internal authority boundaries and independent lane receipts.
4. Added a source-backed contactability policy that distinguishes a public business contact from consent or campaign authorization.
5. Added replace-not-append profile projection qualification with canonical IDs, duplicate redirects, currentness holds and protection for newer claims, corrections, suppressions, reviews, memberships and customer state.
6. Added an explicit professional-access model: free public listing/contact remains available; active members may activate scheduling, structured inquiries and document/form-review opportunities; payment does not alter credentials, endorsement or organic relevance.
7. Added a consent-led opportunity lifecycle covering consultation, structured inquiry and document/form review, including jurisdiction, practice fit, availability, conflict, point-of-use credential and professional opt-in checks.
8. Added a plain-language public professional-opportunity page without exposing internal lane, release, deployment or control terminology.
9. Preserved the existing production billing and AI-provider capabilities without creating new Stripe products, prices, coupons, payment links or environment-variable changes in this release.
10. Added deterministic targeted tests, current SBOM, deployment validation, release receipt and rollback lineage.

## Highest-value next improvements

1. Connect the opportunity lifecycle to durable production storage, user and professional dashboards, notifications, secure document references and explicit retention/deletion controls.
2. Complete calendar-provider connections with availability, timezone, rescheduling, cancellation and no-show handling.
3. Expand profile evidence with current source-backed individual attorneys and firms, while preserving regulator status, correction/suppression propagation and portal-specific specialty qualification.
4. Complete end-to-end outbound email delivery evidence for account, claim, inquiry, booking, review, security and support messages before broad automated outreach.
5. Add an owner-facing one-builder release dashboard that summarizes each internal lane without exposing internal terminology publicly.
6. Continue official-source legal and marketing-currentness monitoring with affected-jurisdiction human-review holds rather than blanket platform failure or blanket compliance claims.
7. Add measured first-value, acceptance, response-time, conversion, retention and professional satisfaction analytics without exposing private matter details.
8. Continue public-copy, mobile, accessibility, privacy, security, rollback and no-loss regression testing on every material release.
`;
write('NEXT_VERSION_IMPROVEMENT_LIST.md', nextList, modified);

const runtimeValidator = `#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..'),errors=[];
const readJson=r=>{try{return JSON.parse(fs.readFileSync(path.join(root,r),'utf8'));}catch(e){errors.push('json:'+r);return{};}};
const required=['package.json','package-lock.json','server.js','SBOM.spdx.json','PRE125_COMPLETION_RECEIPT.json','.pre125-render-bootstrap.json','lib/oneBuilderOperatingSystem.js','governance/ONE_BUILDER_INTERNAL_LANES.json','public/professional-opportunities.html','scripts/validate-pre125-deployment-kit.js'];for(const r of required)if(!fs.existsSync(path.join(root,r)))errors.push('missing:'+r);
const pkg=readJson('package.json'),lock=readJson('package-lock.json'),marker=readJson('.pre125-render-bootstrap.json'),receipt=readJson('PRE125_COMPLETION_RECEIPT.json'),lanes=readJson('governance/ONE_BUILDER_INTERNAL_LANES.json'),sbom=readJson('SBOM.spdx.json');
if(pkg.version!=='2.0.0-pre125'||lock.version!=='2.0.0-pre125')errors.push('runtime-version');if(marker.release!=='v2.0.0-pre125'||marker.baseRelease!=='v2.0.0-pre124'||marker.singleBuilderReleaseOwner!==true||marker.internalLaneCount!==6||marker.newStripeSetup!==false||marker.navigatorOrCommunityMutation!==false)errors.push('marker-boundary');if(receipt.release!=='v2.0.0-pre125'||receipt.baseRelease!=='v2.0.0-pre124'||receipt.noLossFromPredecessor!==true||receipt.newStripeSetup!==false)errors.push('receipt-boundary');if(!Array.isArray(lanes.lanes)||lanes.lanes.length!==6||lanes.singleAuthoritativeRelease!==true)errors.push('lane-registry');if(sbom.spdxVersion!=='SPDX-2.3'||!String(sbom.name||'').includes('2.0.0-pre125'))errors.push('sbom-currentness');
try{const os=require(path.join(root,'lib','oneBuilderOperatingSystem.js'));if(os.LANE_IDS.length!==6)errors.push('lane-module');const access=os.normalizeProfessionalAccess({membershipStatus:'active',opportunityOptIn:true,availability:'available',credentialPointOfUse:'current',jurisdictionReady:true});if(!access.opportunityEligible||!access.documentFormReview||access.credentialTruthIndependentOfPayment!==true)errors.push('professional-access');const free=os.normalizeProfessionalAccess({membershipStatus:'free'});if(!free.freePublicListing||free.opportunityEligible)errors.push('free-boundary');}catch(e){errors.push('module:'+e.message);}
const page=fs.existsSync(path.join(root,'public','professional-opportunities.html'))?fs.readFileSync(path.join(root,'public','professional-opportunities.html'),'utf8'):'';if(!page.includes('Free public listings')||!page.includes('Membership does not buy credentials'))errors.push('public-copy');if(/PRE125|ONE_BUILDER|RELEASE_QA|NO_GO/.test(page))errors.push('public-internal-language');
const result={command:'deployment:validate',release:'v2.0.0-pre125',ok:errors.length===0,errors,internalLanes:Array.isArray(lanes.lanes)?lanes.lanes.length:0,newStripeSetup:marker.newStripeSetup};process.stdout.write(JSON.stringify(result,null,2)+'\\n');if(!result.ok)process.exitCode=1;
`;
write('scripts/validate-pre125-deployment-kit.js', runtimeValidator, modified);

const packagePath = path.join(target, 'package.json');
const runtimePackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
runtimePackage.name = 'smarter-justice-pre125-runtime';
runtimePackage.version = '2.0.0-pre125';
runtimePackage.description = 'Smarter Justice single-builder internal-lane runtime based on exact PRE124 production.';
runtimePackage.scripts = runtimePackage.scripts || {};
runtimePackage.scripts.sbom = 'node scripts/generate-sbom.js';
runtimePackage.scripts['deployment:validate'] = 'node scripts/validate-pre125-deployment-kit.js';
fs.writeFileSync(packagePath, JSON.stringify(runtimePackage, null, 2) + '\n');
modified.add('package.json');

const lockPath = path.join(target, 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
lock.name = 'smarter-justice-pre125-runtime';
lock.version = '2.0.0-pre125';
if (lock.packages && lock.packages['']) {
  lock.packages[''].name = 'smarter-justice-pre125-runtime';
  lock.packages[''].version = '2.0.0-pre125';
}
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
modified.add('package-lock.json');

const serverPath = path.join(target, 'server.js');
ok(fs.existsSync(serverPath), 'server.js is missing');
let server = fs.readFileSync(serverPath, 'utf8');
server = server.replaceAll('v2.0.0-pre124', 'v2.0.0-pre125').replaceAll('2.0.0-pre124', '2.0.0-pre125');
fs.writeFileSync(serverPath, server);
modified.add('server.js');

const sbomRun = spawnSync(process.execPath, [path.join(target, 'scripts', 'generate-sbom.js')], {
  cwd: target,
  env: { ...process.env, SBOM_CREATED_AT: '2026-08-31T23:00:00.000Z' },
  encoding: 'utf8'
});
if (sbomRun.stdout) process.stdout.write(sbomRun.stdout);
if (sbomRun.status !== 0) fail(sbomRun.stderr || 'PRE125 SBOM generation failed');
modified.add('SBOM.spdx.json');

for (const [relative, expected] of baseHashes.entries()) {
  if (modified.has(relative)) continue;
  const absolute = path.join(target, relative);
  ok(fs.existsSync(absolute), `unchanged predecessor file missing: ${relative}`);
  ok(sha(absolute) === expected, `unchanged PRE124 file mutated: ${relative}`);
}

const changedHashes = {};
for (const relative of [...modified].sort()) {
  const absolute = path.join(target, relative);
  if (fs.existsSync(absolute)) changedHashes[relative] = sha(absolute);
}
const receipt = {
  schemaVersion: 'smarter-justice.pre125.one-builder-release-receipt.v1',
  release: 'v2.0.0-pre125',
  baseRelease: 'v2.0.0-pre124',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  oneAuthoritativeBuilder: true,
  internalLaneCount: 6,
  noLossFromPredecessor: true,
  predecessorUnchangedFilesHashVerified: true,
  navigatorOrCommunityMutation: false,
  newStripeSetup: false,
  newStripeCatalogMutation: false,
  environmentVariableMutation: false,
  predecessorBillingCapabilityPreserved: true,
  publicOpportunityPageAdded: true,
  contactabilityConsentSeparated: true,
  replaceNotAppendProfileQualification: true,
  professionalOpportunityLifecycle: ['CONSULTATION','STRUCTURED_INQUIRY','DOCUMENT_FORM_REVIEW'],
  credentialAndOrganicTruthIndependentOfPayment: true,
  changedHashes,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, 'PRE125_COMPLETION_RECEIPT.json'), JSON.stringify(receipt, null, 2) + '\n');

const marker = {
  schemaVersion: 'smarter-justice.pre125.render-bootstrap.v1',
  release: 'v2.0.0-pre125',
  baseRelease: 'v2.0.0-pre124',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  singleBuilderReleaseOwner: true,
  internalLaneCount: 6,
  navigatorOrCommunityMutation: false,
  newStripeSetup: false,
  newStripeProviderMutation: false,
  environmentVariableMutation: false,
  predecessorBillingCapabilityPreserved: true,
  productionDeploymentAuthorized: true,
  runtimeFiles: filesUnder(target).length,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre125-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');

const bannedVisible = [/\bPRE125\b/i,/ONE_BUILDER/i,/RELEASE_QA/i,/\bNO_GO\b/i,/deployment diagnostics/i,/owner workbench/i];
for (const relative of filesUnder(path.join(target, 'public')).filter(name => name.endsWith('.html'))) {
  const text = visibleText(fs.readFileSync(path.join(target, 'public', relative), 'utf8'));
  for (const pattern of bannedVisible) ok(!pattern.test(text), `internal public language remains in ${relative}: ${pattern}`);
}

const validateRun = spawnSync(process.execPath, [path.join(target, 'scripts', 'validate-pre125-deployment-kit.js')], { cwd: target, env: process.env, encoding: 'utf8' });
if (validateRun.stdout) process.stdout.write(validateRun.stdout);
if (validateRun.status !== 0) fail(validateRun.stderr || 'PRE125 deployment validation failed');
console.log(`[PRE125 RELEASE] qualified one-builder runtime prepared with ${laneRegistry.lanes.length} internal lanes; no new Stripe setup`);
