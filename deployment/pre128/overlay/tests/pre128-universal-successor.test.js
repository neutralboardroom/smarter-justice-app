'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const temporaryStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'sj-community-test-'));
process.env.NODE_ENV = 'test';
delete process.env.RENDER;
delete process.env.DATABASE_URL;
process.env.SMARTER_JUSTICE_STORAGE_DIR = temporaryStorage;

function walk(directory, extensions, rows = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes:true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, extensions, rows);
    else if (entry.isFile() && extensions.includes(path.extname(entry.name))) rows.push(absolute);
  }
  return rows;
}
function visibleText(html) {
  return String(html)
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

try {
  const program = require('../lib/legalCommunityProgramPre128');
  const membership = require('../lib/legalCommunityMembershipPre128');
  const configuration = require('../data/legalCommunityProgramPre128').LEGAL_COMMUNITY_PROGRAM_PRE128;

  const validation = program.validate();
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(validation.publishedCommunities, 1);
  assert.equal(validation.paidEnrollmentOpen, false);
  assert.equal(validation.checkoutOpen, false);

  const publicMembership = program.publicMembership();
  assert.equal(publicMembership.enrollmentAvailable, false);
  assert.equal(publicMembership.checkoutAvailable, false);
  assert.equal(publicMembership.plannedPlans.some(plan => /Founding/i.test(plan.name)), false);
  const prices = Object.fromEntries(publicMembership.plannedPlans.map(plan => [plan.id, [plan.monthlyDollars, plan.annualDollars, plan.seats]]));
  assert.deepEqual(prices.professional, [10, 100, 1]);
  assert.deepEqual(prices.team, [29, 290, 5]);
  assert.deepEqual(prices.office, [49, 490, 15]);
  assert.equal(configuration.organizationBoundary.chapterSystemClaimed, undefined);
  assert.equal(configuration.organizationBoundary.barAssociationClaimed, false);
  assert.equal(configuration.competitionBoundary.feeCoordinationAllowed, false);

  const communities = program.listPublicCommunities();
  assert.equal(communities.communities.length, 1);
  assert.equal(communities.availability.otherAreasPublished, 0);
  assert.equal('candidateCommunities' in communities, false);
  assert.equal('type' in communities.communities[0].boundary, false);

  const experience = program.memberExperience('downtown-brooklyn', { now:'2026-09-03T12:00:00-04:00', practiceAreaIds:['civil-litigation'] });
  assert.equal(experience.preview, true);
  assert.equal(experience.membershipRequired, false);
  assert.equal(experience.paidBenefitsActive, false);
  assert(experience.forYourPractice.some(row => row.id === 'kings-civil-part-6-update-2026-08'));
  assert.equal(experience.privacyBoundary.privateUserMattersUsed, false);
  assert.equal(experience.gettingStarted.length, 4);
  const experienceCopy = JSON.stringify(experience);
  assert(!experienceCopy.includes('source-linked'));
  assert(!experienceCopy.includes('responsible source'));
  assert(!experienceCopy.includes('review boundary'));
  assert(!experienceCopy.includes('Pcheck-again date'));
  assert(!experienceCopy.includes('a original source'));

  const initial = membership.updateForAccount('account-test', {
    homeCommunityId:'downtown-brooklyn',
    participatingCommunityIds:[],
    serviceAreas:['Brooklyn','Queens'],
    practiceAreaIds:['civil-litigation','housing'],
    localIntelligenceEnabled:true,
    participationUpdatesEnabled:false,
    opportunityUpdatesEnabled:true
  });
  assert(!initial.error);
  const partial = membership.updateForAccount('account-test', { practiceAreaIds:['housing'] });
  assert(!partial.error);
  assert.equal(partial.preferences.homeCommunityId, 'downtown-brooklyn');
  assert.deepEqual(partial.preferences.serviceAreas, ['Brooklyn','Queens']);
  assert.deepEqual(partial.preferences.practiceAreaIds, ['housing']);
  assert.equal(partial.preferences.participationUpdatesEnabled, false);
  assert.equal(partial.preferences.opportunityUpdatesEnabled, true);
  const unpublished = membership.updateForAccount('account-test', { homeCommunityId:'williamsburg-greenpoint' });
  assert(unpublished.error);
  assert.equal(membership.SCHEMA_VERSION, 'smarter-justice.professional-legal-community-preferences.v3');

  const requiredPages = [
    'public/index.html','public/es/index.html','public/attorney-partner-tour.html','public/es/para-abogados.html',
    'public/professional-membership.html','public/es/membresia-profesional.html','public/professional-community.html',
    'public/es/comunidad-profesional.html','public/find-my-profile.html','public/professional-signup.html',
    'public/communities/downtown-brooklyn.html','public/community-briefs/downtown-brooklyn.html'
  ];
  for (const relative of requiredPages) assert(fs.existsSync(path.join(root, relative)), relative);

  const home = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert(home.includes('Tell us what happened.'));
  assert(home.includes('Not sent to lawyers'));
  const spanishHome = fs.readFileSync(path.join(root, 'public/es/index.html'), 'utf8');
  assert(spanishHome.includes('Cuéntenos qué pasó.'));
  assert(spanishHome.includes('No se envía a abogados'));

  const membershipPage = fs.readFileSync(path.join(root, 'public/professional-membership.html'), 'utf8');
  const spanishMembershipPage = fs.readFileSync(path.join(root, 'public/es/membresia-profesional.html'), 'utf8');
  for (const amount of ['$10','$100','$29','$290','$49','$490']) {
    assert(membershipPage.includes(amount), `membership:${amount}`);
    assert(spanishMembershipPage.includes(amount), `spanish-membership:${amount}`);
  }
  assert(membershipPage.includes('Enrollment not open'));
  assert(membershipPage.includes('No payment is accepted today'));
  assert(spanishMembershipPage.includes('Inscripción no abierta'));
  assert(spanishMembershipPage.includes('Hoy no se acepta ningún pago'));
  assert(!/Founding|founding launch/i.test(visibleText(membershipPage)));
  assert(!/Fundador|fundadora|fundacional/i.test(visibleText(spanishMembershipPage)));

  const signup = visibleText(fs.readFileSync(path.join(root, 'public/professional-signup.html'), 'utf8'));
  assert(signup.includes('New registration is temporarily paused.'));
  assert(!signup.includes('Create Attorney or Professional Account'));

  const browser = fs.readFileSync(path.join(root, 'public/community-experience.js'), 'utf8');
  assert(browser.includes('participatingControls.length'));
  assert(!browser.includes('participatingCommunityIds:[]'));
  assert(!browser.includes('/api/public/provider-readiness'));
  assert(browser.includes('/professional-preview'));

  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert(server.includes("require('./lib/legalCommunityProgramPre128')"));
  assert(server.includes('/professional-preview'));
  assert(server.includes('New professional registration and paid membership enrollment are temporarily unavailable'));
  assert(server.includes('SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED'));
  assert(server.includes("return {handled:true,activated:false,closed:true"));
  assert(server.includes('status.available&&status.providerVerified&&control.allowed'));
  assert(server.includes('aiStatus.available&&aiStatus.providerVerified&&aiControl.allowed'));
  const publicAiSmoke = server.slice(server.indexOf("pathName === '/api/public/ai-smoke'"), server.indexOf("/^\\/api\\/internal\\/ai-gateway"));
  assert(publicAiSmoke.includes('Guided rules-based help remains available.'));
  assert(!publicAiSmoke.includes('provider:result.provider'));
  assert(!publicAiSmoke.includes('model:result.model'));
  assert(!server.includes('X-Smarter-Justice-Demo-Path'));

  const htmlFiles = walk(path.join(root, 'public'), ['.html']);
  const textFiles = walk(path.join(root, 'public'), ['.html','.js','.css','.xml']);
  for (const file of textFiles) {
    const source = fs.readFileSync(file, 'utf8');
    assert(!/\bPRE\d{2,4}\b/i.test(source), `public release identifier:${path.relative(root,file)}`);
    assert(!/\b(?:a |build a |current |search |see |no current |complete )with original source links\b/i.test(source), `mechanical source wording:${path.relative(root,file)}`);
    assert(!/Pcheck-again date/i.test(source), `substring copy corruption:${path.relative(root,file)}`);
    assert(!/\ba original source\b/i.test(source), `original-source article:${path.relative(root,file)}`);
  }
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    assert(!html.includes('pre124-public-copy-guard'), `copy guard:${path.relative(root,file)}`);
    assert(!html.includes('pre124-launch'), `runtime scrubber:${path.relative(root,file)}`);
  }

  const sitemap = fs.readFileSync(path.join(root, 'public/sitemap.xml'), 'utf8');
  for (const obsolete of ['founding-portals','portal-router','portal-preparation','professional-signup','professional-community.html']) assert(!sitemap.includes(obsolete), `sitemap:${obsolete}`);
  assert(sitemap.includes('https://smarterjustice.com/communities/downtown-brooklyn'));
  assert(sitemap.includes('https://smarterjustice.com/professional-membership.html'));

  console.log(JSON.stringify({
    ok:true,
    suite:'pre128-universal-successor',
    publishedCommunities:1,
    paidEnrollmentOpen:false,
    checkoutOpen:false,
    preferencePartialUpdatePreservesUnrelatedFields:true,
    unpublishedCommunitiesRejected:true,
    homepageFirstEncounterPreserved:true,
    publicReleaseIdentifiersRemoved:true,
    publicHtmlFilesChecked:htmlFiles.length,
    publicTextFilesChecked:textFiles.length
  }, null, 2));
} finally {
  fs.rmSync(temporaryStorage, { recursive:true, force:true });
}
