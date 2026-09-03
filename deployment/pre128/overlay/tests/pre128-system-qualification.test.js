'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { portForTest } = require('./test-port');

const root = path.resolve(__dirname, '..');
const port = portForTest(1288);
const origin = `http://127.0.0.1:${port}`;
const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'sj-system-qualification-'));
const child = spawn(process.execPath, ['server.js'], {
  cwd:root,
  env:{
    ...process.env, NODE_ENV:'test', PORT:String(port), APP_BASE_URL:origin,
    SMARTER_JUSTICE_STORAGE_DIR:storage,
    OWNER_ACCOUNT_EMAIL:'owner-system@example.test', OWNER_ACCOUNT_PASSWORD:'SystemOwnerPassword!128',
    SMTP_HOST:'', SMTP_USER:'', SMTP_PASS:'', SMTP_FROM:'',
    STRIPE_SECRET_KEY:'', STRIPE_WEBHOOK_SECRET:'', OPENAI_API_KEY:'', AI_PUBLIC_SMOKE_ENABLED:'false',
    SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED:'true'
  },
  stdio:['ignore','pipe','pipe']
});
let output = '';
child.stdout.on('data', chunk => { output += String(chunk); });
child.stderr.on('data', chunk => { output += String(chunk); });
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function request(route, options = {}) {
  const response = await fetch(origin + route, options);
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  return { response, text, data };
}
function localReferences(html, pagePath) {
  const rows = new Set();
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const value = match[1].replace(/&amp;/g, '&').trim();
    if (!value || /^(?:#|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    const url = new URL(value, origin + pagePath);
    if (url.origin !== origin) continue;
    if (url.pathname.startsWith('/api/')) continue;
    rows.add(url.pathname + url.search);
  }
  return [...rows];
}

(async () => {
  try {
    for (let attempt = 0; attempt < 100 && !output.includes('listening'); attempt += 1) {
      if (child.exitCode !== null) throw new Error(`Server exited before readiness:\n${output}`);
      await wait(75);
    }
    assert(output.includes('listening'), output);

    const sitemapResponse = await request('/sitemap.xml');
    assert.equal(sitemapResponse.response.status, 200);
    const routes = [...sitemapResponse.text.matchAll(/<loc>https:\/\/smarterjustice\.com([^<]*)<\/loc>/g)].map(match => match[1]);
    assert(routes.length >= 30);
    assert.equal(new Set(routes).size, routes.length, 'sitemap routes must be unique');
    const retired = ['founding-portals','portal-router','portal-preparation','professional-signup','professional-community.html','community-network'];
    for (const term of retired) assert(!routes.some(route => route.includes(term)), `retired or non-indexable sitemap route: ${term}`);

    let pageCount = 0;
    let assetCount = 0;
    const checkedReferences = new Set();
    for (const route of routes) {
      const page = await request(route);
      assert.equal(page.response.status, 200, `sitemap route ${route}`);
      assert(/text\/html/.test(page.response.headers.get('content-type') || ''), `HTML content type ${route}`);
      assert(/<html\b[^>]*lang=["'](?:en|es)["']/i.test(page.text), `language ${route}`);
      assert(/<title>[^<]+<\/title>/i.test(page.text), `title ${route}`);
      assert(/<h1\b/i.test(page.text), `h1 ${route}`);
      assert(!/\bPRE\d{2,4}\b/i.test(page.text), `release identifier ${route}`);
      pageCount += 1;
      for (const reference of localReferences(page.text, route)) {
        const key = reference.split('#')[0];
        if (checkedReferences.has(key)) continue;
        checkedReferences.add(key);
        const linked = await request(key);
        assert(linked.response.status < 400, `broken local reference ${route} -> ${key}: ${linked.response.status}`);
        assetCount += 1;
      }
    }

    let item = await request('/api/practice-areas');
    assert.equal(item.response.status, 200);
    assert(item.data.practiceAreas.length >= 10);
    item = await request('/api/legal-areas');
    assert.equal(item.response.status, 200);
    assert(item.data.legalAreas.length >= 1);
    assert(!JSON.stringify(item.data).includes('micro-portal'));
    item = await request('/api/portals');
    assert.equal(item.response.status, 410);

    item = await request('/api/community-resource-aid');
    assert.equal(item.response.status, 200);
    assert.equal(item.data.verified, true);
    assert(item.data.resource.sources.length >= 1);
    item = await request('/api/public/professionals?postalCode=11201&state=NY&limit=3');
    assert.equal(item.response.status, 200);
    assert(item.data.total >= 1);

    const story = 'I received a court notice and need a private starting point.';
    item = await request('/api/public/story-route', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({question:story,state:'NY',language:'en'}) });
    assert.equal(item.response.status, 200);
    assert.equal(item.data.ok, true);
    assert(!/lawyer recommendation|guaranteed result/i.test(JSON.stringify(item.data)));
    const persisted = fs.readdirSync(storage).filter(name => name.endsWith('.json')).map(name => fs.readFileSync(path.join(storage, name), 'utf8')).join('\n');
    assert(!persisted.includes(story), 'public routing narrative must not be persisted');

    item = await request('/api/ai-status');
    assert.equal(item.response.status, 200);
    assert.deepEqual(Object.keys(item.data).sort(), ['available','message','ok','rulesBasedHelpAvailable']);
    assert.equal(item.data.available, false);
    assert.equal(item.data.rulesBasedHelpAvailable, true);
    item = await request('/api/public/ai-smoke', { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
    assert.equal(item.response.status, 404);

    item = await request('/api/sjr120/forms/summary');
    assert.equal(item.response.status, 200, 'public semantic release alias must preserve the inherited form workflow');
    item = await request('/domestic-violence-aid.html');
    assert.equal(item.response.status, 200);
    assert.equal(item.response.headers.get('referrer-policy'), 'no-referrer');
    assert(/no-store/.test(item.response.headers.get('cache-control') || ''));

    for (const route of ['/control-center.html','/staff.html','/admin.html','/portal-profile-acceptance.html','/profile-factory-review-sjr85.html']) {
      const protectedPage = await fetch(origin + route, { redirect:'manual' });
      assert.equal(protectedPage.status, 302, route);
      assert.equal(protectedPage.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
    }
    for (const route of ['/professional-dashboard.html','/professional-firm-operations.html','/professional-currentness-request.html']) {
      const protectedPage = await fetch(origin + route, { redirect:'manual' });
      assert.equal(protectedPage.status, 302, route);
      assert(protectedPage.headers.get('location').startsWith('/professional-login.html?next='), route);
      assert.equal(protectedPage.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
    }
    for (const route of ['/professional-signup.html','/professional-community.html']) {
      const privateIndexPage = await fetch(origin + route, { redirect:'manual' });
      assert.equal(privateIndexPage.status, 200, route);
      assert.equal(privateIndexPage.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
    }

    const provider = await request('/api/public/provider-readiness');
    const providerText = JSON.stringify(provider.data);
    for (const term of ['stripeSecret','webhookConfigured','keyConfigured','killSwitch','controlReason']) assert(!providerText.includes(term), term);
    assert.equal(provider.data.professionalRegistration.available, false);
    assert.equal(provider.data.membershipEnrollment.available, false);
    assert.equal(provider.data.aiAssistance.available, false);

    for (const route of ['/api/professional/auth/signup','/api/professional/pilot-program/application/save','/api/professional/pilot-program/application/submit','/api/professional/membership/checkout','/api/professional-membership-interest','/api/professional-launch-interest']) {
      const closed = await request(route, { method:'POST', headers:{'Content-Type':'application/json'}, body:'{}' });
      assert.equal(closed.response.status, 503, route);
      assert.equal(closed.data.ok, false, route);
    }
    item = await request('/api/professional/membership/confirm?session_id=not-used');
    assert.equal(item.response.status, 503);

    const membership = await request('/api/public/legal-community-membership');
    assert.equal(membership.data.membership.enrollmentAvailable, false);
    assert.equal(membership.data.membership.checkoutAvailable, false);
    const planned = Object.fromEntries(membership.data.membership.plannedPlans.map(plan => [plan.id, [plan.monthlyDollars, plan.annualDollars]]));
    assert.deepEqual(planned.professional, [10,100]);
    assert.deepEqual(planned.team, [29,290]);
    assert.deepEqual(planned.office, [49,490]);

    console.log(JSON.stringify({
      ok:true, suite:'pre128-system-qualification', sitemapRoutes:pageCount, localReferences:assetCount,
      publicLegalWorkflow:true, directoryAvailable:true, privateNarrativePersisted:false,
      aiPublicStatusMinimized:true, nonAiRoutePreserved:true, safetyHeaders:true,
      protectedRoutes:true, bilingualRoutes:true, pricingParity:true, paidEnrollmentOpen:false
    }, null, 2));
  } catch (error) {
    console.error(error);
    console.error(output);
    process.exitCode = 1;
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(storage, { recursive:true, force:true });
  }
})();
