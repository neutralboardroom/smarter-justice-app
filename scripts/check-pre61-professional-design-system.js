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

const server = read('server.js');
const home = read('public', 'index.html');
const styles = read('public', 'styles.css');
const tour = read('public', 'attorney-partner-tour.html');
const practices = read('public', 'practice-areas.html');
const community = read('public', 'community-resources.html');
const practiceScript = read('public', 'practice-directory-pre60.js');
const communityScript = read('public', 'community-resources-pre60.js');
const moduleDestinations = {
  'family-law.html': ['/divorce'],
  'injury.html': ['/personal-injury', '/medical-malpractice'],
  'rights-defense.html': ['/civil-rights', '/?practice=criminal-defense-traffic-license#public-start'],
  'work-business.html': ['/employment', '/business-law'],
  'property-debt.html': ['/real-estate', '/consumer-protection', '/bankruptcy-debt.html'],
  'estate-benefits-records.html': ['/estate', '/elder-law', '/disability', '/veterans', '/immigration']
};
const walkHtml = (directory) => fs.readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
  const resolved = path.join(directory, entry.name);
  if (entry.isDirectory()) return walkHtml(resolved);
  return entry.isFile() && entry.name.endsWith('.html') ? [resolved] : [];
});
const publicRoot = path.join(root, 'public');
const allPublicHtml = walkHtml(publicRoot)
  .map((filePath) => [path.relative(publicRoot, filePath), fs.readFileSync(filePath, 'utf8')]);

for (const marker of [
  "currentPlatformRelease:'v2.0.0-pre61'",
  "coreApplicationVersion:VERSION",
  "platformMarker:'SMARTER_JUSTICE_PRE61_PROFESSIONAL_DESIGN_SYSTEM'"
]) if (!server.includes(marker)) failures.push(`SERVER_MARKER_MISSING:${marker}`);

if (!home.includes('SMARTER_JUSTICE_PRE61_NAVIGATOR_LAYOUT_REPAIR')) failures.push('NAVIGATOR_LAYOUT_REPAIR_MISSING');
if (!home.includes('SMARTER_JUSTICE_PRE61_HOME_REFINEMENT')) failures.push('HOME_REFINEMENT_MISSING');
if (!home.includes('class="navp-home-cta__content"')) failures.push('NAVIGATOR_CONTENT_GROUP_MISSING');
if (!home.includes('class="navp-home-cta__action"')) failures.push('NAVIGATOR_ACTION_MISSING');
if ((home.match(/class="u-icon" aria-hidden="true">0[1-6]<\/div>/g) || []).length !== 6) failures.push('NUMBERED_HOME_PATH_MARKERS_INVALID');
if (/[⚖🩹🏛💼🏠📄]/u.test(home)) failures.push('PLATFORM_DEPENDENT_HOME_EMOJI_PRESENT');
if (!styles.includes('SMARTER_JUSTICE_PRE61_PROFESSIONAL_DESIGN_SYSTEM')) failures.push('DESIGN_SYSTEM_MISSING');
for (const required of [
  '.pre61-platform .navp-home-cta',
  '.pre61-platform .practice-card',
  '.pre61-platform .community-hero',
  '.pre61-professional .tour-step',
  '@media(max-width:620px)'
]) if (!(styles + home).includes(required)) failures.push(`DESIGN_RULE_MISSING:${required}`);

if (!practiceScript.includes('SMARTER_JUSTICE_PRE61_MOBILE_DIRECTORY_LIMIT')) failures.push('LEGAL_MOBILE_LIMIT_MARKER_MISSING');
if (!practiceScript.includes("?6:12")) failures.push('LEGAL_RESPONSIVE_LIMIT_MISSING');
if (!communityScript.includes('SMARTER_JUSTICE_PRE61_MOBILE_COMMUNITY_LIMIT')) failures.push('COMMUNITY_MOBILE_LIMIT_MARKER_MISSING');
if (!communityScript.includes("?6:9")) failures.push('COMMUNITY_RESPONSIVE_LIMIT_MISSING');
if ((practices.match(/class="practice-card/g) || []).length !== 69) failures.push('LEGAL_AREA_COUNT_CHANGED');
if ((community.match(/class="community-need-card/g) || []).length !== 21) failures.push('COMMUNITY_CATEGORY_COUNT_CHANGED');
if ((tour.match(/class="tour-step(?:\s|\")/g) || []).length !== 7) failures.push('ATTORNEY_TOUR_STEP_COUNT_CHANGED');
if ((home.match(/class="u-card"/g) || []).length !== 6) failures.push('HOME_STARTING_PATH_COUNT_CHANGED');

for (const [name, document] of [['home', home], ['practices', practices], ['community', community], ['tour', tour]]) {
  if (!document.includes('pre61-platform')) failures.push(`PRE61_SCOPE_MISSING:${name}`);
  if ((document.match(/<header\b/g) || []).length !== 1) failures.push(`HEADER_COUNT_INVALID:${name}`);
}
const microportalHosts = [
  'businesslawaid.com', 'civilrightslawaid.com', 'consumerprotectionlawaid.com',
  'disabilitylawaid.com', 'divorcelawaid.com', 'domesticviolenceaid.com',
  'eldercarelawaid.com', 'employmentlawaid.com', 'estatelawaid.com',
  'immigrationoasis.com', 'justicetaxsolutions.com', 'medicalmalpracticeaid.com',
  'personalinjurylawaid.com', 'realestatelawaid.com', 'veteranslawaid.com',
  'stopsignproject.org'
];
for (const [name, document] of allPublicHtml) {
  if (document.includes('data-nav-toggle') && document.includes('class="u-menu-toggle"')) failures.push(`DUPLICATE_MOBILE_MENU:${name}`);
  const externalHrefs = [...document.matchAll(/href=["']https?:\/\/([^\/"']+)/gi)]
    .map((match) => match[1].toLowerCase().replace(/^www\./, ''));
  for (const host of microportalHosts) if (externalHrefs.includes(host)) failures.push(`MICROPORTAL_LINK_PRESENT:${name}:${host}`);
  const footer = document.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || '';
  if (footer && /Specialty paths|Complete network/i.test(footer)) failures.push(`LEGACY_PORTAL_FOOTER_PRESENT:${name}`);
}
for (const [name, destinations] of Object.entries(moduleDestinations)) {
  const document = read('public', name);
  for (const destination of destinations) {
    if (!document.includes(`href="${destination}"`)) failures.push(`MODULE_DESTINATION_MISSING:${name}:${destination}`);
  }
}

const result = {
  ok: failures.length === 0,
  platformRelease: 'v2.0.0-pre61',
  coreApplicationVersion: '1.7.98',
  designSystem: 'bright-white-restrained-professional',
  navigatorLayout: 'repaired',
  homeIconSystem: 'stable-numbered-markers',
  responsiveDisclosure: {legalAreas: {phone: 6, desktop: 12}, community: {phone: 6, desktop: 9}},
  preserved: {legalAreas: 69, communityCategories: 21, attorneyTourSteps: 7, homeStartingPaths: 6},
  mobileNavigation: 'single-shared-controller',
  microportalLinks: 'removed-from-central-platform',
  moduleDestinations: 'central-routes-verified',
  failures
};
console.log(JSON.stringify(result));
if (failures.length) process.exit(1);
