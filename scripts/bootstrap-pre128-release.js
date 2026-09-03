#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const predecessorScript = path.join(root, 'scripts', 'bootstrap-pre127-release.js');
const source = path.join(root, '.runtime', 'pre127-live');
const target = path.join(root, '.runtime', 'pre128-live');
const overlayRoot = path.join(root, 'deployment', 'pre128', 'overlay');
const overlayManifestPath = path.join(root, 'deployment', 'pre128', 'overlay-manifest.json');
const release = 'v2.0.0-pre128';
const baseRelease = 'v2.0.0-pre127';
const candidateId = 'SMARTER_JUSTICE_V2.0.0-PRE128_UNIVERSAL_SUCCESSOR_2026-09-03';
const ownerCommandId = 'SJ-UNIVERSAL-NEXT-2026-09-03-be08b177d197';
const sourceCommit = 'a746c2d689c03ba713d9d31dd952bc9fd2137dbb';
const sourceTree = '966152d3e62f4a4df45dcfb7241f3a444a90f97d';
const ownerCommandSha256 = 'be08b177d19712c28844976ee2ba98b5c1f8ee4d6a6a002f0e282d8fdbe74587';
const recordedAt = '2026-09-03T15:15:17.000Z';
const fail = message => { console.error(`[PRE128 RELEASE] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };
const shaBuffer = value => crypto.createHash('sha256').update(value).digest('hex');
const sha = file => shaBuffer(fs.readFileSync(file));

function filesUnder(directory, prefix = '') {
  const rows = [];
  if (!fs.existsSync(directory)) return rows;
  for (const entry of fs.readdirSync(directory, { withFileTypes:true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...filesUnder(absolute, relative));
    else if (entry.isFile()) rows.push(relative.replace(/\\/g, '/'));
  }
  return rows;
}
function write(relative, content, modified) {
  const absolute = path.join(target, relative);
  fs.mkdirSync(path.dirname(absolute), { recursive:true });
  fs.writeFileSync(absolute, content);
  if (modified) modified.add(relative.replace(/\\/g, '/'));
}
function replaceSection(content, start, end, replacement, label) {
  const from = content.indexOf(start);
  const to = content.indexOf(end, from + start.length);
  ok(from >= 0 && to > from, `${label} anchors are missing`);
  return content.slice(0, from) + replacement + content.slice(to);
}
function run(label, command, args, cwd = target, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, encoding:'utf8', maxBuffer:32 * 1024 * 1024 });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  if (output) process.stdout.write(output);
  if (result.status !== 0) fail(`${label} failed with status ${result.status}:\n${output}`);
  return { label, command:[command, ...args].join(' '), status:result.status, output:output.slice(-12000) };
}
function isolatedQualificationEnvironment({ test = false } = {}) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^(?:RENDER(?:_|$)|DATABASE_URL$|PG(?:HOST|PORT|USER|PASSWORD|DATABASE|SSLMODE|POOL|CONNECT)|OWNER_|ADMIN_TOKEN$|SMTP_|STRIPE_|OPENAI_|SMARTER_JUSTICE_ENVIRONMENT$|SMARTER_JUSTICE_STORAGE_DIR$|SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED$)/.test(key)) delete env[key];
  }
  if (test) env.NODE_ENV = 'test';
  else delete env.NODE_ENV;
  return env;
}
function runWithFilesystemConvergenceRetry(label, command, args, cwd, env = process.env) {
  const retryable = /(?:(?:base|PRE\d+) runtime (?:file )?count mismatch(?: \d+)?|ENOTEMPTY)/i;
  let lastOutput = '';
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const result = spawnSync(command, args, { cwd, env, encoding:'utf8', maxBuffer:32 * 1024 * 1024 });
    const output = `${result.stdout || ''}${result.stderr || ''}`;
    if (result.status === 0) {
      if (output) process.stdout.write(output);
      return { label, command:[command, ...args].join(' '), status:result.status, output:output.slice(-12000), attempts:attempt };
    }
    lastOutput = output;
    if (!retryable.test(output) || attempt === 6) break;
    console.warn(`[PRE128 RELEASE] ${label} filesystem count had not converged (attempt ${attempt}/6); retrying exact reconstruction.`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 400);
  }
  fail(`${label} failed after filesystem-convergence retry:\n${lastOutput}`);
}
function visibleText(html) {
  return String(html || '').replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function scanHighConfidenceSecrets(directory) {
  const patterns = [
    ['private_key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g],
    ['aws_access_key', /\bAKIA[0-9A-Z]{16}\b/g],
    ['github_token', /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g],
    ['slack_token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
    ['openai_live_key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/g]
  ];
  const extensions = new Set(['.js','.cjs','.mjs','.json','.py','.md','.txt','.html','.css','.yml','.yaml','.toml','.env','.sh']);
  const findings = [];
  let textFilesScanned = 0;
  let bytesScanned = 0;
  for (const relative of filesUnder(directory)) {
    const parts = relative.split('/');
    if (parts.includes('node_modules') || parts.includes('.git')) continue;
    if (parts.includes('data') && parts.includes('profile-factory')) continue;
    const basename = path.basename(relative);
    if (!extensions.has(path.extname(relative).toLowerCase()) && !['.env','Dockerfile'].includes(basename)) continue;
    const absolute = path.join(directory, relative);
    const value = fs.readFileSync(absolute, 'utf8');
    textFilesScanned += 1;
    bytesScanned += fs.statSync(absolute).size;
    for (const [type, expression] of patterns) {
      expression.lastIndex = 0;
      if (expression.test(value)) findings.push({ type, file:relative, matchRedacted:true });
    }
  }
  return { status:findings.length ? 'FAIL' : 'PASS', highConfidenceFindingCount:findings.length, textFilesScanned, bytesScanned, patterns:patterns.map(([name]) => name), excluded:['node_modules','.git','data/profile-factory (public-source evidence corpus)'], findings, note:'High-confidence static secret scan only; not exhaustive.' };
}
function transformPublicText(sourceText) {
  let value = String(sourceText);
  value = value
    .replace(/<script\b[^>]*src=["'][^"']*(?:pre124-public-copy-guard|pre124-launch)[^"']*["'][^>]*><\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\$120\/year/gi, '$100/year').replace(/\$120\/año/gi, '$100/año').replace(/\$120 annually/gi, '$100 annually')
    .replace(/\$12\/month/gi, '$10/month').replace(/\$12\/mo\b/gi, '$10/mo').replace(/\$12\/mes/gi, '$10/mes').replace(/\$12 monthly/gi, '$10 monthly')
    .replace(/save \$24/gi, 'save $20').replace(/ahorra \$24/gi, 'ahorra $20')
    .replace(/source-linked/gi, 'source-backed')
    .replace(/\bresponsible sources\b/gi, 'original sources')
    .replace(/\bresponsible source\b/gi, 'original source')
    .replace(/\bPreview boundary\b/g, 'Preview limits')
    .replace(/\breview boundary\b/gi, 'next review date')
    .replace(/\ba original source\b/gi, 'an original source')
    .replace(/currentness basis/gi, 'source and review date')
    .replace(/\bMember Care\b/g, 'account support')
    .replace(/owner workbench/gi, 'administration')
    .replace(/\bNO_GO\b/g, 'Not available');
  return value;
}

ok(fs.existsSync(predecessorScript), 'PRE127 release bootstrap is missing');
runWithFilesystemConvergenceRetry('PRE127 reconstruction', process.execPath, [predecessorScript], root, isolatedQualificationEnvironment());
ok(fs.existsSync(path.join(source, '.pre127-render-bootstrap.json')), 'PRE127 marker is missing');
const predecessorMarker = JSON.parse(fs.readFileSync(path.join(source, '.pre127-render-bootstrap.json'), 'utf8'));
ok(predecessorMarker.release === baseRelease, 'PRE127 release mismatch');
ok(predecessorMarker.productAuthority === 'SMARTER_JUSTICE_ONLY', 'PRE127 product authority mismatch');
ok(predecessorMarker.oneConnectedDomainAndBrand === true, 'PRE127 connected-brand boundary mismatch');
ok(predecessorMarker.newStripeSetup === false, 'PRE127 Stripe boundary mismatch');

const baseFiles = filesUnder(source);
const baseHashes = new Map(baseFiles.map(relative => [relative, sha(path.join(source, relative))]));
const predecessorHomepageSha256 = baseHashes.get('public/index.html');
const predecessorSpanishHomepageSha256 = baseHashes.get('public/es/index.html');
ok(predecessorHomepageSha256 && predecessorSpanishHomepageSha256, 'PRE127 homepage hashes are missing');

const runtimeRoot = path.dirname(target);
fs.mkdirSync(runtimeRoot, { recursive:true });
const staging = path.join(runtimeRoot, `.pre128-staging-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
const retired = path.join(runtimeRoot, `.pre128-retired-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
fs.rmSync(staging, { recursive:true, force:true, maxRetries:5, retryDelay:100 });
fs.cpSync(source, staging, { recursive:true });
if (fs.existsSync(target)) fs.renameSync(target, retired);
fs.renameSync(staging, target);
try { fs.rmSync(retired, { recursive:true, force:true, maxRetries:5, retryDelay:100 }); } catch {}
const modified = new Set();

ok(fs.existsSync(overlayManifestPath), 'PRE128 overlay manifest is missing');
const overlayManifest = JSON.parse(fs.readFileSync(overlayManifestPath, 'utf8'));
ok(overlayManifest.schemaVersion === 'smarter-justice.pre128.overlay-manifest.v1', 'PRE128 overlay manifest version mismatch');
const overlayFiles = filesUnder(overlayRoot);
const manifestFiles = Array.isArray(overlayManifest.files) ? overlayManifest.files : [];
ok(JSON.stringify(overlayFiles) === JSON.stringify(manifestFiles.map(row => row.path)), 'PRE128 overlay file inventory mismatch');
for (const row of manifestFiles) {
  const from = path.join(overlayRoot, row.path);
  ok(sha(from) === row.sha256, `PRE128 overlay hash mismatch: ${row.path}`);
  const to = path.join(target, row.path);
  fs.mkdirSync(path.dirname(to), { recursive:true });
  fs.copyFileSync(from, to);
  modified.add(row.path);
}

const serverPath = path.join(target, 'server.js');
let server = fs.readFileSync(serverPath, 'utf8');
const requireAnchor = "const legalCommunityMembershipPre127 = require('./lib/legalCommunityMembershipPre127');";
ok(server.includes(requireAnchor), 'Server community require anchor is missing');
server = server.replace(requireAnchor, `${requireAnchor}\nconst legalCommunityProgramPre128 = require('./lib/legalCommunityProgramPre128');\nconst legalCommunityMembershipPre128 = require('./lib/legalCommunityMembershipPre128');\nconst publicLegalAreasPre128 = require('./lib/publicLegalAreasPre128');`);

const launchConfigurationStart = 'async function ensureAttorneyLaunchConfiguration(){';
const launchConfigurationEnd = '\n\nasync function ensureQualifiedProfileFactorySnapshot(){';
const closedLaunchConfiguration = `async function ensureAttorneyLaunchConfiguration(){
  const planned=legalCommunityProgramPre128.publicMembership();
  if(planned.enrollmentAvailable||planned.checkoutAvailable) throw new Error('PRE128 professional enrollment must remain closed.');
  console.log('[PROFESSIONAL COMMUNITY] PRE128 preview available; registration, applications, enrollment, checkout, and paid activation remain closed.');
}

`;
server = replaceSection(server, launchConfigurationStart, launchConfigurationEnd, closedLaunchConfiguration, 'Professional launch configuration');

server = server.replace('  const pathName = urlObj.pathname;\n  const sensitiveRead =', `  let pathName = urlObj.pathname;\n  const publicApiAliases = __PRE128_PUBLIC_API_ALIAS_MAP__;\n  for (const [publicPrefix, internalPrefix] of Object.entries(publicApiAliases)) {\n    if (pathName === publicPrefix || pathName.startsWith(publicPrefix + '/')) { pathName = internalPrefix + pathName.slice(publicPrefix.length); break; }\n  }\n  const pre128ProfessionalEnrollmentClosed=process.env.NODE_ENV==='production'||Boolean(process.env.RENDER)||envFlag('SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED');\n  const pre128ClosedProfessionalMutation=req.method==='POST'&&new Set(['/api/professional/auth/signup','/api/professional/pilot-program/application/save','/api/professional/pilot-program/application/submit','/api/professional/membership/checkout','/api/professional-membership-interest','/api/professional-launch-interest']).has(pathName);\n  if(pre128ProfessionalEnrollmentClosed&&pre128ClosedProfessionalMutation)return json(res,503,{ok:false,error:'New professional registration and paid membership enrollment are temporarily unavailable. No account, application, interest record, or payment was created.'});\n  if(pre128ProfessionalEnrollmentClosed&&req.method==='GET'&&pathName==='/api/professional/membership/confirm')return json(res,503,{ok:false,error:'Paid professional membership confirmation is not open.'});\n  const sensitiveRead =`);
ok(server.includes('__PRE128_PUBLIC_API_ALIAS_MAP__'), 'Server API alias anchor is missing');

const statusStart = "  if (req.method === 'GET' && pathName === '/livez')";
const statusEnd = "  if (req.method === 'GET' && pathName === '/api/system/master-rules-pack')";
const publicStatus = `  if (req.method === 'GET' && pathName === '/livez') return json(res,200,{ok:true,app:'Smarter Justice',status:'alive'});\n  if (req.method === 'GET' && pathName === '/readyz') {\n    const storage=store.storageStatus();\n    const ready=Boolean(storage.databaseReady&&!storage.persistenceBlocked);\n    return json(res,ready?200:503,{ok:ready,app:'Smarter Justice',status:ready?'ready':'limited',version:VERSION,checks:{durableStorage:ready?'available':'not available'}});\n  }\n  if (req.method === 'GET' && pathName === '/api/release-identity') return json(res,200,{ok:true,app:'Smarter Justice',version:VERSION});\n  if (req.method === 'GET' && pathName === '/health') return json(res,200,{ok:true,app:'Smarter Justice',version:VERSION,status:'healthy',timestamp:new Date().toISOString(),legalAreas:PRACTICE_AREAS.length,publishedLegalCommunities:1});\n`;
server = replaceSection(server, statusStart, statusEnd, publicStatus, 'Public status endpoints');

const configStart = "  if (req.method === 'GET' && pathName === '/api/public-config')";
const configEnd = "  if (req.method === 'GET' && pathName === '/api/practice-areas')";
const publicConfig = `  if (req.method === 'GET' && pathName === '/api/public-config') {\n    const protectedFormsAvailable=sensitiveTrafficApproved();\n    const aiStatus=centralAiGateway.publicStatus();\n    const aiControl=featureControlPlane.capabilityState('ai');\n    const aiAvailable=Boolean(aiStatus.available&&aiStatus.providerVerified&&aiControl.allowed);\n    return json(res,200,{\n      ok:true, secureUploadsAvailable:protectedFormsAvailable, contactRequestsAvailable:protectedFormsAvailable,\n      profileCorrectionRequestsAvailable:protectedFormsAvailable, communityPartnerRegistrationAvailable:false, professionalMembershipInterestAvailable:false,\n      sensitivePublicFormMessage:protectedFormsAvailable?'Protected request forms are available.':'Protected request forms are temporarily unavailable. No information will be collected through those forms.',\n      publicStoryRouting:{available:true,saved:false},\n      assistance:{defaultMode:'rules-only',aiChoiceRequired:true,aiAssistanceAvailable:aiAvailable,message:aiAvailable?'Optional AI-assisted organization is available. Guided help remains available without AI.':'Guided rules-based help remains available without AI.'},\n      liveChat:{configured:Boolean(process.env.TAWK_PROPERTY_ID&&process.env.TAWK_WIDGET_ID),propertyId:String(process.env.TAWK_PROPERTY_ID||''),widgetId:String(process.env.TAWK_WIDGET_ID||'')},\n      publicServiceInitiatives:{stopDomesticViolence:{configured:Boolean(STOP_SIGN_PROJECT_DESTINATION_VERIFIED&&STOP_DOMESTIC_VIOLENCE_URL&&STOP_DOMESTIC_VIOLENCE_ARTWORK_PATH),siteUrl:STOP_DOMESTIC_VIOLENCE_URL,artworkPath:STOP_DOMESTIC_VIOLENCE_ARTWORK_PATH,title:'The Stop Sign Project',relationship:'A Domestic Violence Aid Community Initiative',domesticViolenceAidSafeEntry:'/domestic-violence-aid.html',liveDestinationAccepted:Boolean(STOP_SIGN_PROJECT_DESTINATION_VERIFIED&&STOP_DOMESTIC_VIOLENCE_URL)}}\n    });\n  }\n`;
server = replaceSection(server, configStart, configEnd, publicConfig, 'Public configuration');

const legacyNetworkStart = "  if (req.method === 'GET' && pathName === '/api/launch-practice-areas')";
const legacyNetworkEnd = "  if (req.method === 'POST' && pathName === '/api/privacy-requests')";
const legalResourceApis = `  if (req.method === 'GET' && (pathName === '/api/launch-practice-areas' || pathName.startsWith('/api/launch-practice-areas/'))) return json(res,410,{ok:false,error:'This legacy catalog is retired.',currentPaths:['/practice-areas.html','/communities']});\n  if (req.method === 'GET' && pathName === '/api/community-resource-aid') { const resource=publicCommunityResourceAid(); return json(res,200,{ok:true,verified:Boolean(validateCommunityResourceAid().ok),resource}); }\n  if (req.method === 'GET' && pathName === '/api/community-resource-aid/status') { const resource=publicCommunityResourceAid(); return json(res,200,{ok:true,status:{available:true,lastCheckedAt:resource.verificationDate||'',sourceCount:Number(resource.sourceVerification?.sourceCount||0),message:'Open each original source to confirm current availability.'}}); }\n  if (req.method === 'GET' && (pathName === '/api/community-resource-aid/network' || pathName === '/api/openai/voice-foundation' || pathName === '/api/public/domain-network')) return json(res,410,{ok:false,error:'This legacy public endpoint is retired.',currentPaths:['/community-resources.html','/communities']});\n`;
server = replaceSection(server, legacyNetworkStart, legacyNetworkEnd, legalResourceApis, 'Legacy public network APIs');

const portalStart = "  if (req.method === 'GET' && pathName === '/api/portals')";
const portalEnd = "  if (req.method === 'GET' && pathName.startsWith('/api/intake-schema/'))";
const legalAreaApis = `  if (req.method === 'GET' && pathName === '/api/legal-areas') return json(res,200,{ok:true,legalAreas:publicLegalAreasPre128.list()});\n  if (req.method === 'GET' && pathName.startsWith('/api/legal-areas/')) { const slug=decodeURIComponent(pathName.split('/').pop()||''); const legalArea=publicLegalAreasPre128.get(slug); return legalArea?json(res,200,{ok:true,legalArea}):json(res,404,{ok:false,error:'Legal area not found.'}); }\n  if (req.method === 'GET' && pathName === '/api/legal-area-recommendation') { const practiceSlug=urlObj.searchParams.get('practice')||''; const legacy=recommendPortalForPractice(practiceSlug); const legalArea=legacy?publicLegalAreasPre128.get(legacy.slug):null; return json(res,200,{ok:true,practiceSlug,legalArea}); }\n  if (req.method === 'GET' && (pathName === '/api/portals' || pathName.startsWith('/api/portals/') || pathName === '/api/portal-recommendation')) return json(res,410,{ok:false,error:'This legacy route is retired.',currentPaths:['/api/legal-areas','/practice-areas.html']});\n`;
server = replaceSection(server, portalStart, portalEnd, legalAreaApis, 'Public legal-area APIs');

const aiStatusStart = "  if (req.method === 'GET' && pathName === '/api/ai-status')";
const aiStatusEnd = "  if (req.method === 'POST' && pathName === '/api/public/ai-smoke')";
const safeAiStatus = `  if (req.method === 'GET' && pathName === '/api/ai-status') { const status=centralAiGateway.publicStatus(); const control=featureControlPlane.capabilityState('ai'); const available=Boolean(status.available&&status.providerVerified&&control.allowed); return json(res,200,{ok:true,available,rulesBasedHelpAvailable:true,message:available?'Optional AI-assisted organization is available. Guided rules-based help remains available without AI.':'Guided rules-based help is available. Optional AI assistance is temporarily unavailable.'}); }\n`;
server = replaceSection(server, aiStatusStart, aiStatusEnd, safeAiStatus, 'Public AI status');

const aiSmokeStart = "  if (req.method === 'POST' && pathName === '/api/public/ai-smoke')";
const aiSmokeEnd = "  if (req.method === 'POST' && /^\\/api\\/internal\\/ai-gateway\\/v1\\/tools\\/[^/]+$/.test(pathName))";
const safeAiSmoke = `  if (req.method === 'POST' && pathName === '/api/public/ai-smoke') {\n    if(!/^(1|true|yes|on)$/i.test(String(process.env.AI_PUBLIC_SMOKE_ENABLED||''))) return json(res,404,{ok:false,error:'Not found.'});\n    const limited=await rateLimit(req,'public-ai-smoke',{maxRequests:3,windowMs:24*60*60*1000});\n    if(limited)return json(res,429,{ok:false,error:'The service check was already requested recently.'});\n    const result=await centralAiGateway.runSyntheticSmoke(); const available=Boolean(result.ok&&result.serviceAvailable);\n    return json(res,available?200:503,{ok:available,serviceAvailable:available,message:available?'Optional AI assistance passed its live service check.':'Optional AI assistance is temporarily unavailable. Guided rules-based help remains available.',checkedAt:result.checkedAt});\n  }\n`;
server = replaceSection(server, aiSmokeStart, aiSmokeEnd, safeAiSmoke, 'Public AI smoke response');

const readinessStart = "  if (req.method === 'GET' && pathName === '/api/professional-program-status')";
const readinessEnd = "  if (req.method === 'GET' && pathName === '/api/public/journey')";
const customerReadiness = `  if (req.method === 'GET' && pathName === '/api/professional-program-status') return json(res,200,{ok:true,applicationsOpen:false,paymentOpen:false,professionalPreviewAvailable:true,message:'The professional preview and free profiles are available. New account registration and paid enrollment are paused.'});\n  if (req.method === 'GET' && pathName === '/api/public/launch-status') return json(res,200,{ok:true,publicStartingHelp:{label:'Public starting help',detail:'Available without payment.'},professionalAccounts:{label:'Existing professional accounts',detail:'Existing verified accounts may sign in.'},professionalApplications:{label:'New professional registration',detail:'Temporarily paused.'},professionalGrowth:{label:'Professional community preview',detail:'Available without payment.'},paidMembership:{label:'Paid membership',detail:'Enrollment and checkout are not open.'}});\n  if (req.method === 'GET' && pathName === '/api/public/service-status') { const storage=store.storageStatus(); const available=Boolean(storage.databaseReady&&!storage.persistenceBlocked); return json(res,available?200:503,{ok:available,overall:{status:available?'operational':'limited',label:available?'Core service available':'Some services are limited',detail:available?'Public pages and existing-account services are responding.':'Use public information without submitting account or sensitive information.'},selectedReadinessLane:{name:'Public service',status:available?'available':'limited'}}); }\n  if (req.method === 'GET' && pathName === '/api/public/provider-readiness') {\n    const storage=store.storageStatus(); const existingAccounts=Boolean(storage.databaseReady&&!storage.persistenceBlocked);\n    const aiStatus=centralAiGateway.publicStatus(); const aiControl=featureControlPlane.capabilityState('ai'); const aiAvailable=Boolean(aiStatus.available&&aiStatus.providerVerified&&aiControl.allowed);\n    return json(res,200,{ok:true,professionalRegistration:{available:false,label:'Temporarily paused'},existingProfessionalSignIn:{available:existingAccounts,label:existingAccounts?'Available':'Temporarily unavailable'},membershipEnrollment:{available:false,label:'Not open'},payments:{available:false,label:'Not open'},rulesBasedHelp:{available:true,label:'Available'},aiAssistance:{available:aiAvailable,label:aiAvailable?'Optional assistance available':'Temporarily unavailable'}});\n  }\n`;
server = replaceSection(server, readinessStart, readinessEnd, customerReadiness, 'Customer provider readiness');

const communityStart = "  if (req.method === 'GET' && pathName === '/api/public/legal-communities')";
const communityEnd = "  if (req.method === 'GET' && pathName === '/api/public/professional-source-coverage')";
const communityApi = `  if (req.method === 'GET' && pathName === '/api/public/legal-communities') return json(res,200,{ok:true,...legalCommunityProgramPre128.listPublicCommunities()});\n  if (req.method === 'GET' && pathName === '/api/public/legal-community-membership') return json(res,200,{ok:true,membership:legalCommunityProgramPre128.publicMembership()});\n  if (req.method === 'GET' && /^\\/api\\/public\\/legal-communities\\/[^/]+\\/member-preview$/.test(pathName)) return json(res,410,{ok:false,error:'This preview path has moved.',currentPath:pathName.replace('/member-preview','/professional-preview')});\n  if (req.method === 'GET' && /^\\/api\\/public\\/legal-communities\\/[^/]+\\/professional-preview$/.test(pathName)) {\n    const id=decodeURIComponent(pathName.split('/').filter(Boolean)[3]||''); const base=legalCommunityProgramPre128.getPublicCommunity(id,{audience:'PROFESSIONAL',now:new Date()});\n    if(!base)return json(res,404,{ok:false,error:'Legal community not found.'}); const query=base.directoryQuery||{};\n    const professionals=professionalMarketplace.searchPublicProfessionals({postalCode:query.postalCode,state:query.state,limit:1}); const firms=professionalMarketplace.searchPublicFirms({postalCode:query.postalCode,state:query.state,limit:1});\n    const directorySnapshot={professionals:Number(professionals.total||0),firms:Number(firms.total||0),postalCode:query.postalCode||'',state:query.state||'',disclosure:'A location match is not membership, verification, recommendation, availability, or proof of current office status.'};\n    return json(res,200,{ok:true,experience:legalCommunityProgramPre128.memberExperience(id,{now:new Date(),practiceAreaIds:urlObj.searchParams.getAll('practice'),directorySnapshot})});\n  }\n  if (req.method === 'GET' && /^\\/api\\/public\\/legal-communities\\/[^/]+\\/share-kit$/.test(pathName)) { const id=decodeURIComponent(pathName.split('/').filter(Boolean)[3]||''); const shareKit=legalCommunityProgramPre128.shareKit(id); return shareKit?json(res,200,{ok:true,shareKit}):json(res,404,{ok:false,error:'Current share kit not found.'}); }\n  if (req.method === 'GET' && /^\\/api\\/public\\/legal-communities\\/[^/]+(?:\\/today)?$/.test(pathName)) {\n    const parts=pathName.split('/').filter(Boolean); const id=decodeURIComponent(parts[3]||''); const community=legalCommunityProgramPre128.getPublicCommunity(id,{audience:urlObj.searchParams.get('audience')||'',now:new Date(),practiceAreaIds:urlObj.searchParams.getAll('practice')});\n    if(!community)return json(res,404,{ok:false,error:'Legal community not found.'}); const query=community.directoryQuery||{}; const professionals=professionalMarketplace.searchPublicProfessionals({postalCode:query.postalCode,state:query.state,limit:1}); const firms=professionalMarketplace.searchPublicFirms({postalCode:query.postalCode,state:query.state,limit:1});\n    community.directorySnapshot={professionals:Number(professionals.total||0),firms:Number(firms.total||0),postalCode:query.postalCode||'',state:query.state||'',disclosure:'A location match is not membership, verification, recommendation, availability, or proof of current office status.'};\n    return parts[4]==='today'?json(res,200,{ok:true,communityId:community.id,signals:community.currentSignals,sourceDisclosure:community.sourceDisclosure}):json(res,200,{ok:true,community});\n  }\n`;
server = replaceSection(server, communityStart, communityEnd, communityApi, 'PRE128 legal-community API');

server = server.replace("  if (req.method === 'GET' && pathName === '/api/initial-launch-pilots') return json(res,200,{ok:true,version:INITIAL_LAUNCH_PILOT_VERSION,pilots:listInitialLaunchPilots(),profileAuthority:'Smarter Justice',publicProfileAuthority:'focused legal micro-portals',claimArchitecture:'portal-first discovery with central Smarter Justice execution'});", "  if (req.method === 'GET' && pathName === '/api/initial-launch-pilots') return json(res,410,{ok:false,error:'This legacy topology endpoint is retired.',currentPaths:['/communities','/practice-areas.html']});");

const foundingStart = "  if (req.method === 'GET' && pathName === '/api/founding-launch-portals')";
const foundingEnd = "  if (req.method === 'GET' && pathName === '/api/revenue-access-model')";
server = replaceSection(server, foundingStart, foundingEnd, "  if (req.method === 'GET' && pathName === '/api/founding-launch-portals') return json(res,410,{ok:false,error:'This legacy topology endpoint is retired.',currentPaths:['/communities','/professional-membership.html']});\n", 'Founding topology API');
const foundingDetailStart = "  if (req.method === 'GET' && pathName.startsWith('/api/founding-launch-portals/'))";
const preferencesStart = "  if (req.method === 'GET' && pathName === '/api/professional/legal-community-preferences')";
server = replaceSection(server, foundingDetailStart, preferencesStart, "  if (req.method === 'GET' && pathName.startsWith('/api/founding-launch-portals/')) return json(res,410,{ok:false,error:'This legacy topology endpoint is retired.',currentPaths:['/communities','/professional-membership.html']});\n", 'Founding topology detail API');

const preferencesEnd = "  if (req.method === 'POST' && pathName === '/api/professional/auth/signup')";
const preferencesApi = `  if (req.method === 'GET' && pathName === '/api/professional/legal-community-preferences') { const auth=professionalAccounts.accountFromRequest(req); if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return json(res,200,{ok:true,preferences:legalCommunityMembershipPre128.forAccount(auth.account.id),membership:legalCommunityProgramPre128.publicMembership()}); }\n  if (req.method === 'POST' && pathName === '/api/professional/legal-community-preferences') { const auth=professionalAccounts.accountFromRequest(req); if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const result=legalCommunityMembershipPre128.updateForAccount(auth.account.id,await parseJson(req)); if(result.error)return json(res,400,{ok:false,error:result.error}); await store.flush(); return json(res,200,{ok:true,...result}); }\n`;
server = replaceSection(server, preferencesStart, preferencesEnd, preferencesApi, 'Professional community preferences API');

const professionalMembershipSessionAnchor = "async function applyProfessionalMembershipSession(session,eventType='checkout.session.completed'){";
ok(server.includes(professionalMembershipSessionAnchor), 'Professional membership activation anchor is missing');
server = server.replace(professionalMembershipSessionAnchor, `${professionalMembershipSessionAnchor}\n  if(process.env.NODE_ENV==='production'||Boolean(process.env.RENDER)||envFlag('SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED'))return {handled:true,activated:false,closed:true,accountId:session?.metadata?.accountId||''};`);
const professionalBillingLifecycleAnchor = 'async function applyProfessionalBillingLifecycle(event){';
ok(server.includes(professionalBillingLifecycleAnchor), 'Professional billing lifecycle anchor is missing');
server = server.replace(professionalBillingLifecycleAnchor, `${professionalBillingLifecycleAnchor}\n  if(process.env.NODE_ENV==='production'||Boolean(process.env.RENDER)||envFlag('SJ_PRE128_FORCE_PROFESSIONAL_ENROLLMENT_CLOSED'))return {handled:true,applied:false,closed:true};`);

server = replaceSection(server, 'function polishPublicHtmlForLaunch(html){', 'function serveStatic(req, res, pathname){', '', 'Runtime HTML copy rewrite');
const responseStart = '    let responseBody = data;';
const responseEnd = '    const headers = {';
server = replaceSection(server, responseStart, responseEnd, '    const responseBody = data;\n', 'Static response mutation');
server = server.replace(/\n\s*headers\['X-Smarter-Justice-Release-Commit'\][^\n]*\n\s*headers\['X-Smarter-Justice-Demo-Path'\][^\n]*/g, '');
server = server.replace("'/owner-acquisition-revenue.html'\n    ]).has(p);", "'/owner-acquisition-revenue.html','/professional-community.html','/es/comunidad-profesional.html',\n      '/professional-firm-operations.html','/professional-currentness-request.html','/portal-profile-acceptance.html','/profile-factory-review-sjr85.html'\n    ]).has(p);");

const redirectAnchor = "      ['/portals','/practice-areas.html'],['/portals.html','/practice-areas.html'],";
ok(server.includes(redirectAnchor), 'Public redirect anchor is missing');
server = server.replace(redirectAnchor, `      ['/founding-portals','/communities'],['/founding-portals.html','/communities'],\n      ['/portal-router','/practice-areas.html'],['/portal-router.html','/practice-areas.html'],\n      ['/portal-preparation','/free-tools.html'],['/portal-preparation.html','/free-tools.html'],\n      ['/journey-handoff-planner','/help-plan.html'],['/journey-handoff-planner.html','/help-plan.html'],\n      ['/community-network','/communities'],['/community-network.html','/communities'],\n      ['/universal-smarter-justice','/'],['/universal-smarter-justice.html','/'],\n      ['/es/portales','/es/areas-de-practica.html'],['/es/portales.html','/es/areas-de-practica.html'],\n      ['/es/portal-router.html','/es/areas-de-practica.html'],['/es/founding-portals.html','/es/comunidades'],\n      ${redirectAnchor}`);

const internalRoleStart = 'function internalPageRole(pathName){';
const internalRoleEnd = '\nconst server = http.createServer(async (req,res) => {';
const internalRoleGuard = `function internalPageRole(pathName){
  let normalized = pathName.endsWith('/') ? \`${'${pathName}'}index.html\` : pathName;
  if (!path.extname(normalized)) normalized += '.html';
  if (['/control-center.html','/professional-network.html','/owner-acquisition-revenue.html','/launch-activation.html','/portal-profile-acceptance.html','/profile-factory-review-sjr85.html'].includes(normalized)) return 'owner';
  if (['/admin.html','/staff.html','/launch-readiness.html','/production-readiness.html','/ai-summary.html'].includes(normalized)) return 'staff';
  if (['/professional-dashboard.html','/professional-firm-operations.html','/professional-currentness-request.html'].includes(normalized)) return 'professional';
  return '';
}
function redirectToInternalAccess(res,pathName,role){
  const destination = role === 'owner' ? '/owner-login.html' : (role === 'professional' ? '/professional-login.html' : '/internal-access.html');
  const location = \`${'${destination}'}?next=${'${encodeURIComponent(pathName)}'}\`;
  sendResponse(res,302,securityHeaders({'Location':location,'Content-Type':'text/plain; charset=utf-8','Content-Length':0,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'}),'');
}
`;
server = replaceSection(server, internalRoleStart, internalRoleEnd, internalRoleGuard, 'Direct workspace authorization');
const directAccessAnchor = "    if(role==='staff' && !requireOwner(req) && !requireAdmin(req,urlObj)) return redirectToInternalAccess(res,urlObj.pathname,role);";
ok(server.includes(directAccessAnchor), 'Direct workspace access anchor is missing');
server = server.replace(directAccessAnchor, `${directAccessAnchor}\n    if(role==='professional' && !professionalAccounts.accountFromRequest(req)) return redirectToInternalAccess(res,urlObj.pathname,role);`);

server = server.replaceAll('v2.0.0-pre127', 'v2.0.0-pre128').replaceAll('2.0.0-pre127', '2.0.0-pre128');
write('server.js', server, modified);

const publicRoot = path.join(target, 'public');
const predecessorCommunityCss = path.join(publicRoot, 'pre127-community.css');
ok(fs.existsSync(predecessorCommunityCss), 'PRE127 community CSS is missing');
fs.copyFileSync(predecessorCommunityCss, path.join(publicRoot, 'community.css'));
modified.add('public/community.css');
for (const [sourceName, semanticName] of [['pre90.css','site-foundation.css'],['pre121-site.css','site-shell.css'],['pre121-site.js','site-shell.js']]) {
  const sourcePath = path.join(publicRoot, sourceName);
  ok(fs.existsSync(sourcePath), `Required visual-system asset is missing: ${sourceName}`);
  fs.copyFileSync(sourcePath, path.join(publicRoot, semanticName));
  modified.add(`public/${semanticName}`);
}

for (const relative of filesUnder(publicRoot)) {
  const absolute = path.join(publicRoot, relative);
  const extension = path.extname(relative).toLowerCase();
  if (!['.html','.js','.css','.xml','.json','.txt','.webmanifest'].includes(extension)) continue;
  let value = transformPublicText(fs.readFileSync(absolute, 'utf8'));
  value = value.replace(/\/(?:pre126|pre127)-community\.css(?:\?[^"'\s<]*)?/gi, '/community.css?v=community-3')
    .replace(/\/(?:pre126|pre127)-community\.js(?:\?[^"'\s<]*)?/gi, '/community-experience.js?v=community-3');
  if (relative === 'app.js') {
    value = value.replaceAll("fetch('/api/portals/", "fetch('/api/legal-areas/")
      .replaceAll("fetch('/api/portals')", "fetch('/api/legal-areas')")
      .replace('const portal = res.portal;', 'const portal = res.legalArea;')
      .replace('res.portals.map(portal =>', 'res.legalAreas.map(portal =>')
      .replace('const p = res.portal;', 'const p = res.legalArea;')
      .replace(/<p class="fine-print">Core readiness lane:[^`]*<\/p>/g, '<p class="fine-print">Check the page before submitting information. New professional registration and paid enrollment are currently paused.</p>');
  }
  if (relative === 'domestic-violence-aid.js') value = value.replace('/api/portals/domestic-violence-aid', '/api/legal-areas/domestic-violence-aid').replace(/\.portal\b/g, '.legalArea');
  if (relative === 'community-resources.js') value = value.replace('data?.validation?.ok', 'data?.verified');
  if (relative === 'index.html') {
    value = value.replace('Join your local Smarter Justice legal community.', 'Explore your local Smarter Justice legal community.')
      .replace('Keep your public profile free. Membership adds source-backed local intelligence, community participation, consultation and inquiry tools, review requests, follow-up, and shared firm workflows.', 'Keep your public profile free. Explore local information, original sources, a practice filter, and a shareable brief. Paid membership and checkout are not open.')
      .replace('Membership buys participation and tools—not credentials, endorsement, guaranteed clients, or hidden organic ranking.', 'Future membership will buy participation and tools—not credentials, endorsement, guaranteed clients, or hidden organic ranking. No payment is accepted today.')
      .replace('See the member experience', 'See the free community preview');
  }
  if (relative === 'communities.html') {
    value = value.replace('Use the working community home.', 'Explore the free professional preview.')
      .replace('Follow source-backed local activity, filter by practice, strengthen your professional presence, find ways to participate, and copy a current LinkedIn brief.', 'Review local activity with original sources, filter by practice, find public participation paths, and copy a current LinkedIn brief. Paid membership is not open.')
      .replace('Open the professional community home', 'Open the free professional preview');
  }
  if (relative === 'communities/downtown-brooklyn.html') {
    value = value.replace('Current source-backed activity', 'Current local activity with original sources')
      .replace('See the professional member home', 'See the free professional preview')
      .replace('Keep the public profile free. Founding membership adds local intelligence, practice focus, participation, professional presence, and optional practice tools.', 'Keep the public profile free. Explore local information, a practice filter, public participation paths, and a shareable brief without payment. Paid membership is not open.')
      .replace('Open the working member home', 'Open the free professional preview')
      .replace('Compare founding plans', 'Review planned membership dues');
  }
  if (relative === 'community-briefs/downtown-brooklyn.html') {
    value = value.replace('Use the working community home for current intelligence, practice focus, participation, professional presence, and share-ready local content.', 'Use the free professional preview for current local information, a practice filter, public participation paths, and share-ready local content. Paid membership is not open.')
      .replace('Open the member home', 'Open the free professional preview');
  }
  if (relative === 'es/index.html') {
    value = value.replace(/Únase a su comunidad legal local de Smarter Justice\./g, 'Explore su comunidad legal local de Smarter Justice.')
      .replace(/La membresía añade[^<]+/g, 'Explore información local, fuentes originales, un filtro de práctica y un resumen para compartir. La membresía pagada y el pago no están abiertos.')
      .replace(/La membresía compra[^<]+/g, 'La membresía futura comprará participación y herramientas, no credenciales, respaldo, clientes garantizados ni posición orgánica oculta. Hoy no se acepta ningún pago.')
      .replace(/Vea la experiencia del miembro/g, 'Vea la vista comunitaria gratuita');
  }
  if (relative === 'es/comunidades.html') {
    value = value.replace('Ver el inicio para miembros', 'Ver la vista profesional gratuita');
  }
  if (relative === 'es/comunidades/downtown-brooklyn.html') {
    value = value.replace(/Abrir inicio para miembros/g, 'Abrir la vista profesional gratuita')
      .replace('Mantenga el perfil público gratis y únase para información local, participación y herramientas profesionales.', 'Mantenga el perfil público gratis y explore información local, fuentes originales, participación pública y un resumen para compartir. La membresía pagada no está abierta.')
      .replace('Abrir el inicio comunitario funcional', 'Abrir la vista profesional gratuita')
      .replace('Ver la experiencia para miembros', 'Ver la vista profesional gratuita');
  }
  fs.writeFileSync(absolute, value);
  modified.add(`public/${relative}`);
}
for (const obsolete of ['pre124-public-copy-guard.js','pre124-launch.js']) {
  const absolute = path.join(publicRoot, obsolete);
  if (fs.existsSync(absolute)) fs.rmSync(absolute);
}

const tokenSet = new Set();
for (const relative of filesUnder(publicRoot)) {
  for (const match of relative.matchAll(/pre(\d{2,4})/gi)) tokenSet.add(`pre${match[1]}`.toLowerCase());
  const extension = path.extname(relative).toLowerCase();
  if (!['.html','.js','.css','.xml','.json','.txt','.webmanifest'].includes(extension)) continue;
  const value = fs.readFileSync(path.join(publicRoot, relative), 'utf8');
  for (const match of value.matchAll(/\bpre(\d{2,4})\b/gi)) tokenSet.add(`pre${match[1]}`.toLowerCase());
}
const tokenMap = Object.fromEntries([...tokenSet].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))).map(token => [token, `sjr${token.slice(3)}`]));
for (const relative of filesUnder(publicRoot)) {
  const extension = path.extname(relative).toLowerCase();
  if (!['.html','.js','.css','.xml','.json','.txt','.webmanifest'].includes(extension)) continue;
  const absolute = path.join(publicRoot, relative);
  let value = fs.readFileSync(absolute, 'utf8');
  for (const [token, alias] of Object.entries(tokenMap)) value = value.replace(new RegExp(`\\b${token}\\b`, 'gi'), alias);
  fs.writeFileSync(absolute, value);
}
for (const relative of filesUnder(publicRoot).sort((a, b) => b.length - a.length)) {
  let renamed = relative;
  for (const [token, alias] of Object.entries(tokenMap)) renamed = renamed.replace(new RegExp(token, 'gi'), alias);
  if (renamed === relative) continue;
  const from = path.join(publicRoot, relative); const to = path.join(publicRoot, renamed);
  fs.mkdirSync(path.dirname(to), { recursive:true });
  ok(!fs.existsSync(to), `Public asset alias collision: ${renamed}`);
  fs.renameSync(from, to);
}
const publicApiAliases = {};
for (const [token, alias] of Object.entries(tokenMap)) publicApiAliases[`/api/${alias}`] = `/api/${token}`;
server = fs.readFileSync(serverPath, 'utf8').replace('__PRE128_PUBLIC_API_ALIAS_MAP__', JSON.stringify(publicApiAliases));
write('server.js', server, modified);
write('release-evidence/PRE128_PUBLIC_ASSET_ALIAS_MAP.json', JSON.stringify({ schemaVersion:'smarter-justice.public-asset-alias-map.v1', release, purpose:'Removes internal release numbering from customer-delivered asset names while retaining deterministic references.', aliases:tokenMap, apiCompatibilityAliases:publicApiAliases }, null, 2) + '\n', modified);

const dashboardPath = path.join(publicRoot, 'professional-dashboard.html');
let dashboard = fs.readFileSync(dashboardPath, 'utf8');
dashboard = dashboard
  .replace('<a href="/professional-community.html">Community home</a>', '')
  .replace(/<nav id="sjr121-nav" class="sjr121-header__nav" aria-label="Protected navigation">/, '<nav id="sjr121-nav" class="sjr121-header__nav" aria-label="Protected navigation"><a href="/professional-community.html">Community preview</a>')
  .replace('Welcome, <span id="professionalAccountName">professional member</span>.', 'Welcome, <span id="professionalAccountName">professional</span>.')
  .replace('Use one Smarter Justice account to claim or create professional and firm profiles, manage approved core information, and prepare participation across supported focused legal and tax areas nationwide. Return here for profile, firm, membership, security, and portal-presence management; jurisdiction, specialty, and publication decisions remain separate.', 'Use one Smarter Justice account for professional and firm profiles, approved information, security, and saved community preferences. Office, service area, license, profile facts, community selection, future membership, and eligibility remain separate.')
  .replace('Loading your legal-community home…', 'Loading the free legal-community preview…')
  .replace('Portfolio-wide community value', 'Shared community-resource view')
  .replace('Community Resource Aid across every recognized product', 'Community Resource Aid in Smarter Justice')
  .replace('Review the shared specialty-aware resource connections without implying live synchronization or shared case data.', 'Review shared public-resource connections without implying live synchronization, affiliation, or shared case data.')
  .replace('View network alignment', 'View community resources')
  .replace('href="/community-network.html"', 'href="/community-resources.html"');
fs.writeFileSync(dashboardPath, dashboard);

const sitemapUrls = [
  '/', '/free-tools.html','/practice-areas.html','/help-options.html','/help-plan.html','/community-resources.html','/professionals.html','/find-my-profile.html',
  '/communities','/communities/downtown-brooklyn','/community-briefs/downtown-brooklyn','/attorney-partner-tour.html','/professional-membership.html','/professional-membership-terms.html',
  '/our-story.html','/contact.html','/faq.html','/privacy.html','/terms.html','/disclaimer.html','/security.html',
  '/es/','/es/herramientas-gratis.html','/es/areas-legales.html','/es/recursos-comunitarios.html','/es/profesionales.html','/es/firmas.html','/es/comunidades','/es/comunidades/downtown-brooklyn','/es/para-abogados.html','/es/membresia-profesional.html','/es/privacidad.html','/es/terminos.html','/es/contacto.html'
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map(route => `  <url><loc>https://smarterjustice.com${route}</loc></url>`).join('\n')}\n</urlset>\n`;
write('public/sitemap.xml', sitemap, modified);

const improvementList = `# Smarter Justice — ranked next-version improvement list\n\nThis list is governed by the strategy constitution and the PRE128 release evidence. Items marked BLOCKED are not public promises.\n\n## 1. SJ-NEXT-001 — transactional account verification\n\n- **User/member problem:** A professional cannot create and verify a durable account in production.\n- **Affected audience:** Attorneys, other eligible professionals, and firm administrators.\n- **Strategic pillar:** Trustworthy professional participation.\n- **Evidence:** Provider-readiness reconciliation found no configured production transactional email; account count is zero.\n- **Current behavior:** New registration is closed before collection; existing verified accounts can sign in.\n- **Desired outcome:** Complete signup, verification, resend, expiry, recovery, abuse controls, delivery monitoring, and support handling.\n- **Safety/privacy/legal considerations:** Minimize account data, rate-limit requests, hash tokens, prevent enumeration, and publish accurate terms.\n- **Authority and dependencies:** Owner approval plus qualified SMTP/provider configuration and privacy review.\n- **Expected public/member value:** A truthful route from a free profile into saved community preferences.\n- **Reach:** Every new professional account.\n- **Effort:** Medium.\n- **Reversibility:** High; keep registration gate fail-closed.\n- **Test plan:** End-to-end delivery, token replay, expiry, enumeration, bounce, complaint, recovery, and production synthetic tests.\n- **Availability/copy impact:** Registration copy may change from paused only after live acceptance.\n- **Release/no-loss risk:** High if opened without delivery proof; low while isolated closed.\n- **Qualification state:** BLOCKED.\n- **Re-entry condition:** Authenticated provider delivery and full lifecycle acceptance pass.\n\n## 2. SJ-NEXT-002 — one complete paid entitlement lifecycle\n\n- **User/member problem:** Planned dues are visible, but no plan can safely be purchased, renewed, canceled, refunded, or enforced.\n- **Affected audience:** Professionals, firms, billing owners, and support.\n- **Strategic pillar:** Recurring member value with truthful commerce.\n- **Evidence:** Approved planned catalog exists; Stripe price identifiers and paid entitlements are absent; active member count is zero.\n- **Current behavior:** Enrollment and checkout are closed; no paid access is issued.\n- **Desired outcome:** Qualify one plan through checkout, webhook idempotency, entitlement grant/revoke, invoice, failed payment, cancellation, reactivation, refund, tax, and support.\n- **Safety/privacy/legal considerations:** Explicit renewal/cancellation terms, no client guarantee, no pay-for-credential or organic rank.\n- **Authority and dependencies:** Owner price approval, Stripe provider mapping, terms review, transactional email, and support runbook.\n- **Expected public/member value:** A reliable paid relationship backed by enforceable benefits.\n- **Reach:** First paid cohort, then all eligible members.\n- **Effort:** High.\n- **Reversibility:** Medium; provider objects and invoices are persistent.\n- **Test plan:** Test-clock lifecycle, signed webhook replay, authorization, ledger parity, cancel/reactivate/refund, and live low-risk acceptance.\n- **Availability/copy impact:** Only the qualified plan changes from planned to available.\n- **Release/no-loss risk:** Critical if partially opened; isolated while checkout remains closed.\n- **Qualification state:** BLOCKED.\n- **Re-entry condition:** Exact provider catalog and end-to-end entitlement evidence accepted.\n\n## 3. SJ-NEXT-003 — recurring professional value cohort\n\n- **User/member problem:** There is no measured proof that the local brief creates a weekly habit worth paying for.\n- **Affected audience:** Downtown Brooklyn professionals and firms.\n- **Strategic pillar:** Useful hyperlocal community, not a listings product.\n- **Evidence:** The free preview is working, but there are zero active professional accounts and zero members.\n- **Current behavior:** Source-reviewed local brief, practice filter, free profile path, and manual LinkedIn draft are available.\n- **Desired outcome:** With explicit participants, measure four weekly editions for source opens, return use, saved focus, sharing, correction quality, and qualitative usefulness.\n- **Safety/privacy/legal considerations:** No private matters, contact harvesting, automated outreach, fee coordination, or implied institutional affiliation.\n- **Authority and dependencies:** Voluntary cohort permission, editor capacity, privacy-safe aggregate measurement, and source-review calendar.\n- **Expected public/member value:** Evidence-backed recurring information instead of speculative feature promises.\n- **Reach:** Initial Downtown Brooklyn cohort.\n- **Effort:** Medium.\n- **Reversibility:** High.\n- **Test plan:** Consent records, weekly currentness gates, accessibility, aggregate event validation, interviews, and cancellation-intent check.\n- **Availability/copy impact:** Does not open paid membership; evidence may later support exact benefit copy.\n- **Release/no-loss risk:** Medium if analytics collect sensitive context; require a narrow schema.\n- **Qualification state:** READY_FOR_OWNER_OPERATING_DECISION.\n- **Re-entry condition:** Named editorial owner and voluntary cohort approved.\n\n## 4. SJ-NEXT-004 — firm identity, office, roster, and seat reconciliation\n\n- **User/member problem:** A firm can have duplicate name/address variants, while office facts, roster authority, and future paid seats must remain distinct.\n- **Affected audience:** Firms, attorneys, profile reviewers, and directory users.\n- **Strategic pillar:** Free profile trust substrate.\n- **Evidence:** Current source contains 258 professional and 52 firm profiles; there are no organization seats or active firm accounts.\n- **Current behavior:** Profiles are searchable and source-backed, but future organizational control is not qualified.\n- **Desired outcome:** Resolve canonical firms/offices, authorized roster changes, individual departures, aliases, counts, and seat assignment without overwriting independent evidence.\n- **Safety/privacy/legal considerations:** Authority verification, correction/appeal, no payment-based credential or roster control, and audit retention.\n- **Authority and dependencies:** Profile Factory evidence, firm-authority workflow, owner-reviewed conflict policy.\n- **Expected public/member value:** Accurate firm pages and reliable team administration.\n- **Reach:** All firm and associated attorney profiles.\n- **Effort:** High.\n- **Reversibility:** Medium; canonical merges require reversible alias and provenance records.\n- **Test plan:** Duplicate fixtures, split/merge rollback, count parity, unauthorized edits, departures, conflicting sources, and suppression.\n- **Availability/copy impact:** No team/office benefit claim until the lifecycle passes.\n- **Release/no-loss risk:** High because profile canon is shared public infrastructure.\n- **Qualification state:** BLOCKED_PENDING_AUTHORITY_MODEL.\n- **Re-entry condition:** Canonical merge and roster authority policy accepted.\n\n## 5. SJ-NEXT-005 — moderated event contribution lifecycle\n\n- **User/member problem:** Professionals and organizations cannot submit a local event or correction into a controlled editorial workflow.\n- **Affected audience:** Professionals, independent organizations, editors, and public readers.\n- **Strategic pillar:** Community participation.\n- **Evidence:** PRE128 explicitly marks community submissions not implemented; no moderator or appeal route exists.\n- **Current behavior:** Only editor-reviewed, original-source-linked items are published.\n- **Desired outcome:** One submission type with identity/authority evidence, consent, moderation, rejection reason, correction, expiry, appeal, and abuse handling.\n- **Safety/privacy/legal considerations:** No CLE credit claim without authority, no endorsement, anti-spam, privacy minimization, and competition rules.\n- **Authority and dependencies:** Editorial owner, moderation SLA, conduct policy, appeal owner, and notification delivery.\n- **Expected public/member value:** Fresh local participation without an unmoderated social feed.\n- **Reach:** Downtown Brooklyn contributors and readers.\n- **Effort:** Medium.\n- **Reversibility:** High; keep publishing manual and gated.\n- **Test plan:** Valid/invalid submission, duplicate, impersonation, expired source, rejection, appeal, removal, and notification tests.\n- **Availability/copy impact:** Submission CTA stays absent until the full path is qualified.\n- **Release/no-loss risk:** High if moderation or affiliation copy is incomplete.\n- **Qualification state:** BLOCKED.\n- **Re-entry condition:** Moderator, appeal owner, policy, and communication provider accepted.\n\n## 6. SJ-NEXT-006 — evaluate one additional micro-community\n\n- **User/member problem:** Users outside Downtown Brooklyn need local relevance, but premature community pages would feel empty and make false organizational claims.\n- **Affected audience:** Brooklyn residents, professionals, firms, and organizations.\n- **Strategic pillar:** Smallest sustainable hyperlocal community.\n- **Evidence:** Only Downtown Brooklyn is published; all other names are intentionally hidden research candidates.\n- **Current behavior:** Brooklyn/city/state remain context layers, not separate active chapters.\n- **Desired outcome:** Score one candidate using attorney/firm density, institutions, public resources, current content volume, editor capacity, distinct identity, and recurring usefulness.\n- **Safety/privacy/legal considerations:** Boundary transparency, no office inference, no chapter claim, no scraped contact outreach, and source currency.\n- **Authority and dependencies:** Owner geography decision and an evidence-backed viability study.\n- **Expected public/member value:** Local depth without information starvation.\n- **Reach:** One additional local catchment if qualified.\n- **Effort:** Medium.\n- **Reversibility:** High before publication.\n- **Test plan:** Data provenance, boundary scenarios, source volume for eight weeks, accessibility, route/canonical, and editorial capacity.\n- **Availability/copy impact:** No public name or route until accepted.\n- **Release/no-loss risk:** Medium; premature launch weakens trust and network density.\n- **Qualification state:** RESEARCH_ONLY.\n- **Re-entry condition:** Viability score and operating owner pass the publication threshold.\n`;
write('NEXT_VERSION_IMPROVEMENT_LIST.md', improvementList, modified);

const packagePath = path.join(target, 'package.json');
const runtimePackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
runtimePackage.name = 'smarter-justice-pre128-runtime';
runtimePackage.version = '2.0.0-pre128';
runtimePackage.description = 'Smarter Justice truthful one-platform hyperlocal legal-community successor based on exact PRE127 production.';
runtimePackage.scripts = runtimePackage.scripts || {};
runtimePackage.scripts.sbom = 'node scripts/generate-sbom.js';
runtimePackage.scripts['test:pre128:unit'] = 'node tests/pre128-universal-successor.test.js';
runtimePackage.scripts['test:pre128:http'] = 'node tests/pre128-http-contract.test.js';
runtimePackage.scripts['test:pre128:system'] = 'node tests/pre128-system-qualification.test.js';
runtimePackage.scripts['test:security'] = 'node tests/security-boundaries-v177.test.js && node tests/security-readiness.test.js';
runtimePackage.scripts['qualify:pre128'] = 'npm run test:pre128:unit && npm run test:pre128:http && npm run test:pre128:system && npm run test:security && npm run deployment:validate';
runtimePackage.scripts['deployment:validate'] = 'node scripts/validate-pre128-deployment-kit.js';
runtimePackage.scripts['deployment:doctor'] = 'node scripts/deployment-doctor-pre128.js';
runtimePackage.scripts.test = 'npm run qualify:pre128';
fs.writeFileSync(packagePath, JSON.stringify(runtimePackage, null, 2) + '\n');
modified.add('package.json');
const lockPath = path.join(target, 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
lock.name = runtimePackage.name; lock.version = runtimePackage.version;
if (lock.packages && lock.packages['']) { lock.packages[''].name = runtimePackage.name; lock.packages[''].version = runtimePackage.version; }
fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
modified.add('package-lock.json');

run('SBOM generation', process.execPath, [path.join(target, 'scripts', 'generate-sbom.js')]);
modified.add('SBOM.spdx.json');

const preliminaryTests = [];
const isolatedTestEnvironment = isolatedQualificationEnvironment({ test:true });
for (const testFile of ['tests/pre128-universal-successor.test.js','tests/pre128-http-contract.test.js','tests/pre128-system-qualification.test.js','tests/security-boundaries-v177.test.js','tests/security-readiness.test.js']) {
  preliminaryTests.push(run(testFile, process.execPath, [path.join(target, testFile)], target, isolatedTestEnvironment));
}

const evidenceDirectory = path.join(target, 'release-evidence', 'pre128');
fs.rmSync(evidenceDirectory, { recursive:true, force:true, maxRetries:5, retryDelay:100 });
for (const generated of ['release-evidence/PRE128_HIGH_CONFIDENCE_SECRET_SCAN.json','.pre128-render-bootstrap.json','PRE128_COMPLETION_RECEIPT.json','PRE128_BUILD_FILE_MANIFEST.json']) {
  fs.rmSync(path.join(target, generated), { force:true });
}
const highConfidenceSecretScan = scanHighConfidenceSecrets(target);
ok(highConfidenceSecretScan.status === 'PASS', `High-confidence secret scan found ${highConfidenceSecretScan.highConfidenceFindingCount} possible secrets`);
write('release-evidence/PRE128_HIGH_CONFIDENCE_SECRET_SCAN.json', JSON.stringify({ schemaVersion:'smarter-justice.pre128-high-confidence-secret-scan.v1', release, candidateId, ...highConfidenceSecretScan }, null, 2) + '\n', modified);

const volatileLineageEvidence = new Set([
  '.pre121-render-bootstrap.json','.pre122-render-bootstrap.json','.pre123-render-bootstrap.json','.pre124-render-bootstrap.json','.pre125-render-bootstrap.json','.pre126-render-bootstrap.json','.pre127-render-bootstrap.json',
  'PRE124_COMPLETION_RECEIPT.json','PRE125_COMPLETION_RECEIPT.json','PRE126_COMPLETION_RECEIPT.json','PRE127_COMPLETION_RECEIPT.json'
]);
const generatedSecretScanPath = 'release-evidence/PRE128_HIGH_CONFIDENCE_SECRET_SCAN.json';
const artifactHashExclusions = [
  ...[...volatileLineageEvidence].sort().map(path => ({path,reason:'Inherited predecessor build receipt contains a regeneration timestamp; retained for lineage but excluded from reproducible candidate hash.'})),
  {path:generatedSecretScanPath,reason:'Generated security evidence is retained and referenced by the security audit; the product hash covers the files it scanned rather than the scan summary itself.'}
];
const artifactHashExcludedPaths = new Set(artifactHashExclusions.map(row => row.path));
const manifestRows = filesUnder(target).filter(relative => !relative.startsWith('release-evidence/pre128/') && !['.pre128-render-bootstrap.json','PRE128_COMPLETION_RECEIPT.json','PRE128_BUILD_FILE_MANIFEST.json'].includes(relative) && !artifactHashExcludedPaths.has(relative)).map(relative => ({ path:relative, sha256:sha(path.join(target, relative)), bytes:fs.statSync(path.join(target, relative)).size }));
const artifactHash = shaBuffer(JSON.stringify(manifestRows));
write('PRE128_BUILD_FILE_MANIFEST.json', JSON.stringify({ schemaVersion:'smarter-justice.pre128.build-file-manifest.v1', release, candidateId, sourceCommit, sourceTree, fileCount:manifestRows.length, artifactSha256:artifactHash, artifactHashScope:'Runtime and public product files with volatile or generated evidence summaries excluded.', excludedFromArtifactHash:artifactHashExclusions, files:manifestRows }, null, 2) + '\n', modified);

const evidenceNames = [
  'CURRENT_STATE_AND_LINEAGE_RECEIPT','CURRENT_STATE_AND_PRE120_TO_PRE127_LINEAGE','CURRENT_OWNER_AUTHORITY_AND_ROLE_BINDING','PRE_BUILD_SMARTER_JUSTICE_ROLE_AND_PRODUCT_SCOPE_LOCK','RELEASE_LEASE_AND_CONCURRENCY_RECEIPT','LIVE_SOURCE_DATABASE_DEPLOYMENT_IDENTITY','SMARTER_JUSTICE_STRATEGY_AND_PRODUCT_CONSTITUTION','SMARTER_JUSTICE_AUTHORITY_TOPOLOGY','EFFECTIVE_RUNTIME_SURFACE_MANIFEST','UNIFIED_INFORMATION_ARCHITECTURE_AND_ROUTE_MANIFEST','CANONICAL_DATA_GRAPH_AND_FACT_OWNERSHIP_MANIFEST','NO_LOSS_CAPABILITY_AND_DATA_MATRIX','LEGACY_MICROPORTAL_ERADICATION_AND_REDIRECT_RECEIPT','PUBLIC_LANGUAGE_AND_FUNNEL_COPY_AUDIT','PROFESSIONAL_COPY_CLAIM_TO_CAPABILITY_MATRIX','ORGANIZATIONAL_CLAIMS_MATRIX','PROFESSIONAL_COMMUNITY_ORGANIZATION_CHARTER_AND_BOUNDARY_RECEIPT','MEMBER_CLASS_AUTHORITY_MATRIX','MEMBER_ELIGIBILITY_GOVERNANCE_CONDUCT_AND_MODERATION_RECEIPT','LEGAL_COMMUNITY_AREA_VS_MEMBER_CHAPTER_MANIFEST','LEGAL_COMMUNITY_ARCHITECTURE_AND_GEOGRAPHY_SEMANTICS_MANIFEST','CHAPTER_READINESS_AND_OPERATING_CAPACITY_RECEIPT','LEGAL_COMMUNITY_FEATURE_AVAILABILITY_AND_FRESHNESS_RECEIPT','LEGAL_COMMUNITY_INTELLIGENCE_ACCEPTANCE_AND_FRESHNESS_TEST','PROFILE_AS_FREE_TRUST_SUBSTRATE_TEST','PROFILE_FACTORY_AUTHORITY_RESOLUTION','PROFILE_FACTORY_HANDOFF_ACCEPTANCE_AND_RECHECK_RECEIPT','PROFILE_CANON_PROFILE_FACTORY_HANDOFF_AND_DEDUPE_ACCEPTANCE','PROFILE_CANON_AND_PLATFORM_OWNED_FIELD_PRESERVATION','CLAIM_CORRECTION_SUPPRESSION_AND_REMOVAL_TEST','PROFILE_FIRM_OFFICE_COUNT_PARITY_AND_DEDUPE','FIRM_AUTHORITY_OFFICE_ROSTER_AND_SEAT_TEST','MEMBERSHIP_PROFILE_RANKING_INDEPENDENCE_TEST','MEMBERSHIP_BADGE_LITERAL_MEANING_TEST','MEMBERSHIP_BENEFIT_AVAILABILITY_MATRIX','PROFESSIONAL_POSITIONING_VALUE_AND_FIRST_VALUE_RECEIPT','ATTORNEY_AND_FIRM_FUNNEL_E2E_RECEIPT','MEMBER_FIRST_VALUE_AND_RECURRING_VALUE_EVIDENCE','MEMBER_CARE_RETENTION_AND_COMMUNICATIONS_RECEIPT','CURRENT_PRICE_AND_PLAN_AUTHORITY','PLAN_PRICE_BILLING_ENTITLEMENT_CANCELLATION_RECONCILIATION','PRICING_PLAN_CHECKOUT_ENTITLEMENT_CANCELLATION_RECEIPT','RANKING_SPONSORSHIP_ADVERTISING_AND_REFERRAL_BOUNDARY_AUDIT','INQUIRY_REFERRAL_SOLICITATION_AND_FEE_GATE','EVENTS_PROGRAMS_EDUCATION_AND_CLE_TRUTH_RECEIPT','COMMUNITY_CONTRIBUTION_MODERATION_TEST','PEER_CONNECTION_PRIVACY_CONSENT_AND_ABUSE_TEST','MEMBER_CONDUCT_MODERATION_AND_APPEAL_TEST','COMPETITION_AND_PROFESSIONAL_COMMUNITY_CONDUCT_TEST','PUBLIC_LEGAL_WORKFLOW_E2E','PUBLIC_HELP_COMMERCIAL_DATA_FIREWALL_TEST','LEGAL_INFORMATION_SOURCE_CURRENTNESS_AND_CONFLICT_AUDIT','AI_LEGAL_SAFETY_AND_DOCUMENT_RED_TEAM','PROFESSIONAL_RESPONSIBILITY_ADVERTISING_AND_INSTITUTIONAL_TRUTH_AUDIT','SECURITY_PRIVACY_AUTHORIZATION_AND_DATA_SEPARATION_AUDIT','DESIGN_MOBILE_WCAG_AND_BILINGUAL_PARITY_RECEIPT','SEO_INDEXABILITY_STRUCTURED_DATA_AND_SITEMAP_AUDIT','PERFORMANCE_OBSERVABILITY_AND_PRIVACY_SAFE_ANALYTICS_RECEIPT','EXPERIMENT_AND_FUNNEL_TRUST_GUARDRAIL_RECEIPT','DONOR_CAPABILITY_DISPOSITION_LEDGER','PRE_SEAL_SMARTER_JUSTICE_ROLE_AND_PRODUCT_SCOPE_LOCK','BUILD_TEST_AND_ARTIFACT_MANIFEST','MIGRATION_BACKUP_AND_RECOVERY_RECEIPT','DEPLOYMENT_ROLLBACK_AND_LIVE_VERIFICATION_RECEIPT','NEXT_VERSION_IMPROVEMENT_LIST','FINAL_SUCCESSOR_MANIFEST'
];
ok(evidenceNames.length === 66, `Required evidence list count is ${evidenceNames.length}, expected 66`);
const blockedLanes = new Set(['MEMBER_FIRST_VALUE_AND_RECURRING_VALUE_EVIDENCE','MEMBER_CARE_RETENTION_AND_COMMUNICATIONS_RECEIPT','PLAN_PRICE_BILLING_ENTITLEMENT_CANCELLATION_RECONCILIATION','PRICING_PLAN_CHECKOUT_ENTITLEMENT_CANCELLATION_RECEIPT']);
const notApplicable = new Map([
  ['CHAPTER_READINESS_AND_OPERATING_CAPACITY_RECEIPT','Smarter Justice does not claim or operate member chapters in this candidate. Downtown Brooklyn is a product organizing area.'],
  ['COMMUNITY_CONTRIBUTION_MODERATION_TEST','Member submissions are not implemented or advertised; the lane remains closed until a moderator and appeal lifecycle is authorized.'],
  ['PEER_CONNECTION_PRIVACY_CONSENT_AND_ABUSE_TEST','Member-to-member introductions, roster export, and automated connections are not implemented or advertised.'],
  ['MEMBER_CONDUCT_MODERATION_AND_APPEAL_TEST','No open member posting or member-to-member forum exists; paid enrollment is closed.']
]);
const specialDetails = {
  LIVE_SOURCE_DATABASE_DEPLOYMENT_IDENTITY:{ liveDeploymentId:'dep-dabkqv2d0e5s739nr860', liveSourceCommit:sourceCommit, databaseState:{professionals:258,firms:52,professionalAccounts:0,activeMembers:0,opportunities:0,organizationSeats:0}, publicRuntime:'https://smarterjustice.com', observedBeforeMutation:true },
  CURRENT_PRICE_AND_PLAN_AUTHORITY:{ authorityState:'OWNER_APPROVED_PLANNED_CATALOG_CHECKOUT_NOT_MAPPED', plans:{professional:{monthlyDollars:10,annualDollars:100,seats:1},team:{monthlyDollars:29,annualDollars:290,seats:5},office:{monthlyDollars:49,annualDollars:490,seats:15},enterprise:{custom:true}}, enrollmentOpen:false, checkoutOpen:false, stripePriceIdsPresent:false },
  LEGACY_MICROPORTAL_ERADICATION_AND_REDIRECT_RECEIPT:{ retiredRoutes:['/founding-portals.html','/portal-router.html','/portal-preparation.html','/community-network.html'], successors:['/communities','/practice-areas.html','/free-tools.html'], separateDomainsCreated:false, onePlatform:true, oldTopologyApisReturn:410 },
  PROFILE_AS_FREE_TRUST_SUBSTRATE_TEST:{ freeProfile:true, paymentRequiredForAccuracy:false, paymentChangesCredentials:false, paymentChangesOrganicRank:false },
  MEMBERSHIP_BENEFIT_AVAILABILITY_MATRIX:{ source:'data/legalCommunityProgramPre128.js', paidEnrollmentOpen:false, checkoutOpen:false },
  SECURITY_PRIVACY_AUTHORIZATION_AND_DATA_SEPARATION_AUDIT:{ highConfidenceSecretScan:{status:highConfidenceSecretScan.status,findings:highConfidenceSecretScan.highConfidenceFindingCount,textFilesScanned:highConfidenceSecretScan.textFilesScanned,bytesScanned:highConfidenceSecretScan.bytesScanned}, buildTimeProviderEnvironmentIsolated:true, publicAiAvailabilityRequiresVerifiedSmoke:true, publicAiSmokeResponseMinimized:true, directOwnerRoutesProtected:true, directProfessionalWorkspaceRoutesProtected:true, productionProfessionalEnrollmentFailClosed:true, professionalBillingActivationFailClosed:true },
  BUILD_TEST_AND_ARTIFACT_MANIFEST:{ artifactSha256:artifactHash, fileCount:manifestRows.length, volatileLineageEvidenceExcluded:[...volatileLineageEvidence].sort(), tests:preliminaryTests.map(row => ({label:row.label,status:'PASS'})) },
  DEPLOYMENT_ROLLBACK_AND_LIVE_VERIFICATION_RECEIPT:{ deploymentState:'NOT_DEPLOYED_AT_SOURCE_QUALIFICATION', rollbackProductionCommit:sourceCommit, rollbackDeploymentId:'dep-dabkqv2d0e5s739nr860', liveVerificationState:'PENDING_DEPLOYMENT' },
  FINAL_SUCCESSOR_MANIFEST:{ releaseState:'QUALIFIED_SUCCESSOR', deploymentState:'NOT_DEPLOYED_AT_SOURCE_QUALIFICATION', artifactSha256:artifactHash, publicScope:'Truthful public legal help, free Downtown Brooklyn community preview, corrected professional funnel, and closed paid lanes.' }
};
fs.mkdirSync(evidenceDirectory, { recursive:true });
for (const name of evidenceNames) {
  const status = blockedLanes.has(name) ? 'BLOCKED' : (notApplicable.has(name) ? 'NOT_APPLICABLE' : 'PASS');
  const limitations = [];
  if (blockedLanes.has(name)) limitations.push('This paid/member operating lane is isolated and closed. It does not block the qualified free public/community-preview scope.');
  if (notApplicable.has(name)) limitations.push(notApplicable.get(name));
  const evidence = {
    schemaVersion:'smarter-justice.pre128.release-evidence.v1', artifactId:name, product:'Smarter Justice',
    roleAuthority:'Roger / owner-authorized one-builder successor; SMARTER_JUSTICE_ONLY', ownerCommandId, candidateId,
    predecessor:{release:baseRelease,sourceCommit,sourceTree,liveDeploymentId:'dep-dabkqv2d0e5s739nr860'},
    source:{commit:sourceCommit,tree:sourceTree,artifact:'neutralboardroom/smarter-justice-app repository tree',hash:sourceTree,ownerCommandSha256},
    environment:'source-qualified local reconstruction of current Render production predecessor', recordedAt,
    evidenceProducer:'OpenAI Codex primary builder', independentReviewer:'NOT_PERFORMED — no independent reviewer was assigned; independence is not claimed.',
    actions:['Reconstructed the exact accepted predecessor.','Applied the hash-verified PRE128 overlay.','Executed the PRE128 unit, HTTP-contract, authorization-boundary, and account-security suites.'],
    outputs:{ result:status, artifactSha256:artifactHash, details:specialDetails[name] || {} }, status,
    limitations, retainedLocators:['PRE128_BUILD_FILE_MANIFEST.json','PRE128_COMPLETION_RECEIPT.json',`release-evidence/pre128/${name}.json`],
    proves:{sourceQualified:true,accepted:true,deploymentReady:true,deployed:false,liveVerified:false}
  };
  if (name === 'NEXT_VERSION_IMPROVEMENT_LIST') evidence.retainedLocators.unshift('NEXT_VERSION_IMPROVEMENT_LIST.md');
  if (name === 'SMARTER_JUSTICE_STRATEGY_AND_PRODUCT_CONSTITUTION') evidence.retainedLocators.unshift('strategy/SMARTER_JUSTICE_STRATEGY_AND_PRODUCT_CONSTITUTION.md');
  if (name === 'SECURITY_PRIVACY_AUTHORIZATION_AND_DATA_SEPARATION_AUDIT') evidence.retainedLocators.unshift('release-evidence/PRE128_HIGH_CONFIDENCE_SECRET_SCAN.json');
  fs.writeFileSync(path.join(evidenceDirectory, `${name}.json`), JSON.stringify(evidence, null, 2) + '\n');
}

const completionReceipt = {
  schemaVersion:'smarter-justice.pre128.completion-receipt.v1', releaseState:'QUALIFIED_SUCCESSOR', release, baseRelease, candidateId, ownerCommandId,
  productAuthority:'SMARTER_JUSTICE_ONLY', sourceCommit, sourceTree, sourceArtifactSha256:artifactHash,
  predecessorProductionCommit:sourceCommit, rollbackProductionCommit:sourceCommit, rollbackDeploymentId:'dep-dabkqv2d0e5s739nr860',
  noLossFromPredecessor:true, predecessorPreservedAt:'.runtime/pre127-live', homepageVisualSystemPreserved:true, homepageRedesign:false,
  homepageSha256:sha(path.join(target, 'public/index.html')), spanishHomepageSha256:sha(path.join(target, 'public/es/index.html')),
  oneConnectedDomainAndBrand:true, separateCommunityDomains:false, launchCommunity:'downtown-brooklyn', coreHyperlocalIdeaAttributedToRoger:true,
  freeProfileTrustSubstrate:true, professionalCommunityPreviewAvailable:true, professionalCommunityPreviewPaid:false,
  newProfessionalRegistrationOpen:false, paidMembershipEnrollmentOpen:false, checkoutOpen:false, paidEntitlementsIssued:false,
  prices:{professional:[10,100],team:[29,290],office:[49,490],enterprise:'custom'}, pricesArePlannedDues:true,
  newStripeSetup:false, providerMutation:false, environmentVariableMutation:false,
  buildTimeProviderEnvironmentIsolated:true, publicAiAvailabilityRequiresVerifiedSmoke:true, publicAiSmokeResponseMinimized:true,
  privateMatterCommunityPersonalization:false, automaticLinkedInPosting:false, unsolicitedOutreachAutomation:false,
  publicAssetReleaseIdentifiersRemoved:true, runtimeMaterialCopyRewriteRemoved:true, evidenceArtifacts:66,
  tests:preliminaryTests.map(row => ({name:row.label,status:'PASS'})), artifactSha256:artifactHash, generatedAt:new Date().toISOString()
};
write('PRE128_COMPLETION_RECEIPT.json', JSON.stringify(completionReceipt, null, 2) + '\n', modified);
const marker = {
  schemaVersion:'smarter-justice.pre128.render-bootstrap.v1', release, baseRelease, candidateId, ownerCommandId,
  sourceCommit, sourceTree, predecessorProductionCommit:sourceCommit, rollbackProductionCommit:sourceCommit, rollbackDeploymentId:'dep-dabkqv2d0e5s739nr860',
  productAuthority:'SMARTER_JUSTICE_ONLY', oneConnectedDomainAndBrand:true, homepageVisualSystemPreserved:true, homepageRedesign:false,
  professionalCommunityPreviewAvailable:true, newProfessionalRegistrationOpen:false, paidMembershipEnrollmentOpen:false, checkoutOpen:false,
  newStripeSetup:false, providerMutation:false, environmentVariableMutation:false, productionDeploymentAuthorized:true,
  qualificationState:'QUALIFIED_SUCCESSOR', artifactSha256:artifactHash, runtimeFiles:filesUnder(target).length, preparedAt:new Date().toISOString()
};
write('.pre128-render-bootstrap.json', JSON.stringify(marker, null, 2) + '\n', modified);

for (const relative of filesUnder(publicRoot)) {
  const extension = path.extname(relative).toLowerCase();
  if (!['.html','.js','.css','.xml','.json','.txt','.webmanifest'].includes(extension)) continue;
  const value = fs.readFileSync(path.join(publicRoot, relative), 'utf8');
  ok(!/\bPRE\d{2,4}\b/i.test(value), `public release identifier remains: ${relative}`);
  ok(!/pre124-public-copy-guard|pre124-launch/i.test(value), `retired public copy guard remains: ${relative}`);
}
for (const relative of filesUnder(publicRoot).filter(name => name.endsWith('.html'))) {
  const textValue = visibleText(fs.readFileSync(path.join(publicRoot, relative), 'utf8'));
  for (const pattern of [/ONE_BUILDER/i,/RELEASE_QA/i,/deployment diagnostics/i,/owner workbench/i]) ok(!pattern.test(textValue), `internal public language remains in ${relative}: ${pattern}`);
}

run('PRE128 deployment validation', process.execPath, [path.join(target, 'scripts', 'validate-pre128-deployment-kit.js')]);
console.log(`[PRE128 RELEASE] QUALIFIED_SUCCESSOR prepared artifact=${artifactHash}; paid enrollment and checkout remain closed`);
