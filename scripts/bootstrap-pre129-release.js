#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const predecessorScript = path.join(root, 'scripts', 'bootstrap-pre128-release.js');
const source = path.join(root, '.runtime', 'pre128-live');
const target = path.join(root, '.runtime', 'pre129-live');
const overlayRoot = path.join(root, 'deployment', 'pre129', 'overlay');
const overlayManifestPath = path.join(root, 'deployment', 'pre129', 'overlay-manifest.json');

const release = 'v2.0.0-pre129';
const baseRelease = 'v2.0.0-pre128';
const candidateId = 'SMARTER_JUSTICE_V2.0.0-PRE129_LAUNCH_READINESS_2026-09-06';
const ownerCommandId = 'SJ-UNIVERSAL-NEXT-2026-09-03-plus-2026-09-06-launch-readiness';
const sourceCommit = '962db2fe8a0b66dff2ad58bda75caf9e983bf45a';
const sourceTree = 'fcec5b314657da0d39c68b70d109fe80ba9fb6fe';
const rollbackDeploymentId = 'dep-dacq74vavr4c739dmipg';
const predecessorArtifactSha256 = 'd956ea7ee8d65fd7a9f6f4f6506cdb30c7c6ad96dc03841f1a75b3a407e83c53';
const recordedAt = '2026-09-05T23:45:00.000Z';

const fail = message => { console.error(`[PRE129 RELEASE] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };
const shaBuffer = value => crypto.createHash('sha256').update(value).digest('hex');
const sha = file => shaBuffer(fs.readFileSync(file));

function filesUnder(directory, prefix = '') {
  const rows = [];
  if (!fs.existsSync(directory)) return rows;
  for (const entry of fs.readdirSync(directory, { withFileTypes:true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...filesUnder(absolute, relative));
    else if (entry.isFile()) rows.push(relative.replace(/\\/g, '/'));
  }
  return rows;
}

function run(label, command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, encoding:'utf8', maxBuffer:64 * 1024 * 1024 });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (output) process.stdout.write(output);
  if (result.status !== 0) fail(`${label} failed with status ${result.status}:\n${output}`);
  return { label, command:[command, ...args].join(' '), status:result.status, output:output.slice(-16000) };
}

function isolatedQualificationEnvironment({ test = false } = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(?:RENDER(?:_|$)|DATABASE_URL$|PG(?:HOST|PORT|USER|PASSWORD|DATABASE|SSLMODE|POOL|CONNECT)|OWNER_|ADMIN_TOKEN$|SMTP_|RESEND_|STRIPE_|OPENAI_|SMARTER_JUSTICE_ENVIRONMENT$|SMARTER_JUSTICE_STORAGE_DIR$|SJ_PRE12[89]_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED$)/.test(key)) delete env[key];
  }
  if (test) env.NODE_ENV = 'test';
  else delete env.NODE_ENV;
  return env;
}

function replaceSection(content, start, end, replacement, label) {
  const from = content.indexOf(start);
  const to = content.indexOf(end, from + start.length);
  ok(from >= 0 && to > from, `${label} anchors are missing`);
  return content.slice(0, from) + replacement + content.slice(to);
}

function write(relative, content) {
  const absolute = path.join(target, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive:true });
  fs.writeFileSync(absolute, content);
}

ok(fs.existsSync(predecessorScript), 'PRE128 release bootstrap is missing');
run('PRE128 exact reconstruction', process.execPath, [predecessorScript], root, isolatedQualificationEnvironment());
ok(fs.existsSync(path.join(source, '.pre128-render-bootstrap.json')), 'PRE128 marker is missing');

const predecessorMarker = JSON.parse(fs.readFileSync(path.join(source, '.pre128-render-bootstrap.json'), 'utf8'));
ok(predecessorMarker.release === baseRelease, 'PRE128 release mismatch');
ok(predecessorMarker.productAuthority === 'SMARTER_JUSTICE_ONLY', 'PRE128 product authority mismatch');
ok(predecessorMarker.qualificationState === 'QUALIFIED_SUCCESSOR', 'PRE128 qualification state mismatch');
ok(predecessorMarker.paidMembershipEnrollmentOpen === false, 'PRE128 paid enrollment boundary mismatch');
ok(predecessorMarker.checkoutOpen === false, 'PRE128 checkout boundary mismatch');
ok(predecessorMarker.artifactSha256 === predecessorArtifactSha256, 'PRE128 artifact identity mismatch');

fs.mkdirSync(path.dirname(target), { recursive:true });
const staging = path.join(path.dirname(target), `.pre129-staging-${process.pid}-${crypto.randomBytes(5).toString('hex')}`);
const retired = path.join(path.dirname(target), `.pre129-retired-${process.pid}-${crypto.randomBytes(5).toString('hex')}`);
fs.rmSync(staging, { recursive:true, force:true, maxRetries:5, retryDelay:100 });
fs.cpSync(source, staging, { recursive:true });
if (fs.existsSync(target)) fs.renameSync(target, retired);
fs.renameSync(staging, target);
try { fs.rmSync(retired, { recursive:true, force:true, maxRetries:5, retryDelay:100 }); } catch {}

ok(fs.existsSync(overlayManifestPath), 'PRE129 overlay manifest is missing');
const overlayManifest = JSON.parse(fs.readFileSync(overlayManifestPath, 'utf8'));
ok(overlayManifest.schemaVersion === 'smarter-justice.pre129.overlay-manifest.v1', 'PRE129 overlay manifest schema mismatch');
ok(overlayManifest.release === release && overlayManifest.baseRelease === baseRelease, 'PRE129 overlay release mismatch');
const overlayFiles = filesUnder(overlayRoot);
const manifestFiles = Array.isArray(overlayManifest.files) ? overlayManifest.files : [];
ok(JSON.stringify(overlayFiles) === JSON.stringify(manifestFiles.map(row => row.path)), 'PRE129 overlay inventory mismatch');
for (const row of manifestFiles) {
  const from = path.join(overlayRoot, row.path);
  ok(fs.existsSync(from), `PRE129 overlay file missing: ${row.path}`);
  ok(sha(from) === row.sha256, `PRE129 overlay hash mismatch: ${row.path}`);
  const to = path.join(target, row.path);
  fs.mkdirSync(path.dirname(to), { recursive:true });
  fs.copyFileSync(from, to);
}

const serverPath = path.join(target, 'server.js');
let server = fs.readFileSync(serverPath, 'utf8');

const requireAnchor = "const legalCommunityProgramPre128 = require('./lib/legalCommunityProgramPre128');";
ok(server.includes(requireAnchor), 'PRE128 legal-community require anchor is missing');
server = server.replace(requireAnchor, `${requireAnchor}\nconst professionalLaunchGatePre129 = require('./lib/professionalLaunchGatePre129');`);

const launchFunction = `async function ensureAttorneyLaunchConfiguration(){
  const planned=legalCommunityProgramPre128.publicMembership();
  if(planned.enrollmentAvailable||planned.checkoutAvailable) throw new Error('PRE128 professional enrollment must remain closed.');
  console.log('[PROFESSIONAL COMMUNITY] PRE128 preview available; registration, applications, enrollment, checkout, and paid activation remain closed.');
}`;
ok(server.includes(launchFunction), 'PRE128 launch configuration function is missing');
server = server.replace(launchFunction, `async function ensureAttorneyLaunchConfiguration(){
  const launch=professionalLaunchGatePre129.state();
  if(launch.environmentVariableCanOpen) throw new Error('Professional launch gate may not be opened by environment variable.');
  console.log('[PROFESSIONAL COMMUNITY] PRE129 launch gate evaluated: preview=' + launch.professionalPreviewAvailable + ' registration=' + launch.professionalRegistrationOpen + ' paid=' + launch.paidEnrollmentOpen + '.');
}`);

const requestGateStart = "  const pre128ProfessionalEnrollmentClosed=process.env.NODE_ENV==='production'||Boolean(process.env.RENDER)||envFlag('SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED');";
const requestGateEnd = "  const sensitiveRead =";
const requestGate = `  const pre129LaunchState=professionalLaunchGatePre129.state();
  const pre129ForceClosed=envFlag('SJ_PRE129_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED');
  const pre129TestRegistrationBypass=process.env.NODE_ENV==='test'&&!process.env.RENDER&&envFlag('SJ_PRE129_TEST_ALLOW_PROFESSIONAL_REGISTRATION');
  const pre129ProfessionalRegistrationClosed=pre129ForceClosed||(!pre129TestRegistrationBypass&&!pre129LaunchState.professionalRegistrationOpen);
  const pre129PaidEnrollmentClosed=pre129ForceClosed||!pre129LaunchState.paidEnrollmentOpen;
  const pre129RegistrationMutation=req.method==='POST'&&new Set(['/api/professional/auth/signup','/api/professional/pilot-program/application/save','/api/professional/pilot-program/application/submit','/api/professional-membership-interest','/api/professional-launch-interest']).has(pathName);
  const pre129PaidMutation=req.method==='POST'&&pathName==='/api/professional/membership/checkout';
  if(pre129ProfessionalRegistrationClosed&&pre129RegistrationMutation)return json(res,503,{ok:false,error:'New professional registration is temporarily unavailable. No account, application, or interest record was created.'});
  if(pre129PaidEnrollmentClosed&&pre129PaidMutation)return json(res,503,{ok:false,error:'Paid professional membership enrollment is not open. No payment was created.'});
  if(pre129PaidEnrollmentClosed&&req.method==='GET'&&pathName==='/api/professional/membership/confirm')return json(res,503,{ok:false,error:'Paid professional membership confirmation is not open.'});
`;
server = replaceSection(server, requestGateStart, requestGateEnd, requestGate, 'PRE128 request launch gate');

const oldActivationGuard = "if(process.env.NODE_ENV==='production'||Boolean(process.env.RENDER)||envFlag('SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED'))return";
const activationCount = server.split(oldActivationGuard).length - 1;
ok(activationCount === 2, `Expected two PRE128 billing activation guards, found ${activationCount}`);
server = server.replaceAll(oldActivationGuard, "if(envFlag('SJ_PRE129_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED')||!professionalLaunchGatePre129.state().paidEnrollmentOpen)return");

const readinessStart = "  if (req.method === 'GET' && pathName === '/api/professional-program-status')";
const readinessEnd = "  if (req.method === 'GET' && pathName === '/api/public/journey')";
const customerReadiness = `  if (req.method === 'GET' && pathName === '/api/professional-program-status') { const launch=professionalLaunchGatePre129.publicStatus(); return json(res,200,{ok:true,applicationsOpen:launch.professionalRegistration.available,paymentOpen:launch.payments.available,professionalPreviewAvailable:launch.professionalPreview.available,message:launch.message}); }
  if (req.method === 'GET' && pathName === '/api/public/launch-status') { const launch=professionalLaunchGatePre129.publicStatus(); return json(res,200,{ok:true,publicStartingHelp:{label:'Public starting help',detail:'Available without payment.'},professionalAccounts:{label:'Existing professional accounts',detail:'Existing verified accounts may sign in.'},professionalApplications:{label:'New professional registration',detail:launch.professionalRegistration.label},professionalGrowth:{label:'Professional community preview',detail:launch.professionalPreview.label},linkedinProspecting:{label:'Professional overview for manual sharing',detail:launch.linkedinProspecting.label,path:'/attorney-partner-tour.html'},paidMembership:{label:'Paid membership',detail:launch.membershipEnrollment.label}}); }
  if (req.method === 'GET' && pathName === '/api/public/service-status') { const storage=store.storageStatus(); const available=Boolean(storage.databaseReady&&!storage.persistenceBlocked); return json(res,available?200:503,{ok:available,overall:{status:available?'operational':'limited',label:available?'Core service available':'Some services are limited',detail:available?'Public pages and existing-account services are responding.':'Use public information without submitting account or sensitive information.'},selectedReadinessLane:{name:'Public service',status:available?'available':'limited'}}); }
  if (req.method === 'GET' && pathName === '/api/public/provider-readiness') {
    const storage=store.storageStatus(); const existingAccounts=Boolean(storage.databaseReady&&!storage.persistenceBlocked);
    const aiStatus=centralAiGateway.publicStatus(); const aiControl=featureControlPlane.capabilityState('ai'); const aiAvailable=Boolean(aiStatus.available&&aiStatus.providerVerified&&aiControl.allowed);
    const launch=professionalLaunchGatePre129.publicStatus();
    return json(res,200,{ok:true,professionalPreview:launch.professionalPreview,linkedinProspecting:launch.linkedinProspecting,professionalRegistration:launch.professionalRegistration,existingProfessionalSignIn:{available:existingAccounts,label:existingAccounts?'Available':'Temporarily unavailable'},membershipEnrollment:launch.membershipEnrollment,payments:launch.payments,rulesBasedHelp:{available:true,label:'Available'},aiAssistance:{available:aiAvailable,label:aiAvailable?'Optional assistance available':'Temporarily unavailable'}});
  }
`;
server = replaceSection(server, readinessStart, readinessEnd, customerReadiness, 'PRE128 public launch readiness');

server = server.replaceAll('v2.0.0-pre128', 'v2.0.0-pre129').replaceAll('2.0.0-pre128', '2.0.0-pre129');
fs.writeFileSync(serverPath, server);

const packagePath = path.join(target, 'package.json');
const runtimePackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const retainedSystemTest = runtimePackage.scripts?.['test:pre128:system'] || 'node tests/pre128-system-qualification.test.js';
const retainedSecurityTest = runtimePackage.scripts?.['test:security'] || 'node tests/security-boundaries-v177.test.js && node tests/security-readiness.test.js';
runtimePackage.name = 'smarter-justice-pre129-runtime';
runtimePackage.version = '2.0.0-pre129';
runtimePackage.description = 'Smarter Justice launch-readiness successor with source-controlled professional registration and paid-membership gates.';
runtimePackage.scripts = runtimePackage.scripts || {};
runtimePackage.scripts['test:pre128:retained'] = `${retainedSystemTest} && ${retainedSecurityTest}`;
runtimePackage.scripts['test:pre129:launch'] = 'node tests/pre129-launch-readiness.test.js';
runtimePackage.scripts['deployment:validate'] = 'node scripts/validate-pre129-deployment-kit.js';
runtimePackage.scripts['deployment:doctor'] = 'node scripts/deployment-doctor-pre129.js';
runtimePackage.scripts['qualify:pre129'] = 'npm run test:pre128:retained && npm run test:pre129:launch && npm run deployment:validate';
runtimePackage.scripts.test = 'npm run qualify:pre129';
fs.writeFileSync(packagePath, JSON.stringify(runtimePackage, null, 2) + '\n');

const lockPath = path.join(target, 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
lock.name = runtimePackage.name;
lock.version = runtimePackage.version;
if (lock.packages && lock.packages['']) {
  lock.packages[''].name = runtimePackage.name;
  lock.packages[''].version = runtimePackage.version;
}
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');

function enableSyntheticProfessionalFixture(relative, anchorText, replacementText) {
  const absolute = path.join(target, relative);
  let value = fs.readFileSync(absolute, 'utf8');
  ok(value.includes(anchorText), `PRE129 synthetic professional fixture anchor missing: ${relative}`);
  value = value.replace(anchorText, replacementText);
  fs.writeFileSync(absolute, value);
}
enableSyntheticProfessionalFixture(
  'tests/security-boundaries-v177.test.js',
  "ADMIN_TOKEN:'authorized-team-code-1234567890'}",
  "ADMIN_TOKEN:'authorized-team-code-1234567890',SJ_PRE129_TEST_ALLOW_PROFESSIONAL_REGISTRATION:'true'}"
);
enableSyntheticProfessionalFixture(
  'tests/security-readiness.test.js',
  "OWNER_NOTIFICATION_EMAIL:'',SMTP_HOST:'',SMTP_USER:'',SMTP_PASS:''}",
  "OWNER_NOTIFICATION_EMAIL:'',SMTP_HOST:'',SMTP_USER:'',SMTP_PASS:'',SJ_PRE129_TEST_ALLOW_PROFESSIONAL_REGISTRATION:'true'}"
);

const isolatedTestEnvironment = isolatedQualificationEnvironment({ test:true });
const testResults = [];
testResults.push(run('PRE129 launch readiness', process.execPath, [path.join(target, 'tests', 'pre129-launch-readiness.test.js')], target, isolatedTestEnvironment));

const volatile = new Set([
  '.pre121-render-bootstrap.json','.pre122-render-bootstrap.json','.pre123-render-bootstrap.json','.pre124-render-bootstrap.json','.pre125-render-bootstrap.json','.pre126-render-bootstrap.json','.pre127-render-bootstrap.json','.pre128-render-bootstrap.json',
  'PRE124_COMPLETION_RECEIPT.json','PRE125_COMPLETION_RECEIPT.json','PRE126_COMPLETION_RECEIPT.json','PRE127_COMPLETION_RECEIPT.json','PRE128_COMPLETION_RECEIPT.json',
  'PRE128_BUILD_FILE_MANIFEST.json'
]);
const manifestRows = filesUnder(target)
  .filter(relative => !['.pre129-render-bootstrap.json','PRE129_COMPLETION_RECEIPT.json','PRE129_BUILD_FILE_MANIFEST.json'].includes(relative))
  .filter(relative => !volatile.has(relative))
  .map(relative => ({ path:relative, sha256:sha(path.join(target, relative)), bytes:fs.statSync(path.join(target, relative)).size }));
const artifactHash = shaBuffer(JSON.stringify(manifestRows));

write('PRE129_BUILD_FILE_MANIFEST.json', JSON.stringify({
  schemaVersion:'smarter-justice.pre129.build-file-manifest.v1',
  release, baseRelease, candidateId, sourceCommit, sourceTree,
  predecessorArtifactSha256, fileCount:manifestRows.length,
  artifactSha256:artifactHash,
  excludedFromArtifactHash:[...volatile].sort(),
  files:manifestRows
}, null, 2) + '\n');

const completionReceipt = {
  schemaVersion:'smarter-justice.pre129.completion-receipt.v1',
  releaseState:'SOURCE_QUALIFIED',
  release, baseRelease, candidateId, ownerCommandId,
  recordedAt, productAuthority:'SMARTER_JUSTICE_ONLY',
  sourceCommit, sourceTree, predecessorArtifactSha256,
  rollbackProductionCommit:sourceCommit, rollbackDeploymentId,
  noLossFromPredecessor:true,
  predecessorPreservedAt:'.runtime/pre128-live',
  publicHelpPreserved:true,
  freeProfileTrustSubstratePreserved:true,
  professionalPreviewAvailable:true,
  linkedinProspectingLandingReady:true,
  linkedinProspectingLandingPath:'/attorney-partner-tour.html',
  newProfessionalRegistrationOpen:false,
  paidMembershipEnrollmentOpen:false,
  checkoutOpen:false,
  paidEntitlementsMayActivate:false,
  smarterJusticeEmailDomainCreated:true,
  smarterJusticeEmailDomainVerified:false,
  smarterJusticeStripeAccountAuthorityVerified:false,
  franklinProviderReuse:false,
  sourceControlledLaunchAcceptance:true,
  environmentVariableCanOpen:false,
  tests:testResults.map(row => ({name:row.label,status:'PASS'})),
  artifactSha256:artifactHash
};
write('PRE129_COMPLETION_RECEIPT.json', JSON.stringify(completionReceipt, null, 2) + '\n');

const marker = {
  schemaVersion:'smarter-justice.pre129.render-bootstrap.v1',
  release, baseRelease, candidateId, ownerCommandId,
  sourceCommit, sourceTree,
  predecessorArtifactSha256,
  rollbackProductionCommit:sourceCommit,
  rollbackDeploymentId,
  productAuthority:'SMARTER_JUSTICE_ONLY',
  professionalPreviewAvailable:true,
  linkedinProspectingLandingReady:true,
  newProfessionalRegistrationOpen:false,
  paidMembershipEnrollmentOpen:false,
  checkoutOpen:false,
  environmentVariableCanOpen:false,
  sourceControlledLaunchAcceptance:true,
  providerMutation:false,
  stripeMutation:false,
  productionDeploymentAuthorized:false,
  qualificationState:'SOURCE_QUALIFIED',
  artifactSha256:artifactHash,
  runtimeFiles:filesUnder(target).length,
  preparedAt:recordedAt
};
write('.pre129-render-bootstrap.json', JSON.stringify(marker, null, 2) + '\n');

run('PRE129 post-seal validation', process.execPath, [path.join(target, 'scripts', 'validate-pre129-deployment-kit.js')], target, isolatedTestEnvironment);
console.log(`[PRE129 RELEASE] SOURCE_QUALIFIED candidate prepared artifact=${artifactHash}; professional preview is prospecting-ready; registration, paid enrollment, and checkout remain closed.`);
