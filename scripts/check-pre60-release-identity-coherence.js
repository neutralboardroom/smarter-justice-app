'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.env.RUNTIME || '.runtime/smarter-justice-v1.7.98');
const failures = [];
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

if (!fs.existsSync(serverPath)) failures.push('RUNTIME_SERVER_MISSING');
if (!fs.existsSync(readinessPath)) failures.push('READINESS_MODULE_MISSING');
if (!fs.existsSync(homePath)) failures.push('PUBLIC_HOME_MISSING');
if (!fs.existsSync(homeScriptPath)) failures.push('PUBLIC_HOME_SCRIPT_MISSING');
if (!fs.existsSync(liveChatScriptPath)) failures.push('PUBLIC_LIVE_CHAT_SCRIPT_MISSING');
if (!fs.existsSync(attorneyTourPath)) failures.push('ATTORNEY_TOUR_MISSING');
if (!fs.existsSync(practiceDirectoryPath)) failures.push('PRACTICE_DIRECTORY_MISSING');
if (!fs.existsSync(communityResourcesPath)) failures.push('COMMUNITY_RESOURCES_MISSING');
if (!fs.existsSync(practiceDirectoryScriptPath)) failures.push('PRACTICE_DIRECTORY_SCRIPT_MISSING');
if (!fs.existsSync(communityResourcesScriptPath)) failures.push('COMMUNITY_RESOURCES_SCRIPT_MISSING');
if (!fs.existsSync(stylesPath)) failures.push('PUBLIC_STYLES_MISSING');

const server = fs.existsSync(serverPath) ? fs.readFileSync(serverPath, 'utf8') : '';
const readiness = fs.existsSync(readinessPath) ? fs.readFileSync(readinessPath, 'utf8') : '';
const home = fs.existsSync(homePath) ? fs.readFileSync(homePath, 'utf8') : '';
const homeScript = fs.existsSync(homeScriptPath) ? fs.readFileSync(homeScriptPath, 'utf8') : '';
const liveChatScript = fs.existsSync(liveChatScriptPath) ? fs.readFileSync(liveChatScriptPath, 'utf8') : '';
const attorneyTour = fs.existsSync(attorneyTourPath) ? fs.readFileSync(attorneyTourPath, 'utf8') : '';
const practiceDirectory = fs.existsSync(practiceDirectoryPath) ? fs.readFileSync(practiceDirectoryPath, 'utf8') : '';
const communityResources = fs.existsSync(communityResourcesPath) ? fs.readFileSync(communityResourcesPath, 'utf8') : '';
const practiceDirectoryScript = fs.existsSync(practiceDirectoryScriptPath) ? fs.readFileSync(practiceDirectoryScriptPath, 'utf8') : '';
const communityResourcesScript = fs.existsSync(communityResourcesScriptPath) ? fs.readFileSync(communityResourcesScriptPath, 'utf8') : '';
const styles = fs.existsSync(stylesPath) ? fs.readFileSync(stylesPath, 'utf8') : '';
for (const marker of [
  "currentPlatformRelease:'v2.0.0-pre60'",
  "coreApplicationVersion:VERSION",
  "platformMarker:'SMARTER_JUSTICE_PRE60_RELEASE_IDENTITY_COHERENCE'"
]) {
  if (!server.includes(marker)) failures.push(`SERVER_MARKER_MISSING:${marker}`);
}
if (!readiness.includes("const APPLICATION_VERSION = require('../package.json').version;")) {
  failures.push('APPLICATION_VERSION_BINDING_MISSING');
}
if (!readiness.includes("function liveness() {\n  return {\n    ok:true,\n    status:'alive',\n    app:'Smarter Justice',\n    version:APPLICATION_VERSION,")) {
  failures.push('LIVENESS_APPLICATION_VERSION_MISSING');
}
if (!homeScript.includes('SMARTER_JUSTICE_PRE60_SPECIALTY_START_COHERENCE')) failures.push('SPECIALTY_START_BINDING_MISSING');
if (!homeScript.includes("copyrights:'Copyright & copyright law'")) failures.push('COPYRIGHT_LABEL_MISSING');
if (!homeScript.includes("launchQuery.get('practice')")) failures.push('PRACTICE_QUERY_BINDING_MISSING');
if ((home.match(/id="professional-platform"/g) || []).length) failures.push('DUPLICATE_PROFESSIONAL_SECTION_PRESENT');
if (/<div class="u-more">[^<]*→<\/div>/.test(home)) failures.push('DUPLICATE_ARROW_SOURCE_PRESENT');
if (!home.includes('SMARTER_JUSTICE_PRE60_PUBLIC_EXPERIENCE_REPAIR')) failures.push('PUBLIC_EXPERIENCE_MARKER_MISSING');
if (!home.includes('h1{font-size:clamp(40px,4.7vw,62px);')) failures.push('DESKTOP_HEADLINE_SCALE_MISSING');
if (home.indexOf('class="navp-home-cta"') < home.indexOf('class="u-hero"')) failures.push('NAVIGATOR_PRECEDES_PRIMARY_START');
if (!liveChatScript.includes('SMARTER_JUSTICE_PRE60_HELP_FOOTER_COHERENCE')) failures.push('HELP_FOOTER_MARKER_MISSING');
if (!liveChatScript.includes("document.querySelector('.site-footer, .u-footer')")) failures.push('HELP_NEW_FOOTER_BINDING_MISSING');
if (!attorneyTour.includes('SMARTER_JUSTICE_PRE60_ATTORNEY_TOUR_COMPLETION')) failures.push('ATTORNEY_TOUR_COMPLETION_MARKER_MISSING');
if (attorneyTour.includes('Why Smarter Justice is different')) failures.push('ATTORNEY_TOUR_REDUNDANT_DIFFERENCE_TAIL_PRESENT');
if (attorneyTour.includes('SMARTER_JUSTICE_PRE47_GROWTH_LINK')) failures.push('ATTORNEY_TOUR_REDUNDANT_GROWTH_TAIL_PRESENT');
if (!styles.includes('SMARTER_JUSTICE_PRE60_ATTORNEY_TOUR_LAYOUT')) failures.push('ATTORNEY_TOUR_LAYOUT_MARKER_MISSING');
if (!styles.includes('.cards.three{grid-template-columns:repeat(3,minmax(0,1fr))}')) failures.push('THREE_CARD_DESKTOP_GRID_MISSING');
if (!styles.includes('SMARTER_JUSTICE_PRE60_COHESIVE_VISUAL_SYSTEM')) failures.push('COHESIVE_VISUAL_SYSTEM_MISSING');
if (!home.includes('SMARTER_JUSTICE_PRE60_HOME_VISUAL_SYSTEM')) failures.push('HOME_VISUAL_SYSTEM_MISSING');
if (!home.includes('SMARTER_JUSTICE_PRE60_SINGLE_MOBILE_NAV')) failures.push('HOME_SINGLE_MOBILE_NAV_MARKER_MISSING');
if (home.includes('<button class="u-menu-toggle"') || home.includes('<nav class="u-mobile-menu"')) failures.push('DUPLICATE_HOME_MOBILE_NAV_PRESENT');
if (!practiceDirectory.includes('SMARTER_JUSTICE_PRE60_SEARCH_FIRST_DIRECTORY')) failures.push('SEARCH_FIRST_DIRECTORY_MISSING');
if (!practiceDirectory.includes('src="/practice-directory-pre60.js"')) failures.push('PRACTICE_DIRECTORY_SCRIPT_NOT_BOUND');
if (!practiceDirectory.includes('What kind of help are you looking for?')) failures.push('DIRECTORY_SEARCH_PROMPT_MISSING');
if ((practiceDirectory.match(/class="practice-card/g) || []).length !== 69) failures.push('PRACTICE_CARD_COUNT_CHANGED');
if ((practiceDirectory.match(/class="practice-topics/g) || []).length !== 69) failures.push('PRACTICE_TOPICS_NOT_COLLAPSIBLE');
if ((practiceDirectory.match(/class="tile"/g) || []).length !== 8) failures.push('POPULAR_GUIDE_COUNT_NOT_COMPACT');
if (!practiceDirectoryScript.includes('SMARTER_JUSTICE_PRE60_PRACTICE_DIRECTORY_PROGRESSIVE_DISCLOSURE')) failures.push('PRACTICE_DIRECTORY_SCRIPT_MARKER_MISSING');
if (!practiceDirectoryScript.includes('index<12')) failures.push('PRACTICE_INITIAL_LIMIT_MISSING');
if (!communityResources.includes('SMARTER_JUSTICE_PRE60_COMMUNITY_PROGRESSIVE_DISCLOSURE')) failures.push('COMMUNITY_PROGRESSIVE_DISCLOSURE_MISSING');
if (!communityResources.includes('src="/community-resources-pre60.js"')) failures.push('COMMUNITY_DIRECTORY_SCRIPT_NOT_BOUND');
if ((communityResources.match(/class="community-need-card/g) || []).length !== 21) failures.push('COMMUNITY_CATEGORY_COUNT_CHANGED');
if ((communityResources.match(/<details/g) || []).length !== 2 || (communityResources.match(/<\/details>/g) || []).length !== 2) failures.push('COMMUNITY_DETAIL_BALANCE_FAILED');
if (!communityResources.includes('pre60-community-close')) failures.push('COMMUNITY_COMPLETION_MISSING');
if (communityResources.includes('Portfolio alignment') || communityResources.includes('Trusted community resource sheet')) failures.push('COMMUNITY_REDUNDANT_TAIL_PRESENT');
if (!communityResourcesScript.includes('SMARTER_JUSTICE_PRE60_COMMUNITY_PROGRESSIVE_DISCLOSURE')) failures.push('COMMUNITY_DIRECTORY_SCRIPT_MARKER_MISSING');
if (!communityResourcesScript.includes('index<9')) failures.push('COMMUNITY_INITIAL_LIMIT_MISSING');
for (const document of [practiceDirectory, communityResources, attorneyTour]) {
  if ((document.match(/<header\b/g) || []).length !== 1) failures.push('CORE_PAGE_HEADER_COUNT_INVALID');
  if (!document.includes('pre60-site-header')) failures.push('UNIFIED_NAVIGATION_MISSING');
}

const result = {
  ok: failures.length === 0,
  platformRelease: 'v2.0.0-pre60',
  coreApplicationVersion: '1.7.98',
  priorPlatformBaseline: 'v2.0.0-pre58',
  livenessVersionSource: 'runtime-package-version',
  specialtyStartContext: 'query-bound',
  publicExperienceRepair: 'homepage-hierarchy-and-repetition-repaired',
  attorneyTourRepair: 'desktop-grid-and-clean-completion-repaired',
  navigationSystem: 'unified-public-and-professional-headers',
  practiceDirectory: 'search-first-progressive-disclosure',
  communityResources: 'search-first-progressive-disclosure',
  failures
};
console.log(JSON.stringify(result));
if (failures.length) process.exit(1);
