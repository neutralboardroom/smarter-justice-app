'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.env.RUNTIME || '.runtime/smarter-justice-v1.7.98');
const failures = [];
const read = (...parts) => {
  const filePath = path.join(root, ...parts);
  if (!fs.existsSync(filePath)) {
    failures.push(`MISSING:${parts.join('/')}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
};
const walkHtml = (directory) => fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
  const resolved = path.join(directory, entry.name);
  if (entry.isDirectory()) return walkHtml(resolved);
  return entry.isFile() && entry.name.endsWith('.html') ? [resolved] : [];
});

const server = read('server.js');
const styles = read('public', 'styles.css');
const home = read('public', 'index.html');
const practices = read('public', 'practice-areas.html');
const community = read('public', 'community-resources.html');
const tour = read('public', 'attorney-partner-tour.html');
const tourScript = read('public', 'attorney-partner-tour.js');
const practiceScript = read('public', 'practice-directory-pre60.js');
const communityScript = read('public', 'community-resources-pre60.js');
const publicRoot = path.join(root, 'public');
const allPublicHtml = walkHtml(publicRoot).map((filePath) => [path.relative(publicRoot, filePath), fs.readFileSync(filePath, 'utf8')]);

for (const marker of [
  "currentPlatformRelease:'v2.0.0-pre62'",
  "coreApplicationVersion:VERSION",
  "platformMarker:'SMARTER_JUSTICE_PRE62_EXECUTIVE_CLARITY'",
]) if (!server.includes(marker)) failures.push(`SERVER_MARKER_MISSING:${marker}`);

for (const marker of [
  'SMARTER_JUSTICE_PRE62_EXECUTIVE_CLARITY',
  '.pre62-platform .practice-card',
  '.pre62-platform .community-hero',
  '.pre62-professional .tour-step',
  '@media(max-width:620px)',
]) if (!styles.includes(marker)) failures.push(`DESIGN_RULE_MISSING:${marker}`);

if (!home.includes('SMARTER_JUSTICE_PRE62_HOME_FUNNEL')) failures.push('HOME_FUNNEL_MARKER_MISSING');
if (!home.includes('Start with what happened. Get a clear next step.')) failures.push('HOME_PRIMARY_PROMISE_MISSING');
if (!home.includes('Choose a common path.')) failures.push('HOME_COMMON_PATHS_MISSING');
if (home.indexOf('class="u-hero"') > home.indexOf('SMARTER_JUSTICE_PRE62_HOME_FUNNEL')) failures.push('HOME_FUNNEL_ORDER_INVALID');
if ((home.match(/class="u-card"/g) || []).length !== 6) failures.push('HOME_STARTING_PATH_COUNT_CHANGED');
if ((home.match(/class="u-prof"/g) || []).length !== 1) failures.push('HOME_PROFESSIONAL_CTA_COUNT_INVALID');
if (/[⚖🩹🏛💼🏠📄]/u.test(home)) failures.push('PLATFORM_DEPENDENT_HOME_EMOJI_PRESENT');

if ((practices.match(/class="practice-card/g) || []).length !== 69) failures.push('LEGAL_AREA_COUNT_CHANGED');
if ((community.match(/class="community-need-card/g) || []).length !== 21) failures.push('COMMUNITY_CATEGORY_COUNT_CHANGED');
if ((tour.match(/class="tour-step(?:\s|\")/g) || []).length !== 7) failures.push('ATTORNEY_TOUR_STEP_COUNT_CHANGED');
if (!practiceScript.includes('?6:12')) failures.push('LEGAL_RESPONSIVE_DISCLOSURE_CHANGED');
if (!communityScript.includes('?6:9')) failures.push('COMMUNITY_RESPONSIVE_DISCLOSURE_CHANGED');

if (!tour.includes('pre62-professional')) failures.push('PROFESSIONAL_DESIGN_SCOPE_MISSING');
if (!tour.includes('SMARTER_JUSTICE_PRE62_PROFESSIONAL_FUNNEL')) failures.push('PROFESSIONAL_FUNNEL_MARKER_MISSING');
if (!tour.includes('Start step-by-step tour')) failures.push('STEP_BY_STEP_PRIMARY_ACTION_MISSING');
if (!tourScript.includes('SMARTER_JUSTICE_PRE62_STEP_BY_STEP_DEFAULT')) failures.push('STEP_BY_STEP_DEFAULT_MARKER_MISSING');
if (!tourScript.includes("mode=params.get('mode')==='full'?'self-guided':'presenter'")) failures.push('STEP_BY_STEP_DEFAULT_INVALID');
if (tourScript.includes('portal=')) failures.push('LEGACY_MICROPORTAL_QUERY_PRESENT');

const microportalHosts = [
  'businesslawaid.com', 'civilrightslawaid.com', 'consumerprotectionlawaid.com',
  'disabilitylawaid.com', 'divorcelawaid.com', 'domesticviolenceaid.com',
  'eldercarelawaid.com', 'employmentlawaid.com', 'estatelawaid.com',
  'immigrationoasis.com', 'justicetaxsolutions.com', 'medicalmalpracticeaid.com',
  'personalinjurylawaid.com', 'realestatelawaid.com', 'veteranslawaid.com',
  'stopsignproject.org',
];
for (const [name, document] of allPublicHtml) {
  if (document.includes('pre61-platform') && !document.includes('pre62-platform')) failures.push(`PRE62_SCOPE_MISSING:${name}`);
  if (document.includes('data-nav-toggle')) {
    if ((document.match(/data-nav-toggle/g) || []).length !== 1) failures.push(`MOBILE_MENU_COUNT_INVALID:${name}`);
    if (!document.includes('data-nav')) failures.push(`MOBILE_MENU_TARGET_MISSING:${name}`);
  }
  if (document.includes('class="u-menu-toggle"') || document.includes('class="u-mobile-menu"')) failures.push(`LEGACY_MOBILE_MENU_PRESENT:${name}`);
  const externalHosts = [...document.matchAll(/href=["']https?:\/\/([^\/"']+)/gi)].map((match) => match[1].toLowerCase().replace(/^www\./, ''));
  for (const host of microportalHosts) if (externalHosts.includes(host)) failures.push(`MICROPORTAL_LINK_PRESENT:${name}:${host}`);
}

const moduleDestinations = {
  'family-law.html': ['/divorce'],
  'injury.html': ['/personal-injury', '/medical-malpractice'],
  'rights-defense.html': ['/civil-rights', '/?practice=criminal-defense-traffic-license#public-start'],
  'work-business.html': ['/employment', '/business-law'],
  'property-debt.html': ['/real-estate', '/consumer-protection', '/bankruptcy-debt.html'],
  'estate-benefits-records.html': ['/estate', '/elder-law', '/disability', '/veterans', '/immigration'],
};
for (const [name, destinations] of Object.entries(moduleDestinations)) {
  const document = read('public', name);
  for (const destination of destinations) if (!document.includes(`href="${destination}"`)) failures.push(`MODULE_DESTINATION_MISSING:${name}:${destination}`);
}

const result = {
  ok: failures.length === 0,
  platformRelease: 'v2.0.0-pre62',
  coreApplicationVersion: '1.7.98',
  designSystem: 'executive-clarity',
  homepageFunnel: 'one-primary-decision-path',
  professionalTour: 'step-by-step-default',
  responsiveDisclosure: {legalAreas: {phone: 6, desktop: 12}, community: {phone: 6, desktop: 9}},
  preserved: {legalAreas: 69, communityCategories: 21, attorneyTourSteps: 7, homeStartingPaths: 6},
  mobileNavigation: 'one-shared-control',
  microportalLinks: 'absent-from-central-platform',
  moduleDestinations: 'central-routes-preserved',
  failures,
};
console.log(JSON.stringify(result));
if (failures.length) process.exit(1);
