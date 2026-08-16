'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = process.argv[2] || '.runtime/smarter-justice-v1.7.98';
const publicRoot = path.join(root, 'public');
const serverPath = path.join(root, 'server.js');
const homePath = path.join(publicRoot, 'index.html');
const stylesPath = path.join(publicRoot, 'styles.css');
const practiceScriptPath = path.join(publicRoot, 'practice-directory-pre60.js');
const communityScriptPath = path.join(publicRoot, 'community-resources-pre60.js');
const platformRelease = 'v2.0.0-pre61';
const platformMarker = 'SMARTER_JUSTICE_PRE61_PROFESSIONAL_DESIGN_SYSTEM';

for (const required of [serverPath, homePath, stylesPath, practiceScriptPath, communityScriptPath]) {
  if (!fs.existsSync(required)) throw new Error(`PRE61 missing runtime file: ${required}`);
}

function addBodyClass(html, className) {
  return html.replace(/<body(?: class="([^"]*)")?([^>]*)>/i, (_match, classes = '', tail = '') => {
    const next = [...new Set(`${classes} ${className}`.trim().split(/\s+/).filter(Boolean))].join(' ');
    return `<body class="${next}"${tail}>`;
  });
}

function addStyleBlock(html, css, marker) {
  if (html.includes(marker)) return html;
  if (!html.includes('</head>')) throw new Error(`PRE61 missing head seam for ${marker}`);
  return html.replace('</head>', `<style id="${marker}">\n${css}\n</style>\n</head>`);
}

function addDeferredScript(html, source, marker) {
  if (html.includes(`src="${source}"`)) return html;
  if (!html.includes('</head>')) throw new Error(`PRE61 missing script seam for ${source}`);
  return html.replace('</head>', `<script defer src="${source}" data-pre61-marker="${marker}"></script>\n</head>`);
}

function walkHtml(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(resolved);
    return entry.isFile() && entry.name.endsWith('.html') ? [resolved] : [];
  });
}

let server = fs.readFileSync(serverPath, 'utf8');
if (!server.includes(platformMarker)) {
  const releaseSeam = "currentPlatformRelease:'v2.0.0-pre60'";
  const markerSeam = "platformMarker:'SMARTER_JUSTICE_PRE60_RELEASE_IDENTITY_COHERENCE'";
  if (!server.includes(releaseSeam) || !server.includes(markerSeam)) {
    throw new Error('PRE61 release identity seam missing');
  }
  server = server
    .replace(releaseSeam, `currentPlatformRelease:'${platformRelease}'`)
    .replace(markerSeam, `platformMarker:'${platformMarker}'`);
  fs.writeFileSync(serverPath, server, 'utf8');
}

// Add the design-system scope to every page already admitted to the cohesive
// pre60 shell. This changes presentation only; routes, text, and capabilities
// remain in place.
const centralFooter = `<footer class="u-footer"><div class="u-wrap u-footer-grid"><div><a class="u-brand" href="/"><img src="/logo.svg" alt="Smarter Justice"></a><p>Legal starting help, practical community resources, preparation tools, and independent professional profiles in one connected platform.</p></div><div><h4>Get help</h4><a href="/practice-areas.html">Legal areas</a><a href="/community-resources.html">Community resources</a><a href="/free-tools.html">Free tools</a><a href="/professionals.html">Find a professional</a></div><div><h4>Learn</h4><a href="/how-it-works.html">How it works</a><a href="/launch-status.html">Current availability</a><a href="/our-story.html">Our story</a><a href="/contact.html">Contact</a></div><div><h4>Professionals</h4><a href="/attorney-partner-tour.html">Professional overview</a><a href="/professional-growth.html">Professional workspace</a><a href="/professionals.html">Find or claim a profile</a><a href="/professional-login.html">Sign in</a></div></div><div class="u-wrap pre61-footer-legal"><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/disclaimer.html">Disclaimer</a><a href="/security.html">Security</a></div></footer>`;
const microportalRoutes = new Map([
  ['businesslawaid.com', '/business-law'],
  ['civilrightslawaid.com', '/civil-rights'],
  ['consumerprotectionlawaid.com', '/consumer-protection'],
  ['disabilitylawaid.com', '/disability'],
  ['divorcelawaid.com', '/divorce'],
  ['domesticviolenceaid.com', '/domestic-violence'],
  ['eldercarelawaid.com', '/elder-law'],
  ['employmentlawaid.com', '/employment'],
  ['estatelawaid.com', '/estate'],
  ['immigrationoasis.com', '/immigration'],
  ['justicetaxsolutions.com', '/tax'],
  ['medicalmalpracticeaid.com', '/medical-malpractice'],
  ['personalinjurylawaid.com', '/personal-injury'],
  ['realestatelawaid.com', '/real-estate'],
  ['veteranslawaid.com', '/veterans'],
  ['stopsignproject.org', '/community-resources.html?focus=domestic-violence-relationship-abuse#community-needs']
]);

for (const filePath of walkHtml(publicRoot)) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('pre60-platform') && !html.includes('pre61-platform')) html = addBodyClass(html, 'pre61-platform');

  // Earlier generations left two mobile menus on a subset of module pages.
  // Keep the shared data-nav menu, remove the older duplicate, and ensure the
  // shared app controller is present so the surviving control always works.
  if (html.includes('data-nav-toggle') && html.includes('class="u-menu-toggle"')) {
    html = html
      .replace(/<button class="u-menu-toggle"[\s\S]*?<\/button>/, '<!-- SMARTER_JUSTICE_PRE61_DUPLICATE_MOBILE_MENU_REMOVED -->')
      .replace(/<nav class="u-mobile-menu"[\s\S]*?<\/nav>/, '')
      .replace(/<script id="universal-navigation-polish-v1-script">[\s\S]*?<\/script>/, '');
    html = addDeferredScript(html, '/app.js', 'SMARTER_JUSTICE_PRE61_SINGLE_MOBILE_MENU_CONTROLLER');
  }

  // Route every legacy focused-site button back into the central platform.
  // Official government, hotline, and provider links on the community page
  // are intentionally unaffected.
  html = html.replace(/href="https?:\/\/([^\/"]+)(?:\/[^\"]*)?"/gi, (match, host) => {
    const route = microportalRoutes.get(String(host).toLowerCase().replace(/^www\./, ''));
    return route ? `href="${route}" data-pre61-centralized-link="true"` : match;
  });
  html = html
    .replace(/>Open focused website<\/a>/g, '>View in Smarter Justice</a>')
    .replace(/>Focused website<\/a>/g, '>View in Smarter Justice</a>')
    .replace(/>Open Stop Sign Project<\/a>/g, '>Find confidential support</a>');

  // When a module already had a central action, replacing its legacy external
  // action can create two buttons to the same route. Keep only the first clear
  // action so the module funnel remains simple and unambiguous.
  html = html.replace(/<div class="u-module-actions">([\s\S]*?)<\/div>/g, (_match, actions) => {
    const seen = new Set();
    const unique = actions.replace(/<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>/g, (anchor, href) => {
      if (seen.has(href)) return '';
      seen.add(href);
      return anchor;
    });
    return `<div class="u-module-actions">${unique}</div>`;
  });
  html = html.replace(/<article class="u-module-card">([\s\S]*?)<\/article>/g, (card) => {
    if (/Criminal (?:Defense|Law Aid)/i.test(card)) {
      return card.replace(/href="\/practice-areas\.html"/, 'href="/?practice=criminal-defense-traffic-license#public-start"');
    }
    if (/Bankruptcy/i.test(card)) {
      return card.replace(/href="\/practice-areas\.html"/, 'href="/bankruptcy-debt.html"');
    }
    return card;
  });

  if (/<footer class="u-footer">[\s\S]*?<\/footer>/i.test(html)) {
    html = html.replace(/<footer class="u-footer">[\s\S]*?<\/footer>/i, centralFooter);
  }
  fs.writeFileSync(filePath, html, 'utf8');
}

let home = fs.readFileSync(homePath, 'utf8');
home = addBodyClass(home, 'pre61-platform');
if (!home.includes('SMARTER_JUSTICE_PRE61_NAVIGATOR_LAYOUT_REPAIR')) {
  const navigatorSeam = /<section class="navp-home-cta">[\s\S]*?<\/section>/;
  if (!navigatorSeam.test(home)) throw new Error('PRE61 Navigator layout seam missing');
  home = home.replace(
    navigatorSeam,
    `<section class="navp-home-cta" aria-labelledby="navigator-home-title"><div class="navp-home-cta__content"><p class="eyebrow">Smarter Justice Navigator</p><h2 id="navigator-home-title">Organize a question, document, or next step.</h2><p>Use guided tools to summarize, draft, build a checklist, or decide where to begin. Rules-based guidance remains available when AI is not used.</p></div><a class="navp-home-cta__action" href="/navigator">Open Navigator <span aria-hidden="true">→</span></a><!-- SMARTER_JUSTICE_PRE61_NAVIGATOR_LAYOUT_REPAIR --></section>`
  );
  const iconLabels = ['01', '02', '03', '04', '05', '06'];
  let iconIndex = 0;
  home = home.replace(/<div class="u-icon">[^<]*<\/div>/g, () => {
    const label = iconLabels[iconIndex++] || String(iconIndex).padStart(2, '0');
    return `<div class="u-icon" aria-hidden="true">${label}</div>`;
  });
  if (iconIndex !== 6) throw new Error(`PRE61 expected 6 home path icons, found ${iconIndex}`);
}

home = addStyleBlock(home, `
/* SMARTER_JUSTICE_PRE61_HOME_REFINEMENT */
.pre61-platform.u-page{background:#fff}
.pre61-platform .u-header{background:rgba(255,255,255,.985);box-shadow:none;border-bottom:1px solid #dce5e7}
.pre61-platform .u-nav{height:66px}.pre61-platform .u-links{gap:4px}.pre61-platform .u-links a{padding:8px 9px;border-radius:5px}.pre61-platform .u-links a:hover{background:#f1f5f5;text-decoration:none}
.pre61-platform .u-hero{padding:58px 0 54px;background:#f7faf9;border-bottom:1px solid #dce5e7}
.pre61-platform .u-hero-grid{grid-template-columns:minmax(0,1.06fr) minmax(360px,.94fr);gap:46px;align-items:start}
.pre61-platform .u-hero h1{max-width:680px;font-size:clamp(2.7rem,4.25vw,3.55rem);line-height:1.02;letter-spacing:-.04em;margin:10px 0 18px}
.pre61-platform .u-lead{max-width:680px;font-size:1.08rem;line-height:1.65}.pre61-platform .u-start{padding:24px;border-radius:10px;box-shadow:none;border-color:#cbd8db}
.pre61-platform .u-start textarea{min-height:126px;border-radius:6px}.pre61-platform .u-btn{border-radius:6px}
.pre61-platform .navp-home-cta{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:30px;margin:0!important;max-width:none!important;padding:26px max(24px,calc((100% - 1180px)/2))!important;background:#102f46!important;border:0!important;border-bottom:1px solid #24475d!important;border-radius:0!important;color:#fff}
.pre61-platform .navp-home-cta__content{display:grid;grid-template-columns:180px minmax(260px,.75fr) minmax(340px,1.25fr);align-items:center;gap:22px}.pre61-platform .navp-home-cta .eyebrow{margin:0;color:#7fd7ce}.pre61-platform .navp-home-cta h2{margin:0!important;color:#fff;font-size:1.34rem;line-height:1.22}.pre61-platform .navp-home-cta p{margin:0;color:#dce8eb;font-size:.93rem;line-height:1.52}
.pre61-platform .navp-home-cta__action{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:.68rem .88rem;border:1px solid #8ba7b2;border-radius:6px;color:#fff;text-decoration:none;font-weight:800;white-space:nowrap}.pre61-platform .navp-home-cta__action:hover{background:#1b4158}
.pre61-platform .u-section{padding:50px 0}.pre61-platform .u-section.alt{background:#f6f8f8}.pre61-platform .u-section-head{align-items:start;margin-bottom:20px}.pre61-platform .u-section h2{font-size:clamp(1.8rem,2.7vw,2.35rem)}
.pre61-platform .u-paths{gap:12px}.pre61-platform .u-card{padding:19px;border-radius:9px;box-shadow:none}.pre61-platform .u-card:hover{transform:none;border-color:#789ba1;box-shadow:0 7px 20px rgba(16,47,70,.06)}.pre61-platform .u-icon{display:grid;place-items:center;width:34px;height:30px;border-left:3px solid #0a6865;color:#0a6865;font-size:.72rem;font-weight:850;letter-spacing:.08em}
.pre61-platform .u-card h3{margin:13px 0 7px}.pre61-platform .u-panel{padding:24px;border-radius:9px;box-shadow:none}.pre61-platform .u-panel.safety{background:#fffaf2}.pre61-platform .u-prof{padding:28px 30px;border-radius:9px}
.pre61-platform .u-footer{padding:28px 0 40px;background:#fff}.pre61-platform .u-footer-grid{gap:20px}
.pre61-platform .pre61-footer-legal{display:flex;gap:16px;flex-wrap:wrap;padding-top:18px;margin-top:18px;border-top:1px solid #e1e8e9}.pre61-platform .pre61-footer-legal a{color:var(--u-muted);text-decoration:none}.pre61-platform .pre61-footer-legal a:hover{text-decoration:underline}
@media(max-width:1050px){.pre61-platform .navp-home-cta__content{grid-template-columns:150px minmax(220px,.8fr) minmax(260px,1.2fr)}.pre61-platform .u-hero-grid{gap:30px}}
@media(max-width:900px){.pre61-platform .u-hero-grid{grid-template-columns:1fr}.pre61-platform .navp-home-cta{grid-template-columns:1fr;gap:16px}.pre61-platform .navp-home-cta__content{grid-template-columns:1fr;gap:5px}.pre61-platform .navp-home-cta__action{justify-self:start}.pre61-platform .u-hero{padding-top:40px}}
@media(max-width:620px){.pre61-platform .u-hero{padding:36px 0}.pre61-platform .u-hero h1{font-size:2.28rem}.pre61-platform .u-start{padding:17px}.pre61-platform .navp-home-cta{padding:22px 16px!important}.pre61-platform .u-section{padding:38px 0}.pre61-platform .u-card,.pre61-platform .u-panel{padding:17px}.pre61-platform .u-prof{padding:22px 18px}.pre61-platform .u-footer-grid{gap:14px}.pre61-platform .u-footer-grid>div:not(:first-child){border-top:1px solid #e3e9ea;padding-top:12px}}
`, 'SMARTER_JUSTICE_PRE61_HOME_REFINEMENT');
fs.writeFileSync(homePath, home, 'utf8');

// Reduce the first mobile scan from long walls of cards to six useful choices.
// Desktop keeps the broader pre60 overview, and search/show-all still exposes
// every existing card.
let practiceScript = fs.readFileSync(practiceScriptPath, 'utf8');
if (!practiceScript.includes('SMARTER_JUSTICE_PRE61_MOBILE_DIRECTORY_LIMIT')) {
  const seam = "  let expanded=false;\n  const render=()=>{";
  if (!practiceScript.includes(seam)) throw new Error('PRE61 practice disclosure seam missing');
  practiceScript = practiceScript
    .replace(seam, "  let expanded=false;\n  // SMARTER_JUSTICE_PRE61_MOBILE_DIRECTORY_LIMIT\n  const initialLimit=()=>window.matchMedia('(max-width:620px)').matches?6:12;\n  const render=()=>{")
    .replace('index<12||card.id===target', 'index<initialLimit()||card.id===target')
    .replace("Math.min(12,cards.length)", "Math.min(initialLimit(),cards.length)")
    .replace("  input?.addEventListener('input',render);", "  input?.addEventListener('input',render);\n  window.matchMedia('(max-width:620px)').addEventListener?.('change',render);");
  fs.writeFileSync(practiceScriptPath, practiceScript, 'utf8');
}

let communityScript = fs.readFileSync(communityScriptPath, 'utf8');
if (!communityScript.includes('SMARTER_JUSTICE_PRE61_MOBILE_COMMUNITY_LIMIT')) {
  const seam = "  let expanded=false;\n  const render=()=>{";
  if (!communityScript.includes(seam)) throw new Error('PRE61 community disclosure seam missing');
  communityScript = communityScript
    .replace(seam, "  let expanded=false;\n  // SMARTER_JUSTICE_PRE61_MOBILE_COMMUNITY_LIMIT\n  const initialLimit=()=>window.matchMedia('(max-width:620px)').matches?6:9;\n  const render=()=>{")
    .replace("index<9||card.classList.contains('is-focused')", "index<initialLimit()||card.classList.contains('is-focused')")
    .replace("Math.min(9,cards.length)", "Math.min(initialLimit(),cards.length)")
    .replace("  input?.addEventListener('input',render);", "  input?.addEventListener('input',render);\n  window.matchMedia('(max-width:620px)').addEventListener?.('change',render);");
  fs.writeFileSync(communityScriptPath, communityScript, 'utf8');
}

let styles = fs.readFileSync(stylesPath, 'utf8');
if (!styles.includes(platformMarker)) {
  styles += `

/* SMARTER_JUSTICE_PRE61_PROFESSIONAL_DESIGN_SYSTEM */
:root{--navy:#102f46;--teal:#0a6865;--mint:#edf7f5;--ink:#1b303b;--muted:#586b74;--line:#d8e2e4;--paper:#fff;--bg:#fff;--surface-muted:#f5f8f8;--link:#075f72;--shadow:0 6px 18px rgba(16,47,70,.05)}
body.pre61-platform{background:#fff;color:var(--ink);font-size:16px;line-height:1.62}
.pre61-platform .site-header{min-height:66px;background:rgba(255,255,255,.985);box-shadow:none;border-bottom:1px solid var(--line)}
.pre61-platform .pre60-site-header .top-nav a{border-radius:5px;font-weight:720}.pre61-platform .pre60-site-header .top-nav a:hover,.pre61-platform .pre60-site-header .top-nav a[aria-current="page"]{background:#f0f5f5}.pre61-platform .header-signin,.pre61-platform .language-toggle,.pre61-platform .nav-toggle{border-radius:6px}
.pre61-platform .hero,.pre61-platform .page-hero{min-height:0;background:#f7faf9!important;border-bottom:1px solid var(--line)}
.pre61-platform .hero,.pre61-platform .page-hero,.pre61-platform .section{padding:clamp(2.4rem,4vw,3.5rem) max(1rem,calc((100vw - 1200px)/2))}
.pre61-platform .page-hero h1,.pre61-platform .hero h1,.pre61-platform .professional-auth-card h1{max-width:860px;font-size:clamp(2.35rem,3.9vw,3.4rem);line-height:1.04;letter-spacing:-.038em}.pre61-platform .lead{max-width:760px;font-size:1.08rem;line-height:1.66}
.pre61-platform h2,.pre61-platform .section-heading h2{font-size:clamp(1.65rem,2.45vw,2.2rem);letter-spacing:-.024em}.pre61-platform .section-heading{margin-bottom:1.2rem}.pre61-platform .eyebrow{letter-spacing:.105em;font-size:.76rem}
.pre61-platform .card,.pre61-platform .mini-card,.pre61-platform .tile,.pre61-platform .practice-card,.pre61-platform .question-card,.pre61-platform .urgent-help-card{border-radius:9px;border-color:var(--line);box-shadow:none}
.pre61-platform .primary,.pre61-platform .secondary,.pre61-platform .link-btn,.pre61-platform .button-link{border-radius:6px;min-height:43px;padding:.7rem .92rem}.pre61-platform .primary{box-shadow:none}.pre61-platform .badge{border-radius:5px}.pre61-platform input,.pre61-platform select,.pre61-platform textarea{border-radius:6px!important}
.pre61-platform .u-btn-primary{background:var(--teal);border-color:var(--teal);box-shadow:none}.pre61-platform .u-btn-primary:hover{background:#075653;border-color:#075653}
.pre61-platform .site-footer{padding:2rem max(1rem,calc((100vw - 1200px)/2))}.pre61-platform .live-chat-fallback{right:14px;bottom:14px;border-radius:7px;padding:.68rem .78rem;box-shadow:0 4px 14px rgba(10,104,101,.18)}
.pre61-platform .pre61-footer-legal{display:flex;gap:1rem;flex-wrap:wrap;padding-top:1rem;margin-top:1rem;border-top:1px solid var(--line)}.pre61-platform .pre61-footer-legal a{color:var(--muted);text-decoration:none}.pre61-platform .pre61-footer-legal a:hover{text-decoration:underline}

/* Legal-area directory */
.pre61-platform .pre60-directory-search{padding:1.7rem max(1rem,calc((100vw - 1200px)/2));background:#102f46}.pre61-platform .pre60-directory-search h2{font-size:1.75rem}.pre61-platform .pre60-directory-search input{min-height:50px;border-radius:6px!important}
.pre61-platform .light-section{padding-top:2.6rem;padding-bottom:2.6rem}.pre61-platform .light-section>.tile-grid,.pre61-platform .pre60-all-practices>.practice-grid,.pre61-platform .pre60-all-practices>.section-heading,.pre61-platform .pre60-all-practices>.pre60-show-row{max-width:1200px}
.pre61-platform .tile-grid{gap:.7rem}.pre61-platform .tile{padding:.9rem}.pre61-platform .practice-grid{gap:.8rem}.pre61-platform .practice-card{padding:1rem}.pre61-platform .practice-card h2{font-size:1.22rem}.pre61-platform .practice-card>p:not(.badge){font-size:.89rem}.pre61-platform .practice-topics{margin-bottom:.65rem}

/* Community-resource directory */
.pre61-platform .community-hero{padding:clamp(2.7rem,4.5vw,4rem) max(1rem,calc((100vw - 1200px)/2));grid-template-columns:minmax(0,1.08fr) minmax(330px,.64fr);gap:2.4rem;background:#f7faf9}
.pre61-platform .community-hero h1{max-width:760px;font-size:clamp(2.45rem,4vw,3.45rem)}.pre61-platform .community-hero .lead{font-size:1.03rem}.pre61-platform .urgent-help-card{padding:1.25rem;border-top:3px solid var(--teal)}.pre61-platform .urgent-help-card h2{font-size:1.85rem}.pre61-platform .urgent-help-card li{margin:.42rem 0;font-size:.92rem}
.pre61-platform .community-needs-section{background:#f6f8f8}.pre61-platform .community-needs-grid{max-width:1200px;gap:.8rem}.pre61-platform .community-need-card{padding:1rem;border-radius:9px}.pre61-platform .pre60-community-search input{min-height:49px}.pre61-platform .pre60-collapsible-section>details{max-width:1200px;border-radius:9px;box-shadow:none}.pre61-platform .pre60-community-close{background:#102f46}

/* Professional tour and operating pages */
.pre61-professional .tour-hero{padding:clamp(3rem,5vw,4.3rem) max(1rem,calc((100vw - 1200px)/2));grid-template-columns:minmax(0,1.2fr) minmax(320px,.72fr);align-items:start;background:#f7faf9!important}.pre61-professional .tour-hero-copy h1{max-width:760px;font-size:clamp(2.6rem,4vw,3.45rem);line-height:1.02}.pre61-professional .tour-hero-copy .lead{font-size:1.05rem}.pre61-professional .tour-quick-card{border-radius:9px;box-shadow:none;border:1px solid var(--line);padding:1.25rem}.pre61-professional .tour-practice-choices button{border-radius:6px;min-height:46px}
.pre61-professional .tour-proof-grid{gap:.65rem}.pre61-professional .tour-proof-grid>div{border-radius:7px;padding:.85rem;background:#fff;box-shadow:none}.pre61-professional .tour-mode-bar{border-radius:8px;box-shadow:none}.pre61-professional .tour-step-nav{box-shadow:none;background:rgba(255,255,255,.985)}.pre61-professional .tour-step-nav a{border-radius:5px}
.pre61-professional .tour-story{max-width:1120px;padding-top:2rem}.pre61-professional .tour-step{grid-template-columns:52px minmax(0,1fr);gap:1.05rem;border-radius:9px;padding:clamp(1.15rem,2.5vw,1.8rem);margin-bottom:.85rem;box-shadow:none}.pre61-professional .tour-step-number{width:42px;height:42px;border-radius:7px;font-size:1rem}.pre61-professional .tour-step-content h2{max-width:860px;font-size:clamp(1.65rem,2.8vw,2.35rem)}
.pre61-professional .tour-step .card,.pre61-professional .tour-dashboard-preview article{background:#f7f9f9;border-radius:7px;box-shadow:none;padding:1rem}.pre61-professional .tour-profile-showcase,.pre61-professional .tour-tool-boundary,.pre61-professional .tour-handoff-grid>*,.pre61-professional .tour-disclosure{border-radius:7px;box-shadow:none}.pre61-professional .tour-profile-fields>div{padding:.9rem}.pre61-professional .tour-dashboard-preview{gap:.7rem}.pre61-professional .tour-checks{columns:2;column-gap:2.2rem}.pre61-professional .tour-final-actions{gap:.55rem}

@media(max-width:900px){.pre61-platform .community-hero,.pre61-professional .tour-hero{grid-template-columns:1fr}.pre61-professional .tour-proof-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:620px){body.pre61-platform{font-size:15.5px}.pre61-platform .hero,.pre61-platform .page-hero,.pre61-platform .section{padding:2rem 1rem}.pre61-platform .page-hero h1,.pre61-platform .hero h1{font-size:2.22rem}.pre61-platform .live-chat-fallback{right:10px;bottom:10px;padding:.58rem .67rem;font-size:.78rem}.pre61-platform .pre60-directory-search{padding:1.35rem 1rem}.pre61-platform .light-section{padding-block:2rem}.pre61-platform .community-hero{padding:2.15rem 1rem}.pre61-platform .community-hero h1{font-size:2.25rem}.pre61-platform .urgent-help-card{padding:1rem}.pre61-platform .u-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1.1rem}.pre61-platform .u-footer-grid>div:first-child{grid-column:1/-1}.pre61-platform .u-footer-grid>div:not(:first-child){border-top:0;padding-top:0}.pre61-professional .tour-hero{padding:2.2rem 1rem}.pre61-professional .tour-hero-copy h1{font-size:2.35rem}.pre61-professional .tour-proof-grid{grid-template-columns:1fr}.pre61-professional .tour-story{padding:1rem .75rem}.pre61-professional .tour-step{grid-template-columns:38px minmax(0,1fr);gap:.7rem;padding:1rem .85rem}.pre61-professional .tour-step-number{width:34px;height:34px}.pre61-professional .tour-step-content h2{font-size:1.65rem}.pre61-professional .tour-checks{columns:1}.pre61-professional .cards.three{gap:.6rem}.pre61-professional .tour-final-actions>*{width:100%;justify-content:center}}
`;
  fs.writeFileSync(stylesPath, styles, 'utf8');
}

console.log(`PRE61 professional design system applied to ${root}`);
