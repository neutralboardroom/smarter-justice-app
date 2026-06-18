
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { PRACTICE_AREAS } = require('../data/practiceAreas');
const pub = path.join(__dirname, '..', 'public');
const focusedPracticePages = ['taxes.html','business-formation-compliance.html','business-law.html','real-estate.html','divorce-family-law.html','landlord-tenant-housing.html','bankruptcy-debt.html','disability-benefits.html','estate-planning.html','vehicle-accidents.html','personal-injury.html','medical-malpractice.html','public-benefits.html','employment-wage-claims.html','nonprofit-formation-compliance.html'];
assert(fs.existsSync(path.join(__dirname, '..', 'render.yaml')), 'missing render.yaml');
assert(fs.existsSync(path.join(__dirname, '..', 'DEPLOY_RENDER.md')), 'missing DEPLOY_RENDER.md');
const required = [...focusedPracticePages, 'index.html','how-it-works.html','practice-areas.html','upload-notice.html','pricing.html','referral-program.html','community-partner-tools.html','attorney-review.html','contact.html','faq.html','privacy.html','terms.html','disclaimer.html','security.html','dashboard.html','staff.html','forms-roadmap.html','production-readiness.html','launch-readiness.html','review-delivery.html','checkout-success.html','checkout-cancel.html','ai-summary.html','llms.txt','robots.txt','sitemap.xml','logo.svg','favicon.svg','app.js','live-chat.js','styles.css'];
for (const f of required) assert(fs.existsSync(path.join(pub,f)), `missing ${f}`);
for (const f of required.filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(pub,f),'utf8');
  assert(/<title>/.test(html), `${f} missing title`);
  assert(/Smarter Justice/.test(html), `${f} missing Smarter Justice branding`);
  assert(!/Immigration Oasis/.test(html), `${f} should not contain Immigration Oasis branding`);
  assert(/not a law firm|Not a law firm|private support service/i.test(html), `${f} missing trust/disclaimer language`);
  assert(!/external lead integration/i.test(html), `${f} should not expose unavailable lead-integration roadmap`);
  assert(!/\bintake\b|risk flags|handoff|route check|product support|payment\/release|release status/i.test(html), `${f} contains customer-facing internal wording`);
}

const index = fs.readFileSync(path.join(pub,'index.html'),'utf8');
assert(/maxlength="2500"/.test(index), 'homepage missing 2500 char counter maxlength');
assert(/data-step-form/.test(index), 'homepage missing guided step form');
assert(/data-error-summary/.test(index), 'homepage missing accessible error summary');
assert(/Upload a Notice/.test(index), 'homepage should make Upload a Notice a major path');
assert(/type="file"/.test(index), 'homepage missing attachment upload');
const practiceHtml = fs.readFileSync(path.join(pub,'practice-areas.html'),'utf8');
assert.equal((practiceHtml.match(/class="practice-card"/g) || []).length, PRACTICE_AREAS.length, 'practice page must include every practice area');
for (const p of PRACTICE_AREAS) {
  assert(practiceHtml.includes(`id="${p.slug}"`), `practice page missing ${p.slug}`);
}
const appJs = fs.readFileSync(path.join(pub,'app.js'),'utf8');
assert(/practices\.map\(p => `<option/.test(appJs), 'home practice select should be populated from the full practice-area API');
const referral = fs.readFileSync(path.join(pub,'referral-program.html'),'utf8');
assert(/Community Partner/.test(referral), 'Community Partner wording missing');
const admin = fs.readFileSync(path.join(pub,'staff.html'),'utf8');
assert(/Human Review Specialist/.test(admin), 'staff page missing Human Review Specialist workflow');
const appJsText = fs.readFileSync(path.join(pub,'app.js'),'utf8');
assert(/data-admin-update/.test(appJsText), 'admin page should include status update workflow');
assert(!/Helper/.test(referral), 'public page should not use Helper wording');
const flyer = fs.readFileSync(path.join(pub,'partner-flyer.html'),'utf8');
assert(!/https?:\/\//.test(flyer), 'flyer should avoid plain website address');
const storageCases = fs.readFileSync(path.join(__dirname, '..', 'storage', 'cases.json'), 'utf8').trim();
const storagePartners = fs.readFileSync(path.join(__dirname, '..', 'storage', 'communityPartners.json'), 'utf8').trim();
const storageNotes = fs.readFileSync(path.join(__dirname, '..', 'storage', 'notifications.json'), 'utf8').trim();
const storageAudit = fs.readFileSync(path.join(__dirname, '..', 'storage', 'auditLog.json'), 'utf8').trim();
assert.equal(storageCases, '[]', 'release ZIP should not include test case data');
assert.equal(storagePartners, '[]', 'release ZIP should not include test partner data');
assert.equal(storageNotes, '[]', 'release ZIP should not include test notifications');
assert.equal(storageAudit, '[]', 'release ZIP should not include test audit log');

const uploadNotice = fs.readFileSync(path.join(pub,'upload-notice.html'),'utf8');
assert(/Upload a Notice/.test(uploadNotice), 'upload notice page missing');
assert(/type="file"/.test(uploadNotice), 'upload notice page missing file upload');
const formsRoadmap = fs.readFileSync(path.join(pub,'forms-roadmap.html'),'utf8');
assert(/Source catalog only/.test(formsRoadmap) && /Sign-ready after review/.test(formsRoadmap), 'forms roadmap missing readiness levels');
assert(/smartQuestions/.test(index), 'homepage missing smart starting-question panel');
const productionReady = fs.readFileSync(path.join(pub,'production-readiness.html'),'utf8');
assert(/Stripe Checkout/.test(productionReady) && /Postgres|persistent storage|persistent\/object/i.test(productionReady), 'production readiness page missing payment/storage checklist');
const pricing = fs.readFileSync(path.join(pub,'pricing.html'),'utf8');
assert(/Notice or Document Starter Review/.test(pricing) && /Human Review Specialist Starter File/.test(pricing) && /Completed Forms After Review/.test(pricing), 'pricing page missing conversion-ready package structure');
for (const f of focusedPracticePages) { const page = fs.readFileSync(path.join(pub,f),'utf8'); assert(/Start Free/.test(page) && /Upload Notice/.test(page), `${f} missing focused conversion links`); }
const launchReady = fs.readFileSync(path.join(pub,'launch-readiness.html'),'utf8');
assert(/Launch Readiness/.test(launchReady) && /launchReadinessForm/.test(launchReady), 'launch readiness page missing checklist form');
const reviewDelivery = fs.readFileSync(path.join(pub,'review-delivery.html'),'utf8');
assert(/organized review package/i.test(reviewDelivery) && /Completed forms where supported/.test(reviewDelivery), 'review delivery page missing delivery explanation');
const checkoutSuccess = fs.readFileSync(path.join(pub,'checkout-success.html'),'utf8');
assert(/checkoutStatus/.test(checkoutSuccess), 'checkout success page missing confirmation panel');
const appText = fs.readFileSync(path.join(pub,'app.js'),'utf8');
assert(/data-checkout-form/.test(appText), 'dashboard should include checkout form');
assert(/data-email-link/.test(appText), 'dashboard should include private-link email request');
assert(/launchReadinessForm/.test(appText), 'app should support launch-readiness checklist');
assert(/review-package/.test(appText), 'dashboard should link organized review package');
assert(/draft-package/.test(appText), 'dashboard should link form-draft starter package');
assert(/userFacingNote/.test(appText), 'staff page should support user-visible more-information notes');

console.log('static-checks.test.js passed');
