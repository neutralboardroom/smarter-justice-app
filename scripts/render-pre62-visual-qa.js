'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');

const runtimeRoot = path.resolve(process.argv[2] || '.runtime/smarter-justice-v1.7.98');
const outputRoot = path.resolve(process.argv[3] || 'deployment/pre62/screenshots');
const toolsRoot = process.env.PRE62_PLAYWRIGHT_ROOT;
if (!toolsRoot) throw new Error('Set PRE62_PLAYWRIGHT_ROOT to the directory containing playwright-core and @sparticuz/chromium.');

const {chromium: playwrightChromium} = require(path.join(toolsRoot, 'playwright-core'));
const chromium = require(path.join(toolsRoot, '@sparticuz/chromium'));
const preparedChromiumPath = process.env.PRE62_CHROMIUM_PATH;
const port = 32162;
const origin = `http://127.0.0.1:${port}`;
const routes = [
  {name: 'home', path: '/'},
  {name: 'legal-areas', path: '/practice-areas.html'},
  {name: 'community-resources', path: '/community-resources.html'},
  {name: 'professional-tour', path: '/attorney-partner-tour.html?practice=divorce'},
];
const viewports = [
  {name: 'desktop', width: 1440, height: 1000, isMobile: false},
  {name: 'phone', width: 390, height: 844, isMobile: true},
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${origin}/health`);
      if (response.ok) return;
    } catch {}
    await sleep(125);
  }
  throw new Error('PRE62 local server did not become healthy.');
}

async function inspectPage(page, route, viewport) {
  await page.goto(`${origin}${route.path}`, {waitUntil: 'networkidle'});
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    bodyClass: document.body.className,
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    toggleCount: document.querySelectorAll('[data-nav-toggle]').length,
    visiblePracticeCards: [...document.querySelectorAll('.practice-card')].filter((node) => getComputedStyle(node).display !== 'none').length,
    visibleCommunityCards: [...document.querySelectorAll('.community-need-card')].filter((node) => getComputedStyle(node).display !== 'none').length,
    visibleTourSteps: [...document.querySelectorAll('.tour-step')].filter((node) => getComputedStyle(node).display !== 'none').length,
    externalMicroportalLinks: [...document.querySelectorAll('a[href]')].filter((node) => /(?:divorce|injury|immigration|tax|estate|disability|malpractice)-law-aid|justice-tax-solutions/i.test(new URL(node.href, location.href).hostname)).map((node) => node.href),
  }));

  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    throw new Error(`${viewport.name}/${route.name} has horizontal overflow (${metrics.scrollWidth} > ${metrics.clientWidth}).`);
  }
  if (metrics.toggleCount !== 1) {
    throw new Error(`${viewport.name}/${route.name} has ${metrics.toggleCount} shared mobile menu controls.`);
  }
  if (metrics.externalMicroportalLinks.length) {
    throw new Error(`${viewport.name}/${route.name} exposes microportal links: ${metrics.externalMicroportalLinks.join(', ')}`);
  }

  if (viewport.isMobile) {
    const toggle = page.locator('[data-nav-toggle]').first();
    await toggle.click();
    const expanded = await toggle.getAttribute('aria-expanded');
    const navVisible = await page.locator('[data-nav]').first().isVisible();
    if (expanded !== 'true' || !navVisible) throw new Error(`Mobile menu did not open on ${route.name}.`);
    await toggle.click();
    if (await toggle.getAttribute('aria-expanded') !== 'false') throw new Error(`Mobile menu did not close on ${route.name}.`);
  }

  const screenshotName = `${route.name}__${viewport.name}.png`;
  await page.screenshot({path: path.join(outputRoot, screenshotName), fullPage: true});
  return {...metrics, route: route.path, viewport: viewport.name, screenshot: screenshotName};
}

async function main() {
  fs.mkdirSync(outputRoot, {recursive: true});
  const server = spawn(process.execPath, ['server.js'], {
    cwd: runtimeRoot,
    env: {...process.env, PORT: String(port)},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverOutput = '';
  server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
  server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

  let browser;
  try {
    await waitForServer();
    const executablePath = preparedChromiumPath || await chromium.executablePath();
    browser = await playwrightChromium.launch({
      executablePath,
      args: chromium.args,
      headless: true,
    });
    const audits = [];
    const context = await browser.newContext({viewport: {width: viewports[0].width, height: viewports[0].height}, deviceScaleFactor: 1});
    const page = await context.newPage();
    for (const viewport of viewports) {
      await page.setViewportSize({width: viewport.width, height: viewport.height});
      for (const route of routes) audits.push(await inspectPage(page, route, viewport));
    }
    await page.close();
    await context.close();
    fs.writeFileSync(path.join(path.dirname(outputRoot), 'VISUAL_QA_METRICS__PRE62.json'), `${JSON.stringify({generatedAt: new Date().toISOString(), audits}, null, 2)}\n`);
    console.log(JSON.stringify(audits, null, 2));
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
    await sleep(100);
    if (!server.killed) server.kill('SIGKILL');
    if (server.exitCode && server.exitCode !== 0) process.stderr.write(serverOutput);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
