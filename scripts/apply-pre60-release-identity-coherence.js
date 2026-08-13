'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = process.argv[2] || '.runtime/smarter-justice-v1.7.98';
const serverPath = path.join(root, 'server.js');
const readinessPath = path.join(root, 'lib', 'serviceReadiness.js');
const homePath = path.join(root, 'public', 'index.html');
const homeScriptPath = path.join(root, 'public', 'home.js');
const liveChatScriptPath = path.join(root, 'public', 'live-chat.js');
const attorneyTourPath = path.join(root, 'public', 'attorney-partner-tour.html');
const practiceDirectoryPath = path.join(root, 'public', 'practice-areas.html');
const communityResourcesPath = path.join(root, 'public', 'community-resources.html');
const practiceDirectoryScriptPath = path.join(root, 'public', 'practice-directory-pre60.js');
const communityResourcesScriptPath = path.join(root, 'public', 'community-resources-pre60.js');
const stylesPath = path.join(root, 'public', 'styles.css');
const platformRelease = 'v2.0.0-pre60';
const platformMarker = 'SMARTER_JUSTICE_PRE60_RELEASE_IDENTITY_COHERENCE';

for (const required of [serverPath, readinessPath, homePath, homeScriptPath, liveChatScriptPath, attorneyTourPath, practiceDirectoryPath, communityResourcesPath, stylesPath, path.join(root, 'package.json')]) {
  if (!fs.existsSync(required)) throw new Error(`PRE60 missing runtime file: ${required}`);
}

const publicHeader = `<header class="site-header pre60-site-header"><a aria-label="Smarter Justice home" class="brand" href="/"><img alt="Smarter Justice" src="/logo.svg"></a><button aria-expanded="false" aria-label="Open menu" class="nav-toggle" data-nav-toggle>Menu</button><nav class="top-nav" data-nav aria-label="Main navigation"><a href="/practice-areas.html">Legal areas</a><a href="/community-resources.html">Community resources</a><a href="/professionals.html">Find a professional</a><a href="/free-tools.html">Free tools</a><a href="/attorney-partner-tour.html">For professionals</a><a class="mobile-only-nav" href="/es/">Español</a><a class="mobile-only-nav" href="/professional-login.html">Sign in</a></nav><a class="language-toggle compact-language" href="/es/" hreflang="es" lang="es">Español</a><a class="header-signin" href="/professional-login.html">Sign in</a></header>`;
const professionalHeader = `<header class="site-header pre60-site-header pre60-professional-header"><a aria-label="Smarter Justice home" class="brand" href="/"><img alt="Smarter Justice" src="/logo.svg"></a><button aria-expanded="false" aria-label="Open menu" class="nav-toggle" data-nav-toggle>Menu</button><nav class="top-nav" data-nav aria-label="Professional navigation"><a href="/attorney-partner-tour.html">For professionals</a><a href="/professional-growth.html">Professional workspace</a><a href="/professionals.html">Find profile</a><a href="/professional-membership.html">Membership</a><a href="/">Public site</a><a class="mobile-only-nav" href="/professional-login.html">Sign in</a></nav><a class="header-signin" href="/professional-login.html">Sign in</a></header>`;

function replaceSiteHeader(html, header) {
  if (!/<header class="[^"]*site-header[^"]*">[\s\S]*?<\/header>/i.test(html)) return html;
  return html.replace(/<header class="[^"]*site-header[^"]*">[\s\S]*?<\/header>/i, header);
}

function addBodyClass(html, className) {
  return html.replace(/<body(?: class="([^"]*)")?([^>]*)>/i, (_match, classes = '', tail = '') => {
    const next = [...new Set(`${classes} ${className}`.trim().split(/\s+/).filter(Boolean))].join(' ');
    return `<body class="${next}"${tail}>`;
  });
}

function addDeferredScript(html, source, marker) {
  if (html.includes(`src="${source}"`)) return html;
  if (!html.includes('</head>')) throw new Error(`PRE60 missing head seam for ${source}`);
  return html.replace('</head>', `<script defer src="${source}" data-pre60-marker="${marker}"></script>\n</head>`);
}

function addStyleBlock(html, css, marker) {
  if (html.includes(marker)) return html;
  if (!html.includes('</head>')) throw new Error(`PRE60 missing style seam for ${marker}`);
  return html.replace('</head>', `<style id="${marker}">\n${css}\n</style>\n</head>`);
}

let server = fs.readFileSync(serverPath, 'utf8');
if (!server.includes(platformMarker)) {
  const seam = "      deploymentControlRelease:'v2.0.0-pre58',\n      gitCommit:String(process.env.RENDER_GIT_COMMIT || ''),";
  if (!server.includes(seam)) throw new Error('PRE60 release-identity seam missing');
  server = server.replace(
    seam,
    `      deploymentControlRelease:'v2.0.0-pre58',\n      currentPlatformRelease:'${platformRelease}',\n      coreApplicationVersion:VERSION,\n      platformMarker:'${platformMarker}',\n      gitCommit:String(process.env.RENDER_GIT_COMMIT || ''),`
  );
  fs.writeFileSync(serverPath, server, 'utf8');
}

let readiness = fs.readFileSync(readinessPath, 'utf8');
if (!readiness.includes('const APPLICATION_VERSION = require(\'../package.json\').version;')) {
  const versionSeam = "const TARGET_RELEASE_VERSION = '1.7.75';";
  if (!readiness.includes(versionSeam)) throw new Error('PRE60 readiness version seam missing');
  readiness = readiness.replace(
    versionSeam,
    `${versionSeam}\nconst APPLICATION_VERSION = require('../package.json').version;`
  );

  const livenessSeam = `function liveness() {\n  return {\n    ok:true,\n    status:'alive',\n    app:'Smarter Justice',\n    version:TARGET_RELEASE_VERSION,`;
  if (!readiness.includes(livenessSeam)) throw new Error('PRE60 liveness seam missing');
  readiness = readiness.replace(
    livenessSeam,
    `function liveness() {\n  return {\n    ok:true,\n    status:'alive',\n    app:'Smarter Justice',\n    version:APPLICATION_VERSION,`
  );
  fs.writeFileSync(readinessPath, readiness, 'utf8');
}

let home = fs.readFileSync(homePath, 'utf8');
const duplicateProfessionalSection = /<section class="section soft" id="professional-platform">[\s\S]*?<\/section>/;
home = home.replace(duplicateProfessionalSection, '');
home = home.replace(/(<div class="u-more">[^<]*?)\s*→(<\/div>)/g, '$1$2');
if (!home.includes('SMARTER_JUSTICE_PRE60_PUBLIC_EXPERIENCE_REPAIR')) {
  const navigatorMatch = home.match(/<section class="navp-home-cta">[\s\S]*?<\/section>/);
  if (!navigatorMatch) throw new Error('PRE60 Navigator home CTA seam missing');
  const navigatorCta = navigatorMatch[0];
  home = home.replace(navigatorCta, '');
  const heroMatch = home.match(/<section class="u-hero">[\s\S]*?<\/section>/);
  if (!heroMatch) throw new Error('PRE60 public hero seam missing');
  home = home.replace(heroMatch[0], `${heroMatch[0]}${navigatorCta}`);
  const headlineCss = 'h1{font-size:clamp(42px,6vw,72px);';
  if (!home.includes(headlineCss)) throw new Error('PRE60 desktop headline CSS seam missing');
  home = home.replace(headlineCss, 'h1{font-size:clamp(40px,4.7vw,62px);');
  home = home.replace('<main>', '<main><!-- SMARTER_JUSTICE_PRE60_PUBLIC_EXPERIENCE_REPAIR -->');
}
fs.writeFileSync(homePath, home, 'utf8');

let liveChatScript = fs.readFileSync(liveChatScriptPath, 'utf8');
if (!liveChatScript.includes('SMARTER_JUSTICE_PRE60_HELP_FOOTER_COHERENCE')) {
  const footerSeam = "    const footer=document.querySelector('.site-footer');";
  if (!liveChatScript.includes(footerSeam)) throw new Error('PRE60 help footer seam missing');
  liveChatScript = liveChatScript.replace(
    footerSeam,
    "    // SMARTER_JUSTICE_PRE60_HELP_FOOTER_COHERENCE\n    const footer=document.querySelector('.site-footer, .u-footer');"
  );
  fs.writeFileSync(liveChatScriptPath, liveChatScript, 'utf8');
}

let attorneyTour = fs.readFileSync(attorneyTourPath, 'utf8');
if (!attorneyTour.includes('SMARTER_JUSTICE_PRE60_ATTORNEY_TOUR_COMPLETION')) {
  const redundantTail = /<section class="section soft"><div class="section-heading"><h2>Why Smarter Justice is different<\/h2>[\s\S]*?SMARTER_JUSTICE_PRE47_GROWTH_LINK[\s\S]*?<\/section>/;
  if (!redundantTail.test(attorneyTour)) throw new Error('PRE60 attorney tour redundant-tail seam missing');
  attorneyTour = attorneyTour.replace(redundantTail, '<!-- SMARTER_JUSTICE_PRE60_ATTORNEY_TOUR_COMPLETION -->');
  fs.writeFileSync(attorneyTourPath, attorneyTour, 'utf8');
}

// Apply one coherent navigation and typography seam across the core public and
// professional journeys. Content and route capabilities remain unchanged.
const publicShellPages = [
  'practice-areas.html', 'community-resources.html', 'professionals.html',
  'free-tools.html', 'navigator.html', 'current-availability.html',
  'how-it-works.html', 'pricing.html', 'contact.html', 'faq.html',
  'privacy.html', 'privacy-request.html', 'terms.html', 'disclaimer.html',
  'security.html', 'our-story.html', 'help-options.html',
  'bankruptcy-debt.html', 'business-formation-compliance.html',
  'business-law.html', 'civil-rights.html', 'consumer-protection.html',
  'disability-benefits.html', 'disability.html', 'divorce-family-law.html',
  'divorce.html', 'domestic-violence.html', 'domestic-violence-aid.html',
  'elder-law.html', 'employment-wage-claims.html', 'employment.html',
  'estate-benefits-records.html', 'estate-planning.html', 'estate.html',
  'family-law.html', 'immigration.html', 'injury.html',
  'landlord-tenant-housing.html', 'medical-malpractice.html',
  'nonprofit-formation-compliance.html', 'personal-injury.html',
  'property-debt.html', 'public-benefits.html', 'real-estate.html',
  'rights-defense.html', 'tax.html', 'taxes.html', 'vehicle-accidents.html',
  'veterans.html', 'whole-situation.html', 'work-business.html',
  'communication-evidence-log.html', 'date-deadline-organizer.html',
  'document-tools.html', 'form-drafts.html', 'journey-handoff-planner.html',
  'preparation-quality-check.html', 'review-delivery.html', 'upload-notice.html'
];
const professionalShellPages = [
  'attorney-partner-tour.html', 'attorney-call-tour.html',
  'professional-growth.html', 'professional-membership.html',
  'professional-signup.html', 'professional-login.html',
  'attorney-launch.html', 'professional-dashboard.html',
  'attorney-tour-follow-up.html', 'firm-profile.html',
  'growth-operations-compliance.html', 'professional-membership-terms.html',
  'professional-network.html', 'professional-profile.html'
];
for (const name of publicShellPages) {
  const filePath = path.join(root, 'public', name);
  if (!fs.existsSync(filePath)) continue;
  let document = fs.readFileSync(filePath, 'utf8');
  document = replaceSiteHeader(document, publicHeader);
  document = addBodyClass(document, 'pre60-platform');
  fs.writeFileSync(filePath, document, 'utf8');
}
for (const name of professionalShellPages) {
  const filePath = path.join(root, 'public', name);
  if (!fs.existsSync(filePath)) continue;
  let document = fs.readFileSync(filePath, 'utf8');
  document = replaceSiteHeader(document, professionalHeader);
  document = addBodyClass(document, 'pre60-platform pre60-professional');
  fs.writeFileSync(filePath, document, 'utf8');
}
home = addBodyClass(home, 'pre60-platform pre60-home');
if (!home.includes('SMARTER_JUSTICE_PRE60_SINGLE_MOBILE_NAV')) {
  home = home
    .replace(/<button class="u-menu-toggle"[\s\S]*?<\/button><nav class="u-mobile-menu"[\s\S]*?<\/nav>/, '<!-- SMARTER_JUSTICE_PRE60_SINGLE_MOBILE_NAV -->')
    .replace(/<script id="universal-navigation-polish-v1-script">[\s\S]*?<\/script>/, '');
}
home = addStyleBlock(home, `
/* SMARTER_JUSTICE_PRE60_HOME_VISUAL_SYSTEM */
:root{--u-ink:#102f46;--u-blue:#0a5c65;--u-blue2:#07464d;--u-soft:#f3f7f7;--u-line:#d7e2e3;--u-muted:#51656f;--u-green:#08765f;--u-warm:#fff8ed}
.u-page{background:#fbfcfc;color:var(--u-ink)}
.u-header{background:rgba(255,255,255,.98);backdrop-filter:blur(10px);box-shadow:0 1px 12px rgba(16,47,70,.05)}
.u-nav{height:68px;gap:18px}.u-links{gap:8px}.u-links a{padding:9px 10px;border-radius:8px}.u-links a:hover{background:#edf4f4;text-decoration:none}
.u-hero{padding:58px 0 52px;background:linear-gradient(135deg,#f1f7f6 0,#fbfcfc 66%,#fff8ed 100%)}
.u-hero-grid{gap:34px}.u-hero h1{font-size:clamp(2.65rem,4.6vw,3.85rem);line-height:1.02;letter-spacing:-.042em;margin:10px 0 18px}.u-lead{font-size:18px;line-height:1.62}
.u-start{border-radius:14px;box-shadow:0 14px 38px rgba(16,47,70,.09);padding:22px}.u-start h2{font-size:24px}.u-start textarea{min-height:132px}
.navp-home-cta{display:grid;grid-template-columns:minmax(180px,.34fr) minmax(0,1fr) auto;align-items:center;gap:22px;border:0!important;border-bottom:1px solid var(--u-line)!important;border-radius:0!important;background:#102f46!important;color:#fff;padding:22px max(24px,calc((100% - 1180px)/2))!important;margin:0!important;max-width:none!important}.navp-home-cta .eyebrow{color:#80d7cf;margin:0}.navp-home-cta h2{font-size:25px;margin:0!important}.navp-home-cta p{color:#dce8eb;margin:0}.navp-home-cta a{color:#fff;white-space:nowrap}
.u-section{padding:52px 0}.u-section h2{font-size:clamp(1.9rem,3vw,2.5rem)}.u-section-head{margin-bottom:22px}.u-paths{gap:14px}.u-card{min-height:0;border-radius:12px;padding:20px}.u-card h3{margin:12px 0 7px}.u-card .u-more{margin-top:12px}.u-panel{border-radius:12px;padding:24px}.u-prof{border-radius:14px;padding:30px}
.u-btn{border-radius:8px}.u-btn-primary{background:#0a5c65;border-color:#0a5c65}.u-btn-primary:hover{background:#07464d}.u-footer{background:#fff}
@media(max-width:900px){.navp-home-cta{grid-template-columns:1fr;gap:8px;padding:22px 18px!important}.u-hero{padding-top:42px}.u-nav{height:64px}}
@media(max-width:620px){.u-hero h1{font-size:2.45rem}.u-section{padding:42px 0}.u-start{padding:18px}.u-trust{display:grid;gap:7px}.u-form-meta{display:grid}.navp-home-cta h2{font-size:22px}}
`, 'SMARTER_JUSTICE_PRE60_HOME_VISUAL_SYSTEM');
fs.writeFileSync(homePath, home, 'utf8');

let practiceDirectory = fs.readFileSync(practiceDirectoryPath, 'utf8');
if (!practiceDirectory.includes('SMARTER_JUSTICE_PRE60_SEARCH_FIRST_DIRECTORY')) {
  const filter = practiceDirectory.match(/<div class="filter-row">[\s\S]*?<\/div>/)?.[0];
  if (!filter) throw new Error('PRE60 practice directory filter seam missing');
  practiceDirectory = practiceDirectory.replace(filter, '');
  practiceDirectory = practiceDirectory
    .replace('Starting help across common legal, tax, benefits, government-form, and business problems.', 'Find the legal area that fits—or describe what happened.')
    .replace('Every area below is a safe starting place for questions, documents, state information, organized files, and guidance about review. Availability differs by specialty, and Smarter Justice does not promise that every official form is completed automatically.', 'Search all 69 legal areas, browse a popular starting point, or begin with your own words when you are not sure which category fits.')
    .replace('<h2>Focused starting pages</h2>', '<h2>Popular focused guides</h2>')
    .replace('These focused pages make the most common areas easier to understand before starting. All 69 areas remain available below.', 'Use a common path for a faster start. The complete directory remains searchable below.')
    .replace(
      '</section><section class="section narrow light-section">',
      `</section><section class="pre60-directory-search" aria-labelledby="pre60-directory-search-title"><div><p class="eyebrow">Search first</p><h2 id="pre60-directory-search-title">What kind of help are you looking for?</h2><p>Search by legal area or topic. All results stay on this page.</p></div>${filter}<div class="pre60-directory-actions"><a class="secondary link-btn" href="/#public-start">Not sure? Describe what happened</a><span id="practiceDirectoryStatus" role="status" aria-live="polite"></span></div><!-- SMARTER_JUSTICE_PRE60_SEARCH_FIRST_DIRECTORY --></section><section class="section narrow light-section">`
    )
    .replace('<section class="section"><div class="practice-grid"', '<section class="section pre60-all-practices"><div class="section-heading"><p class="eyebrow">Complete directory</p><h2>All 69 legal areas</h2><p>Open a card for common topics, or search above to narrow the list.</p></div><div class="practice-grid"');

  practiceDirectory = practiceDirectory.replace(
    /<h3>Common topics<\/h3><ul>([\s\S]*?)<\/ul>/g,
    '<details class="practice-topics"><summary>Common topics</summary><h3 class="visually-hidden">Common topics</h3><ul>$1</ul></details>'
  );
  const focusedGuideGrid = practiceDirectory.match(/<div class="tile-grid">([\s\S]*?)<\/div><\/section>/);
  if (!focusedGuideGrid) throw new Error('PRE60 focused-guide grid seam missing');
  const focusedGuides = [...focusedGuideGrid[1].matchAll(/<a class="tile"[\s\S]*?<\/a>/g)].map((match) => match[0]);
  if (focusedGuides.length < 8) throw new Error('PRE60 focused-guide count below required minimum');
  practiceDirectory = practiceDirectory.replace(
    focusedGuideGrid[0],
    `<div class="tile-grid">${focusedGuides.slice(0, 8).join('')}</div></section>`
  );
  let practiceIndex = 0;
  practiceDirectory = practiceDirectory.replace(/<article class="practice-card"/g, () => {
    const hidden = practiceIndex++ >= 12 ? ' pre60-initial-hidden' : '';
    return `<article class="practice-card${hidden}"`;
  });
  const directoryEnd = '</div></section></main>';
  if (!practiceDirectory.includes(directoryEnd)) throw new Error('PRE60 practice directory completion seam missing');
  practiceDirectory = practiceDirectory.replace(
    directoryEnd,
    '</div><div class="pre60-show-row"><button class="secondary" id="practiceDirectoryToggle" type="button">Show all 69 legal areas</button></div></section></main>'
  );
  practiceDirectory = addDeferredScript(
    practiceDirectory,
    '/practice-directory-pre60.js',
    'SMARTER_JUSTICE_PRE60_PRACTICE_DIRECTORY_PROGRESSIVE_DISCLOSURE'
  );
  fs.writeFileSync(practiceDirectoryPath, practiceDirectory, 'utf8');
}
practiceDirectory = addDeferredScript(
  practiceDirectory,
  '/practice-directory-pre60.js',
  'SMARTER_JUSTICE_PRE60_PRACTICE_DIRECTORY_PROGRESSIVE_DISCLOSURE'
);
fs.writeFileSync(practiceDirectoryPath, practiceDirectory, 'utf8');

fs.writeFileSync(practiceDirectoryScriptPath, `'use strict';
// SMARTER_JUSTICE_PRE60_PRACTICE_DIRECTORY_PROGRESSIVE_DISCLOSURE
document.addEventListener('DOMContentLoaded',()=>{
  const input=document.getElementById('practiceFilter');
  const cards=[...document.querySelectorAll('.practice-card')];
  const toggle=document.getElementById('practiceDirectoryToggle');
  const status=document.getElementById('practiceDirectoryStatus');
  let expanded=false;
  const render=()=>{
    const query=String(input?.value||'').trim().toLowerCase();
    const target=decodeURIComponent(String(location.hash||'').replace(/^#/,''));
    let matches=0;
    cards.forEach((card,index)=>{
      const match=!query||card.textContent.toLowerCase().includes(query);
      if(match)matches+=1;
      const visible=match&&(Boolean(query)||expanded||index<12||card.id===target);
      card.hidden=!visible;
      card.classList.toggle('pre60-initial-hidden',!visible);
    });
    if(status)status.textContent=query?matches+' matching legal '+(matches===1?'area':'areas'):'Showing '+(expanded?cards.length:Math.min(12,cards.length))+' of '+cards.length+' legal areas';
    if(toggle){
      toggle.hidden=Boolean(query);
      toggle.textContent=expanded?'Show popular areas only':'Show all '+cards.length+' legal areas';
    }
  };
  input?.addEventListener('input',render);
  toggle?.addEventListener('click',()=>{expanded=!expanded;render();if(!expanded)document.querySelector('.pre60-all-practices')?.scrollIntoView({behavior:'smooth',block:'start'});});
  render();
});
`, 'utf8');

let communityResources = fs.readFileSync(communityResourcesPath, 'utf8');
if (!communityResources.includes('SMARTER_JUSTICE_PRE60_COMMUNITY_PROGRESSIVE_DISCLOSURE')) {
  communityResources = communityResources
    .replace('Find a practical next step without giving us private facts.', 'Find trusted help for what you need right now.')
    .replace('One hub for practical needs', 'Browse by need')
    .replace('Choose the kind of help you are looking for.', 'Start with a category.')
    .replace(
      '<div aria-live="polite" class="community-focus-status" hidden="" id="communityFocusStatus" role="status"></div><div class="community-needs-grid">',
      '<div aria-live="polite" class="community-focus-status" hidden id="communityFocusStatus" role="status"></div><div class="pre60-community-search"><label for="communityResourceFilter">Search community resources</label><input id="communityResourceFilter" type="search" placeholder="Housing, food, safety, benefits, recovery…" autocomplete="off"><span id="communityResourceStatus" role="status" aria-live="polite"></span></div><div class="community-needs-grid"><!-- SMARTER_JUSTICE_PRE60_COMMUNITY_PROGRESSIVE_DISCLOSURE -->'
    );

  let communityIndex = 0;
  communityResources = communityResources.replace(/<article class="community-need-card/g, () => {
    const hidden = communityIndex++ >= 9 ? ' pre60-initial-hidden' : '';
    return `<article class="community-need-card${hidden}`;
  });
  const needsEnd = '</div></section>\n<section class="section soft" id="private-plan">';
  if (!communityResources.includes(needsEnd)) throw new Error('PRE60 community categories seam missing');
  communityResources = communityResources.replace(
    needsEnd,
    '</div><div class="pre60-show-row"><button class="secondary" id="communityResourceToggle" type="button">Show all community categories</button></div></section>\n<section class="section soft pre60-collapsible-section" id="private-plan"><details><summary><span><strong>Build a private next-step list</strong><small>Optional · stays on this device</small></span></summary><div class="pre60-details-body">'
  );
  const privateEnd = '</aside></div></section>\n<section class="section" id="official-resources">';
  if (!communityResources.includes(privateEnd)) throw new Error('PRE60 community private-plan seam missing');
  communityResources = communityResources.replace(
    privateEnd,
    '</aside></div></div></details></section>\n<section class="section pre60-collapsible-section" id="official-resources"><details><summary><span><strong>Official and primary resource directories</strong><small>Verified links for direct provider access</small></span></summary><div class="pre60-details-body">'
  );
  const officialEnd = '</div></section>\n<section class="section community-partner-value">';
  if (!communityResources.includes(officialEnd)) throw new Error('PRE60 community official-directory seam missing');
  communityResources = communityResources.replace(
    officialEnd,
    '</div></div></details></section>\n<section class="section community-partner-value pre60-community-partner">'
  );
  const redundantCommunityTail = /<section class="section community-partner-value pre60-community-partner">[\s\S]*?<\/main>/;
  if (!redundantCommunityTail.test(communityResources)) throw new Error('PRE60 community redundant-tail seam missing');
  communityResources = communityResources.replace(
    redundantCommunityTail,
    '<section class="section pre60-community-close"><div><p class="eyebrow">More ways to continue</p><h2>Use a private tool, browse legal areas, or find a professional.</h2><p>Choose the next route that fits. No private story is required to browse.</p></div><div class="button-row"><a class="primary link-btn" href="/community-resource-sheet.html">Build a private resource sheet</a><a class="secondary link-btn" href="/practice-areas.html">Browse legal areas</a><a class="secondary link-btn" href="/professionals.html">Find a professional</a></div></section></main>'
  );
  communityResources = addDeferredScript(
    communityResources,
    '/community-resources-pre60.js',
    'SMARTER_JUSTICE_PRE60_COMMUNITY_PROGRESSIVE_DISCLOSURE'
  );
  fs.writeFileSync(communityResourcesPath, communityResources, 'utf8');
}
communityResources = addDeferredScript(
  communityResources,
  '/community-resources-pre60.js',
  'SMARTER_JUSTICE_PRE60_COMMUNITY_DIRECTORY_SCRIPT_BINDING'
);
fs.writeFileSync(communityResourcesPath, communityResources, 'utf8');

fs.writeFileSync(communityResourcesScriptPath, `'use strict';
// SMARTER_JUSTICE_PRE60_COMMUNITY_PROGRESSIVE_DISCLOSURE
document.addEventListener('DOMContentLoaded',()=>{
  const input=document.getElementById('communityResourceFilter');
  const cards=[...document.querySelectorAll('.community-need-card')];
  const toggle=document.getElementById('communityResourceToggle');
  const status=document.getElementById('communityResourceStatus');
  let expanded=false;
  const render=()=>{
    const query=String(input?.value||'').trim().toLowerCase();
    let matches=0;
    cards.forEach((card,index)=>{
      const match=!query||card.textContent.toLowerCase().includes(query);
      if(match)matches+=1;
      const visible=match&&(Boolean(query)||expanded||index<9||card.classList.contains('is-focused'));
      card.hidden=!visible;
      card.classList.toggle('pre60-initial-hidden',!visible);
    });
    if(status)status.textContent=query?matches+' matching '+(matches===1?'category':'categories'):'Showing '+(expanded?cards.length:Math.min(9,cards.length))+' of '+cards.length+' categories';
    if(toggle){toggle.hidden=Boolean(query);toggle.textContent=expanded?'Show fewer categories':'Show all '+cards.length+' categories';}
  };
  input?.addEventListener('input',render);
  toggle?.addEventListener('click',()=>{expanded=!expanded;render();});
  render();
});
`, 'utf8');

let styles = fs.readFileSync(stylesPath, 'utf8');
if (!styles.includes('SMARTER_JUSTICE_PRE60_ATTORNEY_TOUR_LAYOUT')) {
  styles += `\n/* SMARTER_JUSTICE_PRE60_ATTORNEY_TOUR_LAYOUT */\n.cards.three{grid-template-columns:repeat(3,minmax(0,1fr))}\n.attorney-partner-tour-page .tour-hero h1{font-size:clamp(2.2rem,4vw,3.5rem)}\n@media(max-width:720px){.cards.three{grid-template-columns:1fr}}\n`;
}
if (!styles.includes('SMARTER_JUSTICE_PRE60_COHESIVE_VISUAL_SYSTEM')) {
  styles += `

/* SMARTER_JUSTICE_PRE60_COHESIVE_VISUAL_SYSTEM */
:root{
  --navy:#102f46;
  --teal:#0a6865;
  --mint:#edf7f5;
  --ink:#182b36;
  --muted:#566a74;
  --line:#d6e1e3;
  --paper:#fff;
  --bg:#f7f9f9;
  --surface-muted:#f1f5f5;
  --link:#075f72;
  --shadow:0 8px 26px rgba(16,47,70,.065);
}
body.pre60-platform{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fbfcfc;color:var(--ink);line-height:1.62}
.pre60-platform .pre60-site-header{min-height:68px;padding:.58rem max(1rem,calc((100vw - 1240px)/2));gap:.6rem;background:rgba(255,255,255,.98);backdrop-filter:blur(10px);box-shadow:0 1px 12px rgba(16,47,70,.05)}
.pre60-platform .pre60-site-header .brand img{height:38px;max-width:210px}.pre60-platform .pre60-site-header .top-nav{gap:.12rem}.pre60-platform .pre60-site-header .top-nav a{border-radius:8px;padding:.56rem .62rem;color:#294451;font-weight:720}.pre60-platform .pre60-site-header .top-nav a:hover,.pre60-platform .pre60-site-header .top-nav a[aria-current="page"]{background:#edf4f4;color:var(--navy)}
.pre60-platform .header-signin{display:inline-flex;align-items:center;justify-content:center;border:1px solid #aebec4;border-radius:8px;min-height:42px;padding:.55rem .78rem;color:var(--navy);text-decoration:none;font-weight:800;white-space:nowrap}.pre60-platform .mobile-only-nav{display:none}
.pre60-platform .hero,.pre60-platform .page-hero,.pre60-platform .section{padding:clamp(2.35rem,4vw,3.8rem) max(1rem,calc((100vw - 1240px)/2))}.pre60-platform .page-hero,.pre60-platform .hero{background:linear-gradient(135deg,#f2f7f6 0,#fbfcfc 67%,#fff9ef 100%)!important;border-bottom:1px solid var(--line)}
.pre60-platform .page-hero h1,.pre60-platform .hero h1,.pre60-platform .professional-auth-card h1{font-size:clamp(2.4rem,4vw,3.75rem);line-height:1.05;letter-spacing:-.038em;max-width:940px;margin:.4rem 0 1rem}.pre60-platform .lead{max-width:800px;font-size:clamp(1.04rem,1.5vw,1.18rem);line-height:1.66}
.pre60-platform h2,.pre60-platform .section-heading h2{font-size:clamp(1.65rem,2.7vw,2.35rem);line-height:1.15;letter-spacing:-.022em}.pre60-platform h3{line-height:1.27}.pre60-platform .eyebrow{letter-spacing:.11em}.pre60-platform .section-heading{max-width:1040px;margin-bottom:1.45rem}
.pre60-platform .card,.pre60-platform .mini-card,.pre60-platform .tile,.pre60-platform .practice-card,.pre60-platform .question-card,.pre60-platform .urgent-help-card{border-radius:13px;border-color:var(--line);box-shadow:var(--shadow)}.pre60-platform .primary,.pre60-platform .secondary,.pre60-platform .link-btn,.pre60-platform .button-link{border-radius:8px;min-height:44px;padding:.74rem 1rem}.pre60-platform .primary{background:var(--navy)}.pre60-platform .primary:hover{background:#09263a}.pre60-platform .secondary{border-color:#aebdc3}.pre60-platform input,.pre60-platform select,.pre60-platform textarea{border-radius:8px!important}
.pre60-platform .site-footer{padding:2.2rem max(1rem,calc((100vw - 1240px)/2));background:#fff}.pre60-platform .live-chat-fallback{border-radius:9px;background:var(--teal)}
.pre60-professional .page-hero,.pre60-professional .tour-hero{background:linear-gradient(135deg,#eef5f7 0,#fff 68%,#f6f2e9 100%)!important}.pre60-professional .tour-hero{max-width:none;padding:clamp(2.6rem,5vw,4.6rem) max(1rem,calc((100vw - 1240px)/2));gap:clamp(1.5rem,3vw,3rem)}.pre60-professional .tour-hero-copy h1{font-size:clamp(2.5rem,4.4vw,3.8rem);line-height:1.03;letter-spacing:-.04em}.pre60-professional .tour-step{border-radius:14px;box-shadow:var(--shadow)}

/* Search-first legal directory */
.pre60-directory-search{display:grid;grid-template-columns:minmax(260px,.78fr) minmax(320px,1.22fr);gap:1rem 2rem;align-items:end;padding:2rem max(1rem,calc((100vw - 1240px)/2));background:#102f46;color:#fff}.pre60-directory-search h2{color:#fff;margin:.25rem 0 .45rem}.pre60-directory-search p{color:#dce8eb;margin:0}.pre60-directory-search .eyebrow{color:#79d8cf}.pre60-directory-search .filter-row{max-width:none;margin:0}.pre60-directory-search label{display:block;color:#fff;font-weight:850;margin-bottom:.4rem}.pre60-directory-search input{min-height:54px;background:#fff;border:0!important;font-size:1.04rem}.pre60-directory-actions{grid-column:2;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}.pre60-directory-actions .secondary{color:#fff;background:transparent;border-color:#8ca6ae}.pre60-directory-actions span{color:#dce8eb;font-weight:750}
.pre60-platform .light-section{max-width:none;margin:0;background:#f3f6f6}.pre60-platform .light-section>h2,.pre60-platform .light-section>p,.pre60-platform .light-section>.tile-grid{max-width:1240px;margin-left:auto;margin-right:auto}.pre60-platform .light-section>.tile-grid{margin-top:1.25rem}.pre60-platform .tile-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:.8rem}.pre60-platform .tile{padding:1rem;min-height:0;box-shadow:none}.pre60-platform .tile strong{font-size:.98rem;line-height:1.35}.pre60-platform .tile span{font-size:.88rem;line-height:1.45}.pre60-all-practices{background:#fbfcfc}.pre60-all-practices>.section-heading,.pre60-all-practices>.practice-grid,.pre60-all-practices>.pre60-show-row{max-width:1240px;margin-left:auto;margin-right:auto}.pre60-platform .practice-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:.9rem}.pre60-platform .practice-card{padding:1.1rem;display:flex;flex-direction:column;min-height:0}.pre60-platform .practice-card h2{font-size:1.35rem;line-height:1.18;margin:0 0 .45rem}.pre60-platform .practice-card>p:not(.badge){font-size:.92rem;line-height:1.48;color:var(--muted);margin:.25rem 0 .65rem}.pre60-platform .practice-card .badge{align-self:flex-start;margin:.15rem 0 .75rem;border-radius:6px;font-size:.78rem}.pre60-platform .practice-topics{border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin:.1rem 0 .8rem}.pre60-platform .practice-topics summary{cursor:pointer;padding:.66rem 0;color:var(--navy);font-weight:850}.pre60-platform .practice-topics summary::after{content:'+';float:right}.pre60-platform .practice-topics[open] summary::after{content:'–'}.pre60-platform .practice-topics ul{columns:1;padding-left:1.1rem;margin:.25rem 0 .8rem}.pre60-platform .practice-topics li{font-size:.86rem;line-height:1.38}.pre60-platform .practice-card>.link-btn{margin-top:auto;align-self:flex-start}.pre60-show-row{display:flex;justify-content:center;margin-top:1.4rem}.pre60-initial-hidden[hidden]{display:none!important}.visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}

/* Progressive community-resource directory */
.pre60-platform .community-hero{padding:clamp(2.5rem,4.8vw,4.5rem) max(1rem,calc((100vw - 1240px)/2));grid-template-columns:minmax(0,1.1fr) minmax(300px,.62fr);gap:2rem;background:linear-gradient(135deg,#eef7f5 0,#fbfcfc 70%,#fff8ed 100%)}.pre60-platform .community-hero h1{font-size:clamp(2.6rem,4.6vw,4rem);line-height:1.03;letter-spacing:-.04em}.pre60-platform .urgent-help-card{border-top:4px solid var(--teal);padding:1.35rem}.pre60-community-search{max-width:760px;margin:0 auto 1.2rem}.pre60-community-search label{display:block;font-weight:850;color:var(--navy);margin-bottom:.4rem}.pre60-community-search input{width:100%;min-height:52px;padding:.85rem 1rem;border:1px solid #adbec4}.pre60-community-search span{display:block;margin-top:.45rem;color:var(--muted);font-size:.9rem}.pre60-platform .community-needs-section{background:#f4f7f7}.pre60-platform .community-needs-grid{max-width:1240px;margin:0 auto;grid-template-columns:repeat(3,minmax(0,1fr));gap:.9rem}.pre60-platform .community-need-card{padding:1.05rem;margin:0;min-height:0;border-radius:12px;box-shadow:none}.pre60-platform .community-need-card p{font-size:.93rem;line-height:1.5}.pre60-collapsible-section{background:#fff!important;padding-top:1.25rem!important;padding-bottom:1.25rem!important}.pre60-collapsible-section>details{max-width:1240px;margin:auto;border:1px solid var(--line);border-radius:13px;background:#fff;box-shadow:var(--shadow)}.pre60-collapsible-section>details>summary{cursor:pointer;list-style:none;padding:1.15rem 1.25rem;color:var(--navy)}.pre60-collapsible-section>details>summary::-webkit-details-marker{display:none}.pre60-collapsible-section>details>summary>span{display:flex;justify-content:space-between;gap:1rem}.pre60-collapsible-section>details>summary strong{font-size:1.1rem}.pre60-collapsible-section>details>summary small{color:var(--muted);font-weight:650}.pre60-collapsible-section>details>summary::after{content:'+';float:right;margin-top:-1.6rem;font-size:1.35rem}.pre60-collapsible-section>details[open]>summary::after{content:'–'}.pre60-details-body{border-top:1px solid var(--line);padding:1.25rem}.pre60-community-close{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1.5rem;align-items:center;background:#102f46;color:#fff}.pre60-community-close h2{color:#fff;margin:.3rem 0}.pre60-community-close p{color:#dce8eb;margin:0}.pre60-community-close .eyebrow{color:#79d8cf}.pre60-community-close .button-row{justify-content:flex-end}.pre60-community-close .secondary{color:#fff;background:transparent;border-color:#8ca6ae}

@media(max-width:1100px){.pre60-platform .practice-grid,.pre60-platform .tile-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pre60-platform .pre60-site-header .top-nav{display:none}.pre60-platform .pre60-site-header .nav-toggle{display:inline-flex;margin-left:auto}.pre60-platform .compact-language{margin-left:0}}
@media(max-width:900px){.pre60-directory-search{grid-template-columns:1fr;align-items:stretch}.pre60-directory-actions{grid-column:1}.pre60-platform .community-hero,.pre60-community-close{grid-template-columns:1fr}.pre60-platform .community-needs-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pre60-platform .practice-grid,.pre60-platform .tile-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.pre60-platform .hero,.pre60-platform .page-hero,.pre60-platform .section{padding:2.1rem 1rem}.pre60-platform .page-hero h1,.pre60-platform .hero h1{font-size:2.4rem}.pre60-directory-search{padding:1.5rem 1rem}.pre60-directory-actions{display:grid}.pre60-directory-actions>*{width:100%}.pre60-platform .practice-grid,.pre60-platform .tile-grid,.pre60-platform .community-needs-grid{grid-template-columns:1fr}.pre60-platform .practice-card{padding:1rem}.pre60-platform .community-hero{padding:2.2rem 1rem}.pre60-platform .community-hero h1{font-size:2.45rem}.pre60-collapsible-section>details>summary>span{display:grid;padding-right:1.5rem}.pre60-details-body{padding:1rem}.pre60-community-close .button-row{display:grid}.pre60-community-close .button-row>*{width:100%}.pre60-platform .header-signin,.pre60-platform .compact-language{display:none}.pre60-platform .mobile-only-nav{display:block}}
@media(prefers-reduced-motion:reduce){.pre60-platform *{scroll-behavior:auto!important;transition:none!important}}
`;
}
fs.writeFileSync(stylesPath, styles, 'utf8');

let homeScript = fs.readFileSync(homeScriptPath, 'utf8');
if (!homeScript.includes('SMARTER_JUSTICE_PRE60_SPECIALTY_START_COHERENCE')) {
  const scriptSeam = "  recordLaunchEvent('landing-view');";
  if (!homeScript.includes(scriptSeam)) throw new Error('PRE60 specialty-start script seam missing');
  const specialtyScript = `${scriptSeam}\n\n  // SMARTER_JUSTICE_PRE60_SPECIALTY_START_COHERENCE\n  const requestedPractice=String(launchQuery.get('practice')||'').trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').slice(0,80);\n  const practiceLabels={copyrights:'Copyright & copyright law',trademarks:'Trademark law',patents:'Patent law','intellectual-property':'Intellectual property','divorce-family-law':'Divorce & family law','personal-injury':'Personal injury','medical-malpractice':'Medical malpractice','real-estate':'Real estate law',immigration:'Immigration',taxes:'Tax matters'};\n  function personalizePracticeStart(){\n    if(!requestedPractice)return;\n    const label=practiceLabels[requestedPractice]||friendly(requestedPractice);\n    const hero=document.querySelector('.u-hero');\n    const form=document.getElementById('storyRouteForm');\n    if(!hero||!form)return;\n    const kicker=hero.querySelector('.u-kicker');\n    const heading=hero.querySelector('h1');\n    const lead=hero.querySelector('.u-lead');\n    const startHeading=form.closest('.u-start')?.querySelector('h2');\n    const fieldLabel=form.querySelector('label[for="storyRouteQuestion"]');\n    const textarea=document.getElementById('storyRouteQuestion');\n    const help=document.getElementById('storyRouteHelp');\n    if(kicker)kicker.textContent='Selected legal area';\n    if(heading)heading.textContent=\`Start with \${label}. We’ll help you organize the right next step.\`;\n    if(lead)lead.textContent=\`You selected \${label}. Describe what happened in your own words; Smarter Justice will use that context to suggest a focused starting direction and when professional review may be useful.\`;\n    if(startHeading)startHeading.textContent=\`Tell us what happened with \${label}\`;\n    if(fieldLabel)fieldLabel.textContent=\`Describe the \${label} situation\`;\n    if(textarea)textarea.placeholder=\`Example: Describe the work, notice, registration, agreement, use, deadline, or dispute connected to \${label}.\`;\n    if(help)help.textContent=\`Selected area: \${label}. Your description is used only to suggest a starting direction.\`;\n    const genericNavigator=document.querySelector('.navp-home-cta');\n    if(genericNavigator)genericNavigator.hidden=true;\n    document.title=\`\${label} Starting Help | Smarter Justice\`;\n  }\n  personalizePracticeStart();`;
  homeScript = homeScript.replace(scriptSeam, specialtyScript);
  fs.writeFileSync(homeScriptPath, homeScript, 'utf8');
}

console.log('PRE60_RELEASE_IDENTITY_COHERENCE_APPLIED');
