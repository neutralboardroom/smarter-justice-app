'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = process.argv[2] || '.runtime/smarter-justice-v1.7.98';
const publicRoot = path.join(root, 'public');
const serverPath = path.join(root, 'server.js');
const stylesPath = path.join(publicRoot, 'styles.css');
const homePath = path.join(publicRoot, 'index.html');
const tourPath = path.join(publicRoot, 'attorney-partner-tour.html');
const tourScriptPath = path.join(publicRoot, 'attorney-partner-tour.js');
const platformRelease = 'v2.0.0-pre62';
const platformMarker = 'SMARTER_JUSTICE_PRE62_EXECUTIVE_CLARITY';

for (const required of [serverPath, stylesPath, homePath, tourPath, tourScriptPath]) {
  if (!fs.existsSync(required)) throw new Error(`PRE62 missing runtime file: ${required}`);
}

const walkHtml = (directory) => fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
  const resolved = path.join(directory, entry.name);
  if (entry.isDirectory()) return walkHtml(resolved);
  return entry.isFile() && entry.name.endsWith('.html') ? [resolved] : [];
});

function addBodyClass(html, className) {
  return html.replace(/<body(?: class="([^"]*)")?([^>]*)>/i, (_match, classes = '', tail = '') => {
    const next = [...new Set(`${classes} ${className}`.trim().split(/\s+/).filter(Boolean))].join(' ');
    return `<body class="${next}"${tail}>`;
  });
}

let server = fs.readFileSync(serverPath, 'utf8');
if (!server.includes(platformMarker)) {
  const releaseSeam = "currentPlatformRelease:'v2.0.0-pre61'";
  const markerSeam = "platformMarker:'SMARTER_JUSTICE_PRE61_PROFESSIONAL_DESIGN_SYSTEM'";
  if (!server.includes(releaseSeam) || !server.includes(markerSeam)) {
    throw new Error('PRE62 release identity seam missing');
  }
  server = server
    .replace(releaseSeam, `currentPlatformRelease:'${platformRelease}'`)
    .replace(markerSeam, `platformMarker:'${platformMarker}'`);
  fs.writeFileSync(serverPath, server, 'utf8');
}

// All cohesive pages receive the same final design scope. The attorney tour
// also receives a dedicated scope; pre61 defined it but did not attach it.
for (const filePath of walkHtml(publicRoot)) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('pre61-platform')) html = addBodyClass(html, 'pre62-platform');
  if (path.basename(filePath) === 'attorney-partner-tour.html') html = addBodyClass(html, 'pre62-professional');

  // One visible mobile control and one shared navigation controller are the
  // entire mobile navigation surface. This also removes stale legacy menus.
  if (html.includes('data-nav-toggle') && html.includes('data-nav')) {
    const toggles = html.match(/data-nav-toggle/g) || [];
    if (toggles.length > 1) throw new Error(`PRE62 duplicate shared menu controls: ${filePath}`);
    html = html
      .replace(/<button class="u-menu-toggle"[\s\S]*?<\/button>/g, '')
      .replace(/<nav class="u-mobile-menu"[\s\S]*?<\/nav>/g, '')
      .replace(/<button([^>]*data-nav-toggle[^>]*)>[^<]*<\/button>/, '<button$1><span aria-hidden="true">Menu</span><span class="visually-hidden">Open navigation</span></button>');
  }
  fs.writeFileSync(filePath, html, 'utf8');
}

let home = fs.readFileSync(homePath, 'utf8');
home = addBodyClass(home, 'pre62-platform');
if (!home.includes('SMARTER_JUSTICE_PRE62_HOME_FUNNEL')) {
  home = home
    .replace('<main>', '<main id="main">')
    .replace('Start with what happened. We’ll help you find the right next step.', 'Start with what happened. Get a clear next step.')
    .replace('You do not need to know the legal category. Smarter Justice brings legal starting help, safety-first pathways, practical community resources, focused specialty areas, and independent professional profiles into one clearer network.', 'Describe your situation once. We’ll help you choose a legal area, prepare useful information, find practical resources, or locate an independent professional.')
    .replace('Choose a path, or start with your story.', 'Choose a common path.')
    .replace('Focused areas keep the specialized tools and guidance people need while sharing one Smarter Justice network, professional directory, account system, and public mission.', 'Browse six common starting points, or use the complete legal-area directory when you need something more specific.')
    .replace('Growth, operations, and compliance — under one roof.', 'A professional platform built for clarity and responsible growth.')
    .replace('Smarter Justice connects professional visibility and better-prepared prospects with firm operations and jurisdiction-aware marketing safeguards—so growth, intake, follow-up, firm administration, and responsible marketing can work from one professional platform.', 'Connect a source-backed professional presence, better-prepared prospects, practical operating tools, and jurisdiction-aware marketing checks in one workspace.')
    .replace('<!-- SMARTER_JUSTICE_PRE61_NAVIGATOR_LAYOUT_REPAIR -->', '<!-- SMARTER_JUSTICE_PRE61_NAVIGATOR_LAYOUT_REPAIR --><!-- SMARTER_JUSTICE_PRE62_HOME_FUNNEL -->');
  if (!home.includes('id="main"') || !home.includes('SMARTER_JUSTICE_PRE62_HOME_FUNNEL')) {
    throw new Error('PRE62 home funnel seams missing');
  }
  fs.writeFileSync(homePath, home, 'utf8');
}

let tour = fs.readFileSync(tourPath, 'utf8');
if (!tour.includes('SMARTER_JUSTICE_PRE62_PROFESSIONAL_FUNNEL')) {
  tour = tour
    .replace('See what Smarter Justice can demonstrate for your firm today—start to finish.', 'A clearer path from public need to professional action.')
    .replace('Smarter Justice connects the public place where people start organizing a legal problem with professional discovery and attorney-side tools. The goal is simple: help the right people find you, help them arrive better prepared, and give your firm practical marketing guardrails without presenting unfinished features as ready.', 'Show how people discover relevant help, prepare before contact, and reach a source-backed professional presence—then continue into practical firm tools and marketing checks.')
    .replace('Start 7-step demonstration', 'Start step-by-step tour')
    .replace('Explore the full page', 'View all seven steps')
    .replace('The full tour shows every section on one page.', 'Step-by-step mode keeps the walkthrough focused.')
    .replace('<main id="main">', '<main id="main"><!-- SMARTER_JUSTICE_PRE62_PROFESSIONAL_FUNNEL -->');
  fs.writeFileSync(tourPath, tour, 'utf8');
}

let tourScript = fs.readFileSync(tourScriptPath, 'utf8');
if (!tourScript.includes('SMARTER_JUSTICE_PRE62_STEP_BY_STEP_DEFAULT')) {
  const modeSeam = "mode=params.get('mode')==='presenter'?'presenter':'self-guided'";
  if (!tourScript.includes(modeSeam)) throw new Error('PRE62 attorney tour mode seam missing');
  tourScript = tourScript
    .replace(modeSeam, "/* SMARTER_JUSTICE_PRE62_STEP_BY_STEP_DEFAULT */ mode=params.get('mode')==='full'?'self-guided':'presenter'")
    .replace("n.searchParams.delete('mode');", "n.searchParams.set('mode','full');")
    .replace("'The full tour shows every section on one page.'", "'All seven steps are shown on one page.'")
    .replace("const claim=data.continuation?.profilePath||'/attorney-launch.html?campaign=ATTORNEY-TOUR';", "const claim=`/attorney-launch.html?campaign=ATTORNEY-TOUR&practice=${encodeURIComponent(requestedPractice)}`;");
  fs.writeFileSync(tourScriptPath, tourScript, 'utf8');
}

let styles = fs.readFileSync(stylesPath, 'utf8');
if (!styles.includes(platformMarker)) {
  styles += `

/* SMARTER_JUSTICE_PRE62_EXECUTIVE_CLARITY */
:root{--pre62-navy:#0d2f46;--pre62-teal:#08746f;--pre62-ink:#162c38;--pre62-muted:#5b6d76;--pre62-line:#dbe4e6;--pre62-soft:#f5f8f8;--pre62-focus:#b7791f}
html{scroll-padding-top:86px}
body.pre62-platform{background:#fff;color:var(--pre62-ink);font-size:16px;line-height:1.58;text-rendering:optimizeLegibility}
.pre62-platform h1,.pre62-platform h2,.pre62-platform h3{color:var(--pre62-navy);text-wrap:balance}
.pre62-platform p{max-width:76ch}.pre62-platform a{overflow-wrap:anywhere}
.pre62-platform :focus-visible{outline:3px solid var(--pre62-focus);outline-offset:3px}
.pre62-platform .site-header,.pre62-platform .u-header{min-height:64px;background:rgba(255,255,255,.98);border-bottom:1px solid var(--pre62-line);box-shadow:none;backdrop-filter:blur(10px)}
.pre62-platform .site-header{padding:.5rem max(1rem,calc((100vw - 1240px)/2))}.pre62-platform .u-nav{height:64px}
.pre62-platform .brand img,.pre62-platform .u-brand img{max-height:38px}.pre62-platform .top-nav,.pre62-platform .u-links{gap:.12rem}
.pre62-platform .top-nav a,.pre62-platform .u-links a{border-radius:5px;padding:.52rem .61rem;font-size:.9rem;font-weight:740;color:#263d49}
.pre62-platform .top-nav a:hover,.pre62-platform .top-nav a[aria-current="page"],.pre62-platform .u-links a:hover,.pre62-platform .u-links a[aria-current="page"]{background:#edf3f3;color:var(--pre62-navy);text-decoration:none}
.pre62-platform .nav-toggle,.pre62-platform .u-nav-toggle{border-radius:6px!important;box-shadow:none!important}.pre62-platform .header-signin,.pre62-platform .u-sign{border-radius:6px!important}
.pre62-platform .page-hero,.pre62-platform .hero{padding:clamp(2.4rem,4.2vw,3.7rem) max(1rem,calc((100vw - 1200px)/2));background:#f7faf9!important;border-bottom:1px solid var(--pre62-line)}
.pre62-platform .page-hero h1,.pre62-platform .hero h1{max-width:900px;font-size:clamp(2.35rem,4.2vw,3.55rem);line-height:1.02;letter-spacing:-.042em;margin:.42rem 0 1rem}
.pre62-platform .lead{max-width:760px;font-size:1.05rem;line-height:1.62;color:var(--pre62-muted)}
.pre62-platform .eyebrow,.pre62-platform .u-kicker{color:var(--pre62-teal);font-size:.74rem;letter-spacing:.12em;font-weight:850}
.pre62-platform .primary,.pre62-platform .secondary,.pre62-platform .link-btn,.pre62-platform .button,.pre62-platform .u-btn{min-height:44px;border-radius:6px!important;padding:.68rem .92rem;box-shadow:none!important}
.pre62-platform .primary,.pre62-platform .u-btn-primary{background:var(--pre62-navy);border-color:var(--pre62-navy)}.pre62-platform .primary:hover,.pre62-platform .u-btn-primary:hover{background:#16435e;border-color:#16435e}
.pre62-platform .secondary,.pre62-platform .u-btn-secondary{background:#fff;border-color:#b9c8cc;color:var(--pre62-navy)}
.pre62-platform .card,.pre62-platform .mini-card,.pre62-platform .tile,.pre62-platform .practice-card,.pre62-platform .question-card,.pre62-platform .urgent-help-card,.pre62-platform .community-need-card{border:1px solid var(--pre62-line);border-radius:8px;box-shadow:none;background:#fff}
.pre62-platform .badge{display:block;width:fit-content;border:0;border-left:3px solid #86c7c1;border-radius:0!important;background:transparent;padding:.12rem 0 .12rem .55rem;color:#356b68;font-size:.76rem;line-height:1.35}
.pre62-platform input,.pre62-platform select,.pre62-platform textarea{border-radius:6px!important;border-color:#b9c8cc!important;box-shadow:none!important}
.pre62-platform .site-footer,.pre62-platform .u-footer{background:#fff;border-top:1px solid var(--pre62-line);padding-top:2rem}
.pre62-platform .live-chat-fallback{right:12px;bottom:12px;border-radius:6px;padding:.62rem .74rem;box-shadow:0 4px 14px rgba(8,116,111,.15)}

/* Homepage: one primary funnel, then compact supporting choices. */
.pre62-platform.u-page .u-hero{padding:46px 0 44px}.pre62-platform .u-hero-grid{grid-template-columns:minmax(0,1.02fr) minmax(360px,.86fr);gap:54px;align-items:center}
.pre62-platform .u-hero h1{max-width:650px;font-size:clamp(2.6rem,4.25vw,3.45rem);line-height:1.01}.pre62-platform .u-lead{font-size:1.04rem;line-height:1.62}
.pre62-platform .u-trust{gap:14px;margin-top:22px}.pre62-platform .u-trust span{position:relative;padding-left:14px;font-size:.84rem;color:#536872}.pre62-platform .u-trust span:before{content:'';position:absolute;left:0;top:.55em;width:5px;height:5px;background:var(--pre62-teal)}
.pre62-platform .u-start{padding:22px;border-radius:8px;box-shadow:0 12px 32px rgba(13,47,70,.06)}.pre62-platform .u-start h2{font-size:1.55rem}.pre62-platform .u-start textarea{min-height:112px}
.pre62-platform .navp-home-cta{padding:18px max(24px,calc((100% - 1180px)/2))!important;gap:24px!important}.pre62-platform .navp-home-cta__content{grid-template-columns:160px minmax(240px,.8fr) minmax(320px,1.2fr);gap:18px}.pre62-platform .navp-home-cta h2{font-size:1.18rem!important}.pre62-platform .navp-home-cta p{font-size:.88rem!important}
.pre62-platform .u-section{padding:42px 0}.pre62-platform .u-section-head{margin-bottom:18px}.pre62-platform .u-section-head>p{max-width:580px}.pre62-platform .u-section h2{font-size:clamp(1.75rem,2.6vw,2.2rem)}
.pre62-platform .u-paths{gap:10px}.pre62-platform .u-card{padding:17px;border-radius:8px}.pre62-platform .u-card:hover{transform:none;border-color:#789da2;box-shadow:0 8px 20px rgba(13,47,70,.05)}.pre62-platform .u-card h3{font-size:1.08rem;margin:11px 0 6px}.pre62-platform .u-card p{font-size:.89rem;line-height:1.48}.pre62-platform .u-more{font-size:.83rem}
.pre62-platform .u-panel{padding:21px;border-radius:8px}.pre62-platform .u-prof{padding:26px 28px;border-radius:8px;grid-template-columns:minmax(0,1fr) auto}.pre62-platform .u-prof h2{max-width:720px!important;font-size:clamp(1.7rem,2.8vw,2.2rem)!important;color:#fff!important}.pre62-platform .u-prof p{max-width:760px;color:#dce8eb!important}
.pre62-platform .u-footer{padding:26px 0 34px}.pre62-platform .u-footer-grid{gap:22px}.pre62-platform .u-footer-grid p,.pre62-platform .u-footer-grid a{font-size:.86rem}

/* Directories: search first, compact previews, details on demand. */
.pre62-platform .pre60-directory-search{position:relative;z-index:1;max-width:1200px;margin:-1.35rem auto 0;padding:1.25rem 1.35rem;background:#fff;border:1px solid var(--pre62-line);border-radius:9px;box-shadow:0 12px 30px rgba(13,47,70,.06);color:var(--pre62-ink)}
.pre62-platform .pre60-directory-search h2{color:var(--pre62-navy);font-size:1.55rem}.pre62-platform .pre60-directory-search p,.pre62-platform .pre60-directory-search label{color:var(--pre62-muted)}.pre62-platform .pre60-directory-search .eyebrow{color:var(--pre62-teal)}
.pre62-platform .pre60-directory-search input{min-height:48px;background:#fff}.pre62-platform .pre60-directory-actions{align-items:center}
.pre62-platform .light-section{padding:2.35rem max(1rem,calc((100vw - 1200px)/2))}.pre62-platform .light-section h2{font-size:1.65rem}.pre62-platform .tile-grid{gap:.65rem}.pre62-platform .tile{padding:.9rem .95rem}.pre62-platform .tile strong{font-size:.98rem;line-height:1.35}.pre62-platform .tile span{font-size:.84rem;line-height:1.42}
.pre62-platform .pre60-all-practices{padding-top:2.4rem}.pre62-platform .practice-grid{gap:.72rem}.pre62-platform .practice-card{padding:1rem;min-width:0}.pre62-platform .practice-card h2{font-size:1.13rem;line-height:1.25;margin-top:0}.pre62-platform .practice-card>p:not(.badge){font-size:.84rem;line-height:1.48;color:var(--pre62-muted)}
.pre62-platform .practice-topics{margin:.65rem 0}.pre62-platform .practice-topics summary{font-size:.84rem;color:var(--pre62-teal)}.pre62-platform .practice-topics ul{font-size:.84rem}.pre62-platform .pre60-show-row{padding-top:1rem}

/* Community help: calm emergency hierarchy and scannable provider cards. */
.pre62-platform .community-hero{padding:clamp(2.5rem,4vw,3.5rem) max(1rem,calc((100vw - 1200px)/2));grid-template-columns:minmax(0,1.08fr) minmax(320px,.62fr);gap:2rem;align-items:start}.pre62-platform .community-hero h1{max-width:720px;font-size:clamp(2.45rem,4vw,3.45rem);line-height:1.02}.pre62-platform .urgent-help-card{padding:1.1rem 1.2rem;border-top:3px solid var(--pre62-teal)}.pre62-platform .urgent-help-card h2{font-size:1.62rem}.pre62-platform .urgent-help-card li{font-size:.86rem;line-height:1.5}
.pre62-platform .community-needs-section{padding-block:2.5rem}.pre62-platform .community-needs-grid{gap:.7rem}.pre62-platform .community-need-card{padding:1rem}.pre62-platform .community-need-card h3{font-size:1rem}.pre62-platform .community-need-card p{font-size:.86rem;line-height:1.5}.pre62-platform .community-need-card a{font-size:.85rem}
.pre62-platform .pre60-collapsible-section>details{border-radius:8px;box-shadow:none}.pre62-platform .pre60-collapsible-section summary{font-size:1rem}

/* Attorney funnel: focused walkthrough by default, compact proof and steps. */
.pre62-professional .tour-hero{padding:clamp(2.6rem,4.5vw,3.8rem) max(1rem,calc((100vw - 1200px)/2));grid-template-columns:minmax(0,1.14fr) minmax(320px,.66fr);gap:2.2rem;align-items:start;background:#f7faf9!important}
.pre62-professional .tour-hero-copy h1{max-width:740px;font-size:clamp(2.55rem,4vw,3.45rem);line-height:1.01;letter-spacing:-.04em}.pre62-professional .tour-hero-copy .lead{font-size:1.03rem;line-height:1.6}.pre62-professional .hero-actions{margin-top:1.15rem}
.pre62-professional .tour-proof-grid{gap:.55rem}.pre62-professional .tour-proof-grid>div{padding:.78rem .82rem;border-radius:7px;background:#fff;border:1px solid var(--pre62-line);box-shadow:none}.pre62-professional .tour-proof-grid strong{font-size:.92rem}.pre62-professional .tour-proof-grid span{font-size:.82rem;line-height:1.45}
.pre62-professional .tour-quick-card{border-radius:8px;box-shadow:none;border:1px solid var(--pre62-line);padding:1.15rem}.pre62-professional .tour-quick-card h2{font-size:1.5rem}.pre62-professional .tour-practice-choices{gap:.45rem}.pre62-professional .tour-practice-choices button{min-height:44px;border-radius:6px}
.pre62-professional .tour-mode-bar{max-width:1120px;margin:1rem auto;border-radius:8px;box-shadow:none}.pre62-professional .tour-mode-actions{gap:.45rem}.pre62-professional .tour-step-nav{top:64px;box-shadow:none;border-block:1px solid var(--pre62-line);background:rgba(255,255,255,.98)}.pre62-professional .tour-step-nav a{border-radius:4px;font-size:.82rem;white-space:nowrap}
.pre62-professional .tour-story{max-width:1060px;padding-top:1.2rem}.pre62-professional .tour-step{grid-template-columns:44px minmax(0,1fr);gap:.95rem;border-radius:8px;padding:clamp(1.15rem,2.4vw,1.65rem);margin-bottom:.75rem;box-shadow:none}.pre62-professional .tour-step-number{width:38px;height:38px;border-radius:6px;font-size:.9rem}.pre62-professional .tour-step-content h2{max-width:800px;font-size:clamp(1.55rem,2.6vw,2.15rem);line-height:1.1}.pre62-professional .tour-step-content>p{font-size:.93rem}
.pre62-professional .tour-step .card,.pre62-professional .tour-dashboard-preview article{padding:.9rem;background:#f7f9f9;border-radius:7px}.pre62-professional .tour-profile-showcase,.pre62-professional .tour-tool-boundary,.pre62-professional .tour-handoff-grid>*,.pre62-professional .tour-disclosure{border-radius:7px;box-shadow:none}.pre62-professional .tour-presenter-controls{max-width:1060px;border-radius:8px}

@media(max-width:1050px){.pre62-platform .top-nav,.pre62-platform .u-links{border-radius:8px!important}.pre62-platform .u-hero-grid,.pre62-platform .community-hero,.pre62-professional .tour-hero{grid-template-columns:1fr}.pre62-platform .u-hero-grid{gap:30px}.pre62-platform .navp-home-cta__content{grid-template-columns:140px minmax(220px,.8fr) minmax(260px,1.2fr)}}
@media(max-width:900px){.pre62-platform .navp-home-cta{grid-template-columns:1fr!important}.pre62-platform .navp-home-cta__content{grid-template-columns:1fr;gap:4px}.pre62-platform .navp-home-cta__action{justify-self:start}.pre62-professional .tour-step-nav{overflow-x:auto;justify-content:flex-start;padding-inline:.75rem}}
@media(max-width:620px){html{scroll-padding-top:70px}body.pre62-platform{font-size:15.5px}.pre62-platform .site-header,.pre62-platform .u-header{min-height:58px}.pre62-platform .brand img,.pre62-platform .u-brand img{max-height:34px}.pre62-platform .page-hero,.pre62-platform .hero{padding:2rem 1rem}.pre62-platform .page-hero h1,.pre62-platform .hero h1,.pre62-platform .u-hero h1{font-size:2.16rem;line-height:1.04}.pre62-platform.u-page .u-hero{padding:32px 0}.pre62-platform .u-hero-grid{gap:24px}.pre62-platform .u-start{padding:16px}.pre62-platform .u-start textarea{min-height:104px}.pre62-platform .u-trust{display:grid;gap:6px}.pre62-platform .navp-home-cta{padding:17px 16px!important}.pre62-platform .u-section{padding:34px 0}.pre62-platform .u-section-head{display:block}.pre62-platform .u-section-head>p{margin-top:8px}.pre62-platform .u-paths{grid-template-columns:1fr 1fr}.pre62-platform .u-card{padding:14px}.pre62-platform .u-card p{display:none}.pre62-platform .u-card h3{font-size:1rem}.pre62-platform .u-split{gap:10px}.pre62-platform .u-panel{padding:16px}.pre62-platform .u-prof{display:block;padding:20px 17px}.pre62-platform .u-prof .u-btn{margin-top:12px}.pre62-platform .pre60-directory-search{margin:-.65rem .75rem 0;padding:1rem}.pre62-platform .pre60-directory-search h2{font-size:1.35rem}.pre62-platform .light-section,.pre62-platform .pre60-all-practices{padding:1.8rem 1rem}.pre62-platform .tile-grid{grid-template-columns:1fr 1fr}.pre62-platform .tile span{display:none}.pre62-platform .community-hero{padding:2rem 1rem}.pre62-platform .community-hero h1{font-size:2.18rem}.pre62-platform .urgent-help-card{padding:1rem}.pre62-platform .community-needs-section{padding-block:1.8rem}.pre62-platform .u-footer-grid{grid-template-columns:1fr 1fr!important}.pre62-platform .u-footer-grid>div:first-child{grid-column:1/-1}.pre62-professional .tour-hero{padding:2rem 1rem}.pre62-professional .tour-hero-copy h1{font-size:2.22rem}.pre62-professional .tour-proof-grid{grid-template-columns:1fr}.pre62-professional .tour-mode-bar{margin:.7rem}.pre62-professional .tour-mode-actions>*{width:100%}.pre62-professional .tour-story{padding:.8rem}.pre62-professional .tour-step{grid-template-columns:34px minmax(0,1fr);gap:.65rem;padding:1rem .8rem}.pre62-professional .tour-step-number{width:32px;height:32px}.pre62-professional .tour-step-content h2{font-size:1.55rem}.pre62-professional .tour-final-actions>*{width:100%}}
@media(max-width:390px){.pre62-platform .u-paths,.pre62-platform .tile-grid{grid-template-columns:1fr}.pre62-platform .u-card p{display:block}.pre62-platform .u-footer-grid{grid-template-columns:1fr!important}.pre62-platform .u-footer-grid>div{grid-column:1!important}}
@media(prefers-reduced-motion:reduce){.pre62-platform *{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}
`;
  fs.writeFileSync(stylesPath, styles, 'utf8');
}

console.log(`PRE62 executive clarity applied to ${root}`);
