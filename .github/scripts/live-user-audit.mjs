import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const primary = process.env.PRIMARY_URL || 'https://www.smarterjustice.com';
const apex = process.env.APEX_URL || 'https://smarterjustice.com';
const maxPages = Number(process.env.MAX_PAGES || 250);
const output = process.env.AUDIT_OUTPUT || path.resolve('live-audit-output');
const runId = `${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;
const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, max-age=0',
  Pragma: 'no-cache',
  'X-Smarter-Justice-Audit': runId
};
const risky = /delete|remove|purchase|pay|checkout|subscribe|send|submit|file|upload|sign out|log out|publish|deploy|activate|approve|authorize/i;
const allowedProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);

fs.mkdirSync(path.join(output, 'screenshots', 'desktop'), { recursive: true });
fs.mkdirSync(path.join(output, 'screenshots', 'mobile'), { recursive: true });

const normalize = (raw, base) => {
  try {
    const url = new URL(raw, base);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|_audit)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
};
const slug = (raw) => {
  const url = new URL(raw);
  const value = `${url.hostname}${url.pathname === '/' ? '/home' : url.pathname}`;
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 160) || 'home';
};
const cacheBust = (raw) => {
  const url = new URL(raw);
  url.searchParams.set('_audit', runId);
  return url.toString();
};
const sameProductHost = (raw) => {
  try {
    return new URL(raw).hostname.replace(/^www\./, '') === new URL(primary).hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
};
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const result = {
  auditVersion: 'SJ-LIVE-USER-AUDIT-2',
  runId,
  startedAt: new Date().toISOString(),
  primary,
  apex,
  pages: [],
  hostChecks: [],
  critical: [],
  warnings: [],
  stats: {}
};

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: noCacheHeaders });
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, extraHTTPHeaders: noCacheHeaders });

for (const host of [primary, apex]) {
  const page = await desktop.newPage();
  const failures = [];
  page.on('requestfailed', request => failures.push({ url: request.url(), error: request.failure()?.errorText || 'request failed' }));
  try {
    const response = await page.goto(cacheBust(host), { waitUntil: 'networkidle', timeout: 45000 });
    result.hostChecks.push({ requested: host, finalUrl: page.url(), status: response?.status() || null, title: await page.title(), failures });
  } catch (error) {
    result.hostChecks.push({ requested: host, finalUrl: page.url(), status: null, error: String(error), failures });
    result.critical.push({ type: 'HOST_UNREACHABLE', url: host, detail: String(error) });
  } finally {
    await page.close();
  }
}

const queue = [normalize(primary, primary)];
const visited = new Set();
while (queue.length && visited.size < maxPages) {
  const requested = queue.shift();
  if (!requested || visited.has(requested) || !sameProductHost(requested)) continue;
  visited.add(requested);
  const page = await desktop.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('requestfailed', request => requestFailures.push({ url: request.url(), method: request.method(), error: request.failure()?.errorText || 'request failed' }));
  const record = {
    requested,
    status: null,
    finalUrl: null,
    title: null,
    h1: [],
    headings: [],
    text: null,
    links: [],
    buttons: [],
    forms: [],
    consoleErrors,
    pageErrors,
    requestFailures,
    axe: null,
    desktopScreenshot: null,
    mobileScreenshot: null,
    errors: []
  };
  try {
    const response = await page.goto(cacheBust(requested), { waitUntil: 'networkidle', timeout: 45000 });
    record.status = response?.status() || null;
    record.finalUrl = page.url().replace(/([?&])_audit=[^&]+&?/, '$1').replace(/[?&]$/, '');
    record.title = await page.title();
    record.h1 = await page.locator('h1').allTextContents();
    record.headings = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll(nodes => nodes.map(node => ({ level: Number(node.tagName.slice(1)), text: (node.textContent || '').trim() })).filter(item => item.text));
    record.text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim().slice(0, 20000);
    record.links = await page.locator('a').evaluateAll(nodes => nodes.map((node, index) => ({
      index,
      text: (node.innerText || node.getAttribute('aria-label') || '').trim(),
      href: node.getAttribute('href'),
      visible: !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length),
      target: node.getAttribute('target'),
      rel: node.getAttribute('rel')
    })));
    record.buttons = await page.locator('button,input[type=button],input[type=submit],[role=button]').evaluateAll(nodes => nodes.map((node, index) => ({
      index,
      tag: node.tagName.toLowerCase(),
      type: node.getAttribute('type'),
      text: (node.innerText || node.getAttribute('value') || node.getAttribute('aria-label') || '').trim(),
      visible: !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length),
      disabled: !!node.disabled || node.getAttribute('aria-disabled') === 'true',
      formAction: node.formAction || null
    })));
    record.forms = await page.locator('form').evaluateAll(forms => forms.map((form, index) => ({
      index,
      action: form.getAttribute('action') || '',
      method: (form.getAttribute('method') || 'get').toLowerCase(),
      controls: [...form.querySelectorAll('input,select,textarea,button')].map(control => ({
        tag: control.tagName.toLowerCase(),
        type: control.getAttribute('type'),
        name: control.getAttribute('name'),
        id: control.id,
        required: control.required,
        label: control.id ? document.querySelector(`label[for="${CSS.escape(control.id)}"]`)?.innerText?.trim() || null : null
      }))
    })));
    const axe = await new AxeBuilder({ page }).analyze();
    record.axe = { violations: axe.violations.map(violation => ({ id: violation.id, impact: violation.impact, description: violation.description, nodes: violation.nodes.length })) };

    if (!record.status || record.status >= 400) result.critical.push({ type: 'PAGE_STATUS', url: requested, status: record.status });
    if (record.h1.length !== 1) result.warnings.push({ type: 'H1_COUNT', url: requested, count: record.h1.length });
    if (!record.title?.trim()) result.warnings.push({ type: 'MISSING_TITLE', url: requested });
    for (let index = 1; index < record.headings.length; index += 1) {
      if (record.headings[index].level > record.headings[index - 1].level + 1) {
        result.warnings.push({ type: 'HEADING_SKIP', url: requested, from: record.headings[index - 1], to: record.headings[index] });
      }
    }
    if (consoleErrors.length || pageErrors.length) result.critical.push({ type: 'RUNTIME_ERROR', url: requested, consoleErrors, pageErrors });
    if (record.axe.violations.some(violation => ['critical', 'serious'].includes(violation.impact))) {
      result.warnings.push({ type: 'ACCESSIBILITY', url: requested, violations: record.axe.violations.filter(violation => ['critical', 'serious'].includes(violation.impact)) });
    }

    for (const link of record.links) {
      if (!link.href) {
        if (link.visible) result.warnings.push({ type: 'LINK_WITHOUT_HREF', url: requested, text: link.text });
        continue;
      }
      const normalized = normalize(link.href, record.finalUrl || requested);
      if (!normalized) continue;
      const protocol = new URL(normalized).protocol;
      if (!allowedProtocols.has(protocol)) result.warnings.push({ type: 'UNSUPPORTED_LINK_PROTOCOL', url: requested, href: link.href, protocol });
      if (sameProductHost(normalized) && !visited.has(normalized) && !queue.includes(normalized)) queue.push(normalized);
    }

    const safeButtons = record.buttons.filter(button => button.visible && !button.disabled && !risky.test(`${button.text} ${button.formAction || ''}`)).slice(0, 50);
    for (const button of safeButtons) {
      const probe = await desktop.newPage();
      const probeErrors = [];
      probe.on('pageerror', error => probeErrors.push(String(error)));
      try {
        await probe.goto(cacheBust(requested), { waitUntil: 'networkidle', timeout: 45000 });
        const locator = probe.locator('button,input[type=button],input[type=submit],[role=button]').nth(button.index);
        if (!await locator.isVisible()) continue;
        const before = probe.url();
        await locator.click({ timeout: 8000 });
        await probe.waitForTimeout(800);
        const after = probe.url();
        const expanded = await locator.getAttribute('aria-expanded').catch(() => null);
        const dialogVisible = await probe.locator('[role=dialog]:visible,dialog[open]').count();
        button.probe = { before, after, changedUrl: before !== after, expanded, dialogVisible, pageErrors: probeErrors };
        if (probeErrors.length) result.critical.push({ type: 'BUTTON_RUNTIME_ERROR', url: requested, button: button.text, errors: probeErrors });
        if (!button.probe.changedUrl && expanded === null && dialogVisible === 0 && !/menu|search|filter|toggle|show|hide|open|close|copy|download/i.test(button.text)) {
          result.warnings.push({ type: 'BUTTON_NO_OBSERVED_EFFECT', url: requested, button: button.text || `[${button.index}]` });
        }
      } catch (error) {
        button.probe = { error: String(error) };
        result.warnings.push({ type: 'BUTTON_PROBE_FAILED', url: requested, button: button.text || `[${button.index}]`, detail: String(error) });
      } finally {
        await probe.close();
      }
    }

    const pageSlug = slug(record.finalUrl || requested);
    const desktopPath = path.join(output, 'screenshots', 'desktop', `${pageSlug}.png`);
    await page.screenshot({ path: desktopPath, fullPage: true });
    record.desktopScreenshot = path.relative(output, desktopPath);

    const mobilePage = await mobile.newPage();
    try {
      await mobilePage.goto(cacheBust(requested), { waitUntil: 'networkidle', timeout: 45000 });
      const overflow = await mobilePage.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
      if (overflow.scrollWidth > overflow.clientWidth + 2) result.warnings.push({ type: 'MOBILE_HORIZONTAL_OVERFLOW', url: requested, ...overflow });
      const mobilePath = path.join(output, 'screenshots', 'mobile', `${pageSlug}.png`);
      await mobilePage.screenshot({ path: mobilePath, fullPage: true });
      record.mobileScreenshot = path.relative(output, mobilePath);
    } finally {
      await mobilePage.close();
    }
  } catch (error) {
    record.errors.push(String(error));
    result.critical.push({ type: 'PAGE_LOAD_FAILURE', url: requested, detail: String(error) });
  } finally {
    result.pages.push(record);
    await page.close();
  }
}

await desktop.close();
await mobile.close();
await browser.close();
result.finishedAt = new Date().toISOString();
result.stats = {
  pagesVisited: result.pages.length,
  linksInspected: result.pages.reduce((count, page) => count + page.links.length, 0),
  buttonsInspected: result.pages.reduce((count, page) => count + page.buttons.length, 0),
  formsInspected: result.pages.reduce((count, page) => count + page.forms.length, 0),
  criticalCount: result.critical.length,
  warningCount: result.warnings.length
};
fs.writeFileSync(path.join(output, 'live-user-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
const rows = result.pages.map(page => `<tr><td>${escapeHtml(page.finalUrl || page.requested)}</td><td>${page.status ?? ''}</td><td>${escapeHtml(page.title || '')}</td><td>${page.h1.length}</td><td>${page.links.length}</td><td>${page.buttons.length}</td><td>${page.forms.length}</td><td>${page.consoleErrors.length + page.pageErrors.length}</td></tr>`).join('');
const html = `<!doctype html><meta charset="utf-8"><title>Smarter Justice live audit</title><style>body{font-family:system-ui;margin:2rem;line-height:1.45}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:.45rem;text-align:left;vertical-align:top}pre{white-space:pre-wrap;background:#f5f5f5;padding:1rem}</style><h1>Smarter Justice live user audit</h1><p>Run ${runId}</p><pre>${escapeHtml(JSON.stringify(result.stats, null, 2))}</pre><h2>Host checks</h2><pre>${escapeHtml(JSON.stringify(result.hostChecks, null, 2))}</pre><h2>Critical findings</h2><pre>${escapeHtml(JSON.stringify(result.critical, null, 2))}</pre><h2>Warnings</h2><pre>${escapeHtml(JSON.stringify(result.warnings, null, 2))}</pre><h2>Pages</h2><table><thead><tr><th>URL</th><th>Status</th><th>Title</th><th>H1</th><th>Links</th><th>Buttons</th><th>Forms</th><th>Runtime errors</th></tr></thead><tbody>${rows}</tbody></table>`;
fs.writeFileSync(path.join(output, 'live-user-audit.html'), html);
console.log(JSON.stringify(result.stats, null, 2));
if (result.critical.length) process.exitCode = 2;
