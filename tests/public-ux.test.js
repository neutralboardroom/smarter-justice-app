const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pub = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(pub).filter(name => name.endsWith('.html'));
const protectedPages = new Set([
  'admin.html','staff.html','control-center.html','dashboard.html','next-path.html',
  'checkout-success.html','checkout-cancel.html','launch-readiness.html','production-readiness.html',
  'ai-summary.html','professional-login.html','professional-signup.html','professional-dashboard.html'
]);
const internalOnlyPages = new Set(['admin.html','staff.html','control-center.html','launch-readiness.html','production-readiness.html','ai-summary.html']);
const professionalPages = new Set(['professional-membership.html','professional-membership-terms.html','professionals.html','professional-profile.html','firm-profile.html','professional-login.html','professional-signup.html','professional-dashboard.html']);

for (const name of htmlFiles) {
  const html = fs.readFileSync(path.join(pub, name), 'utf8');
  assert(/name=["']viewport["']|name="viewport"/.test(html), `${name} missing responsive viewport metadata`);
  assert(/<main\b/i.test(html), `${name} missing main landmark`);
  if (protectedPages.has(name)) assert(/noindex/i.test(html), `${name} should not be indexed`);
  if (!internalOnlyPages.has(name) && !protectedPages.has(name)) {
    assert(!/routing engine|release gate|risk flags?|staff queue|internal queue|deployment configuration|environment variable|admin token|owner token|portal identifiers?|eligibility gates?/i.test(html), `${name} exposes internal or technical language`);
  }
}

const localTargets = new Set(fs.readdirSync(pub));
for (const name of htmlFiles) {
  const html = fs.readFileSync(path.join(pub, name), 'utf8');
  const links = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map(match => match[1]);
  for (const link of links) {
    if (!link.startsWith('/') || link.startsWith('/api/')) continue;
    const target = link.split(/[?#]/)[0].replace(/^\//, '') || 'index.html';
    assert(localTargets.has(target), `${name} contains broken local link ${link}`);
  }
}

for (const name of ['index.html','professional-membership.html','professionals.html','professional-profile.html','firm-profile.html','professional-signup.html','professional-login.html','professional-dashboard.html']) {
  const html = fs.readFileSync(path.join(pub, name), 'utf8');
  assert(/data-nav-toggle/.test(html), `${name} missing mobile navigation control`);
}

const css = fs.readFileSync(path.join(pub, 'styles.css'), 'utf8');
assert(/@media\(max-width:1050px\)/.test(css), 'missing tablet breakpoint');
assert(/@media\(max-width:720px\)/.test(css), 'missing phone breakpoint');
assert(/@media\(max-width:480px\)/.test(css), 'missing narrow-phone breakpoint');
assert(/professional-signup-layout/.test(css) && /professional-pricing-grid/.test(css) && /dashboard-status-grid/.test(css), 'professional funnel missing responsive layout rules');
assert(/grid-template-columns:1fr/.test(css), 'responsive CSS should collapse key grids to one column');
assert(/\.header-cta\{display:none\}/.test(css), 'narrow phone CSS should prevent header action overflow');
assert(/directory-quick-filters/.test(css) && /center-actions/.test(css), 'directory filter and pagination controls need responsive styling');
assert(/\.cards\{display:grid;gap:1rem\}/.test(css) && /\.cards\.four/.test(css), 'shared card groups need reliable grid and four-card responsive styling');


const directory = fs.readFileSync(path.join(pub, 'professionals.html'), 'utf8');
assert(/Show More Professionals/.test(directory) && /Show More Firms/.test(directory), 'directory must expose pagination controls for both individuals and firms');
assert(/26 Court Street/.test(directory) && /Manhattan/.test(directory) && /Bronx/.test(directory), 'directory missing useful NYC quick searches');
const firmProfile = fs.readFileSync(path.join(pub, 'firm-profile.html'), 'utf8');
assert(/firmProfile/.test(firmProfile) && /Claim a Firm Profile/.test(firmProfile), 'firm profile page or claim action missing');
for (const name of ['professional-membership.html','professional-signup.html']) {
  const html = fs.readFileSync(path.join(pub, name), 'utf8');
  assert(!/Stripe/i.test(html), `${name} should use vendor-neutral customer checkout language`);
}
const signup = fs.readFileSync(path.join(pub, 'professional-signup.html'), 'utf8');
assert(/confirmPassword/.test(signup), 'professional signup missing password confirmation');
assert(/NYC-FOUNDING-WEB/.test(signup), 'general professional signup should use general web attribution rather than a location-specific campaign');


const directoryScript = fs.readFileSync(path.join(pub, 'professional.js'), 'utf8');
assert(/clearProfessionalFilters/.test(directory) && /clearOfficialAttorneyFilters/.test(directory), 'directory missing clear-filter controls');
assert(/loadMoreOfficialAttorneys/.test(directory), 'official New York search missing show-more control');
assert(/officialOffset/.test(directoryScript) && /offset/.test(directoryScript), 'official New York search pagination is not wired');
assert(/history\.replaceState/.test(directoryScript), 'directory filters should be shareable through the current URL');
assert(/firmSavingsCalculator/.test(fs.readFileSync(path.join(pub, 'professional-membership.html'), 'utf8')), 'firm membership savings estimator missing');
assert(/setupChecklist\(data\)/.test(directoryScript), 'professional dashboard missing connected setup checklist');
assert(/setStructuredData/.test(directoryScript) && /application\/ld\+json/.test(directoryScript), 'public profiles missing structured-data support');
const pricing = fs.readFileSync(path.join(pub, 'pricing.html'), 'utf8');
assert(/substantial guidance free/i.test(pricing) && /AI-Guided Start/.test(pricing), 'pricing page does not reflect the approved free-first public strategy');
assert(/autocomplete="street-address"/.test(signup) && /inputmode="tel"/.test(signup), 'professional signup is missing mobile autofill improvements');
assert(/paid via stripe checkout':'Paid online'/.test(fs.readFileSync(path.join(pub, 'app.js'), 'utf8')), 'customer payment status should not expose processor-specific implementation wording');

const sitemap = fs.readFileSync(path.join(pub, 'sitemap.xml'), 'utf8');
for (const name of protectedPages) assert(!sitemap.includes(`/${name}`), `${name} must not be in the public sitemap`);
assert(sitemap.includes('/professional-membership-terms.html'), 'professional membership terms missing from sitemap');

const publicInternalTargets = ['ai-summary.html','llms.txt','launch-readiness.html','production-readiness.html'];
for (const name of htmlFiles) {
  if (internalOnlyPages.has(name)) continue;
  const html = fs.readFileSync(path.join(pub, name), 'utf8');
  for (const target of publicInternalTargets) assert(!html.includes(`href="/${target}`) && !html.includes(`href="${target}`), `${name} links customers to internal or technical material ${target}`);
}

const controlCenter = fs.readFileSync(path.join(pub, 'control-center.html'), 'utf8');
assert(/Public experience and build-handoff checklist/i.test(controlCenter), 'Control Center missing public experience and handoff governance checklist');
assert(/Customer language/i.test(controlCenter) && /phone, tablet, and desktop/i.test(controlCenter), 'Control Center checklist missing customer-language or responsive review requirements');

console.log(`public-ux.test.js passed: ${htmlFiles.length} HTML pages and local links audited`);
