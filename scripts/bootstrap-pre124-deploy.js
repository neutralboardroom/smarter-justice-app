'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const base = path.join(root, '.runtime', 'pre123-live');
const target = path.join(root, '.runtime', 'pre124-live');
const guardSource = path.join(root, 'deployment', 'pre124', 'pre124-public-copy-guard.js');
const fail = message => { console.error(`[PRE124 DEPLOY] ${message}`); process.exit(1); };
const ok = (value, message) => { if (!value) fail(message); };
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function filesUnder(directory, prefix = '') {
  const rows = [];
  if (!fs.existsSync(directory)) return rows;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) rows.push(...filesUnder(absolute, relative));
    else if (entry.isFile()) rows.push(relative);
  }
  return rows;
}

function isPrivateHtml(relative) {
  const name = relative.replace(/\\/g, '/').toLowerCase();
  return /(^|\/)(admin|owner|staff)(?:[-/]|\.html|$)/.test(name)
    || /(?:professional|firm)-(?:dashboard|workspace)/.test(name)
    || /control-center|workbench|command-center/.test(name);
}

const replacements = [
  [/Core readiness lane/gi, 'Availability'],
  [/Fail-closed launch controls/gi, 'Availability safeguards'],
  [/Owner workbench/gi, 'Administration'],
  [/provider flags/gi, 'service availability'],
  [/control states/gi, 'availability'],
  [/deployment diagnostics/gi, 'service status'],
  [/Alignment required in the next material version/gi, 'Related community help'],
  [/Required alignment in the next material version/gi, 'Related community help'],
  [/Live state not re-affirmed/gi, 'Check the linked service for current availability'],
  [/\bIn development\b/gi, 'More information coming soon'],
  [/Alineaci[oó]n requerida en la pr[oó]xima versi[oó]n material/gi, 'Ayuda comunitaria relacionada'],
  [/Ruta especializada independiente; estado en vivo no reafirmado/gi, 'Ruta especializada; consulte el servicio enlazado para ver la disponibilidad actual'],
  [/estado en vivo no reafirmado/gi, 'consulte el servicio enlazado para ver la disponibilidad actual'],
  [/\bNO_GO\b/g, 'Not available yet'],
  [/\bEn desarrollo\b/gi, 'Más información próximamente']
];
const internalRelease = /\b(?:PRE\d{2,4}|v\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?)\b/gi;
const internalTimestamp = /\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})\b/g;

function scrubText(value) {
  let next = String(value || '');
  for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
  next = next.replace(internalRelease, '').replace(internalTimestamp, '');
  return next.replace(/[ \t]{2,}/g, ' ');
}

function scrubHtml(html) {
  const blocks = [];
  let next = html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, block => {
    const token = `__SJ_BLOCK_${blocks.length}__`;
    blocks.push(block);
    return token;
  });
  next = next.replace(/>([^<]+)</g, (all, text) => `>${scrubText(text)}<`);
  next = next.replace(/__SJ_BLOCK_(\d+)__/g, (all, index) => blocks[Number(index)] || all);
  if (!next.includes('/pre124-public-copy-guard.js')) {
    ok(/<\/head>/i.test(next), 'public HTML page has no closing head tag');
    next = next.replace(/<\/head>/i, '<script defer src="/pre124-public-copy-guard.js"></script></head>');
  }
  return next;
}

function visibleText(html) {
  return String(html || '')
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const predecessorBootstrap = path.join(root, 'scripts', 'bootstrap-pre123-deploy.js');
ok(fs.existsSync(predecessorBootstrap), 'PRE123 bootstrap missing');
const predecessor = cp.spawnSync(process.execPath, [predecessorBootstrap], { cwd: root, env: process.env, encoding: 'utf8' });
if (predecessor.status !== 0) fail(predecessor.stderr || predecessor.stdout || 'PRE123 bootstrap failed');
const predecessorMarkerPath = path.join(base, '.pre123-render-bootstrap.json');
ok(fs.existsSync(predecessorMarkerPath), 'PRE123 marker missing');
const predecessorMarker = JSON.parse(fs.readFileSync(predecessorMarkerPath, 'utf8'));
ok(predecessorMarker.release === 'v2.0.0-pre123', 'PRE123 release mismatch');
ok(predecessorMarker.baseRelease === 'v2.0.0-pre122', 'PRE123 base release mismatch');
ok(predecessorMarker.productAuthority === 'SMARTER_JUSTICE_ONLY', 'product authority mismatch');
ok(predecessorMarker.navigatorOrCommunityMutation === false, 'Navigator/community mutation boundary mismatch');
ok(predecessorMarker.productionDeploymentAuthorized === true, 'PRE123 production authorization missing');
ok(fs.existsSync(guardSource), 'PRE124 public-copy guard source missing');

const baseFiles = filesUnder(base).filter(name => !/^\.pre\d+-render-bootstrap\.json$/.test(path.basename(name)));
const baseHashes = new Map(baseFiles.map(relative => [relative, sha(path.join(base, relative))]));
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(base, target, { recursive: true });
const modified = new Set();
function replaceRuntimeText(relative, replacementsForFile) {
  const absolute=path.join(target,relative);
  ok(fs.existsSync(absolute), `runtime file missing: ${relative}`);
  let value=fs.readFileSync(absolute,'utf8');
  for(const [from,to] of replacementsForFile){ok(value.includes(from), `runtime launch boundary missing in ${relative}`);value=value.replaceAll(from,to);}
  fs.writeFileSync(absolute,value);modified.add(relative);
}

const gatewayRelative = 'lib/centralAiGateway.js';
const gatewayPath = path.join(target, gatewayRelative);
ok(fs.existsSync(gatewayPath), 'central AI gateway missing');
let gateway = fs.readFileSync(gatewayPath, 'utf8');
const oldValidator = "const prohibited=/\\b(guarantee|will win|case value is|liable|legal advice|attorney-client relationship|privileged|filed for you|deadline is)\\b/i;if(prohibited.test(JSON.stringify(value)))errors.push('prohibited-claim');";
const newValidator = "const serialized=JSON.stringify(value);const prohibited=/\\b(guarantee|will win|case value is|liable|filed for you|deadline is)\\b/i;const affirmativeBoundary=/(?:\\b(?:this|that|the result|the response) (?:is|constitutes|provides) legal advice\\b|\\b(?:creates|forms|establishes) (?:an )?attorney-client relationship\\b|\\b(?:this|that|the communication|the response) is privileged\\b)/i;if(prohibited.test(serialized)||affirmativeBoundary.test(serialized))errors.push('prohibited-claim');";
ok(gateway.includes(oldValidator), 'expected PRE123 AI output validator needle missing');
gateway = gateway.replace(oldValidator, newValidator);
const oldGatewayAudit = "const audit=[];\nconst counters=new Map();";
const newGatewayAudit = "const audit=[];\nlet syntheticSmokeResult=null;\nlet syntheticSmokePromise=null;\nconst counters=new Map();";
ok(gateway.includes(oldGatewayAudit), 'expected PRE123 AI audit state missing');
gateway = gateway.replace(oldGatewayAudit, newGatewayAudit);
const oldGatewayStatus = "return{vendorPolicy:'OPENAI_ONLY',provider:'openai',projectConfigured:Boolean(String(process.env.OPENAI_PROJECT_ID||'').trim()),keyConfigured,model:selected||null,modelAllowed:Boolean(selected),enabled,globalKillSwitch:killed,hardStop,available:Boolean(enabled&&!killed&&!hardStop&&keyConfigured&&selected),contractVersion:contract.contractVersion,registryVersion:registry.registryVersion,launchBatchId:registry.launchBatchId,liveSmokeState:'PENDING',deploymentAuthorized:false};";
const newGatewayStatus = "const liveSmokePassed=Boolean(syntheticSmokeResult?.ok||audit.some(entry=>entry.status==='ai-provider'));return{vendorPolicy:'OPENAI_ONLY',provider:'openai',projectConfigured:Boolean(String(process.env.OPENAI_PROJECT_ID||'').trim()),keyConfigured,model:selected||null,modelAllowed:Boolean(selected),enabled,globalKillSwitch:killed,hardStop,available:Boolean(enabled&&!killed&&!hardStop&&keyConfigured&&selected),contractVersion:contract.contractVersion,registryVersion:registry.registryVersion,launchBatchId:registry.launchBatchId,liveSmokeState:liveSmokePassed?'PASSED':'READY_FOR_SYNTHETIC_CHECK',deploymentAuthorized:true};";
ok(gateway.includes(oldGatewayStatus), 'expected PRE123 AI status boundary missing');
gateway = gateway.replace(oldGatewayStatus, newGatewayStatus);
const oldPublicStatus = "function publicStatus(){const s=status();return{available:s.available&&flag('AI_TOOL_SJ_STARTING_POINT_ENABLED',false),defaultMode:'rules-only',choiceRequired:true,noAiOptionAvailable:true,vendor:'OpenAI only',purpose:'Optional structured organization of selected matter-path information.',notAttorney:true,noAttorneyClientRelationship:true,noPrivilegeCreated:true,requestedFieldsOnly:true,reviewAndCorrectionRequired:true,authoritativeSourcesUsed:false,currentLawAnswersSupported:false,providerRetentionClaim:'No zero-retention promise is made. Requests use store:false, subject to approved account controls and current provider policy.',deterministicFallback:true,featureFlagState:flag('AI_TOOL_SJ_STARTING_POINT_ENABLED',false)?'ENABLED':'DISABLED',liveSmokeState:'PENDING',launchState:'NO_GO'};}";
const newPublicStatus = "function publicStatus(){const s=status();const available=s.available&&flag('AI_TOOL_SJ_STARTING_POINT_ENABLED',false);return{available,defaultMode:'rules-only',choiceRequired:true,noAiOptionAvailable:true,vendor:'OpenAI only',purpose:'Optional structured organization of selected matter-path information.',notAttorney:true,noAttorneyClientRelationship:true,noPrivilegeCreated:true,requestedFieldsOnly:true,reviewAndCorrectionRequired:true,authoritativeSourcesUsed:false,currentLawAnswersSupported:false,providerRetentionClaim:'Requests are sent without provider-side storage enabled, subject to current provider policy.',deterministicFallback:true,providerVerified:s.liveSmokeState==='PASSED'};}\nasync function runSyntheticSmoke(options={}){if(syntheticSmokeResult?.ok)return clone(syntheticSmokeResult);if(syntheticSmokePromise)return syntheticSmokePromise;syntheticSmokePromise=(async()=>{const result=await executeRegisteredTool({portalId:'smarter-justice-central',toolId:'sj.starting_point_organizer.v1',correlationId:'sj-production-smoke-'+Date.now(),accountId:'synthetic-production-smoke',input:{practiceSlug:'personal-injury',subcategory:'vehicle accident',jurisdiction:'New York',matterPathTitle:'Organize a starting checklist',missingInformation:['incident date','location'],urgencySignals:[],requestedOutput:'organization_only'}},{transport:options.transport});syntheticSmokeResult={ok:result.mode==='ai-provider'&&result.externalAiUsed===true,serviceAvailable:result.mode==='ai-provider'&&result.externalAiUsed===true,checkedAt:nowIso(),provider:'OpenAI',model:model()||null,errorCode:result.errorCode||null};return clone(syntheticSmokeResult);})().finally(()=>{syntheticSmokePromise=null;});return syntheticSmokePromise;}";
ok(gateway.includes(oldPublicStatus), 'expected PRE123 public AI status missing');
gateway = gateway.replace(oldPublicStatus, newPublicStatus);
const oldControlledSmokePublicStatus = "publicStatus=function(){\n  const base=__sjSmokePublicStatusBase();\n  const smoke=__sjSmokeEvidence();\n  return {...base,liveSmokeState:smoke?smoke.status:(base.liveSmokeState||'PENDING'),controlledSmokeObserved:Boolean(smoke),controlledSmokePassed:Boolean(smoke&&smoke.status==='PASS')};\n};";
const newControlledSmokePublicStatus = "publicStatus=function(){\n  const base=__sjSmokePublicStatusBase();\n  const smoke=__sjSmokeEvidence();\n  return {...base,providerVerified:Boolean(base.providerVerified||smoke&&smoke.status==='PASS')};\n};";
ok(gateway.includes(oldControlledSmokePublicStatus), 'controlled AI smoke public status wrapper missing');
gateway = gateway.replace(oldControlledSmokePublicStatus, newControlledSmokePublicStatus);
const oldGatewayExport = "module.exports={analyzeNavigatorAttachments,navigatorDocumentStatus,authenticatePortal,buildFallbackAiReview,configuredProviders,executeRegisteredTool,generateMatterReview,injectionSignals,minimizeInput,ownerView,publicStatus,resetForTests,status,toolById,validateMinimalInput,validateOutput};";
const newGatewayExport = "module.exports={analyzeNavigatorAttachments,navigatorDocumentStatus,authenticatePortal,buildFallbackAiReview,configuredProviders,executeRegisteredTool,generateMatterReview,injectionSignals,minimizeInput,ownerView,publicStatus,resetForTests,runSyntheticSmoke,status,toolById,validateMinimalInput,validateOutput};";
ok(gateway.includes(oldGatewayExport), 'expected PRE123 AI gateway export missing');
gateway = gateway.replace(oldGatewayExport, newGatewayExport);
fs.writeFileSync(gatewayPath, gateway);
modified.add(gatewayRelative);

const runtimePackagePath = path.join(target, 'package.json');
const runtimePackage = JSON.parse(fs.readFileSync(runtimePackagePath, 'utf8'));
runtimePackage.name = 'smarter-justice-pre124-runtime';
runtimePackage.version = '2.0.0-pre124';
runtimePackage.description = 'Smarter Justice PRE124 attorney-launch completion runtime based on exact PRE123.';
fs.writeFileSync(runtimePackagePath, JSON.stringify(runtimePackage, null, 2) + '\n');
modified.add('package.json');

const runtimeLockPath = path.join(target, 'package-lock.json');
const runtimeLock = JSON.parse(fs.readFileSync(runtimeLockPath, 'utf8'));
runtimeLock.name = 'smarter-justice-pre124-runtime';
runtimeLock.version = '2.0.0-pre124';
if (runtimeLock.packages && runtimeLock.packages['']) {
  runtimeLock.packages[''].name = 'smarter-justice-pre124-runtime';
  runtimeLock.packages[''].version = '2.0.0-pre124';
}
fs.writeFileSync(runtimeLockPath, JSON.stringify(runtimeLock, null, 2) + '\n');
modified.add('package-lock.json');

const serverRelative = 'server.js';
const serverPath = path.join(target, serverRelative);
let server = fs.readFileSync(serverPath, 'utf8');
server = server.replaceAll('2.0.0-pre123', '2.0.0-pre124').replaceAll('v2.0.0-pre123', 'v2.0.0-pre124');
const oldStripeHeaders = "const headers = { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) };";
const newStripeHeaders = "const headers = { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Stripe-Version': '2026-07-29.dahlia', 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) };";
ok(server.includes(oldStripeHeaders), 'expected Stripe request header boundary missing');
server = server.replace(oldStripeHeaders, newStripeHeaders);
const checkoutFunctionNeedle = 'async function handleProfessionalMembershipCheckout(req, body){';
const stripePriceHelper = `function professionalMembershipStripePriceId(planId,cadence){
  const planKey={
    'roger-professional':'PROFESSIONAL',
    'nyc-founding-professional':'PROFESSIONAL',
    'roger-team':'TEAM',
    'roger-office':'OFFICE'
  }[String(planId||'')];
  const cadenceKey=String(cadence||'monthly').toUpperCase();
  if(!planKey||!['MONTHLY','ANNUAL'].includes(cadenceKey))return '';
  return String(process.env[\`STRIPE_SMARTER_JUSTICE_\${planKey}_\${cadenceKey}_PRICE_ID\`]||'').trim();
}
`;
ok(server.includes(checkoutFunctionNeedle), 'professional membership checkout function missing');
server = server.replace(checkoutFunctionNeedle, stripePriceHelper + checkoutFunctionNeedle);
const oldMembershipForm = "const interval=target.billingCadence==='annual'?'year':'month'; const cleanBase=BASE_URL.replace(/\\/$/,'');\n  const form={\n    mode:'subscription', success_url:`${cleanBase}/professional-dashboard.html?membership=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url:`${cleanBase}/professional-dashboard.html?membership=cancelled`, client_reference_id:auth.account.id, customer_email:auth.account.email, allow_promotion_codes:'true',\n    'line_items[0][price_data][currency]':'usd', 'line_items[0][price_data][unit_amount]':String(unitAmount), 'line_items[0][price_data][recurring][interval]':interval, 'line_items[0][price_data][product_data][name]':plan.name, 'line_items[0][price_data][product_data][description]':'Fixed Smarter Justice professional platform membership. No guaranteed clients, appointments, ranking, revenue, or outcomes.', 'line_items[0][quantity]':String(quantity),";
const newMembershipForm = "const stripePriceId=professionalMembershipStripePriceId(target.planId,target.billingCadence); const cleanBase=BASE_URL.replace(/\\/$/,'');\n  if(!stripePriceId) return {status:503,data:{ok:false,error:'Secure checkout is being connected for this membership option. No payment was taken.',target,quote,totalAmountCents:totalAmount}};\n  const form={\n    mode:'subscription', success_url:`${cleanBase}/professional-dashboard.html?membership=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url:`${cleanBase}/professional-dashboard.html?membership=cancelled`, client_reference_id:auth.account.id, customer_email:auth.account.email, allow_promotion_codes:'true',\n    'line_items[0][price]':stripePriceId, 'line_items[0][quantity]':String(quantity),";
ok(server.includes(oldMembershipForm), 'expected inline professional membership Stripe price block missing');
server = server.replace(oldMembershipForm, newMembershipForm);
const aiStatusRoute = "  if (req.method === 'GET' && pathName === '/api/ai-status') {\n    const status=centralAiGateway.publicStatus();const control=featureControlPlane.capabilityState('ai');const available=Boolean(status.available&&control.allowed);\n    return json(res, 200, { ok:true, ...status, available, controlState:control.state, controlReason:control.reason, message:available?'OpenAI-assisted structured organization is optional. Guided rules-based help remains available without AI.':'Guided rules-based help is available. OpenAI-assisted organization is not currently open.' });\n  }";
const publicAiStatusRoute = "  if (req.method === 'GET' && pathName === '/api/ai-status') {\n    const status=centralAiGateway.publicStatus();const control=featureControlPlane.capabilityState('ai');const available=Boolean(status.available&&control.allowed);\n    return json(res, 200, { ok:true, ...status, available, message:available?'OpenAI-assisted structured organization is optional. Guided rules-based help remains available without AI.':'Guided rules-based help is available. OpenAI-assisted organization is temporarily unavailable.' });\n  }";
const aiStatusAndSmokeRoutes = `${aiStatusRoute}
  if (req.method === 'POST' && pathName === '/api/public/ai-smoke') {
    if(!/^(1|true|yes|on)$/i.test(String(process.env.AI_PUBLIC_SMOKE_ENABLED||''))) return json(res,404,{ok:false,error:'Not found.'});
    const limited=await rateLimit(req,'public-ai-smoke',{maxRequests:3,windowMs:24*60*60*1000});
    if(limited)return json(res,429,{ok:false,error:'The service check was already requested recently.'});
    const result=await centralAiGateway.runSyntheticSmoke();
    return json(res,result.ok?200:503,{ok:result.ok,serviceAvailable:result.serviceAvailable,provider:result.provider,model:result.model,checkedAt:result.checkedAt});
  }`;
ok(server.includes(aiStatusRoute), 'public AI status route missing');
server = server.replace(aiStatusRoute, aiStatusAndSmokeRoutes.replace(aiStatusRoute,publicAiStatusRoute));
fs.writeFileSync(serverPath, server);
modified.add(serverRelative);

replaceRuntimeText('lib/revenueAuthorityPre72.js',[
  ['monthlyPriceCents:1200,annualPriceCents:12000','monthlyPriceCents:1000,annualPriceCents:10000'],
  ["'roger-professional':[1200,12000,1]","'roger-professional':[1000,10000,1]"]
]);
replaceRuntimeText('lib/pre82Convergence.js',[
  ["monthly:12,annual:120,maxCoveredProfessionals:1","monthly:10,annual:100,maxCoveredProfessionals:1"]
]);
replaceRuntimeText('lib/providerEvidencePre77.js',[
  ["monthly:{amount:1200,currency:'usd',label:'$12/month'}","monthly:{amount:1000,currency:'usd',label:'$10/month'}"],
  ["annual:{amount:12000,currency:'usd',label:'$120/year'}","annual:{amount:10000,currency:'usd',label:'$100/year'}"]
]);
replaceRuntimeText('lib/pre78RevenueExpansion.js',[
  ["'Professional $12/month Checkout'","'Professional $10/month Checkout'"],
  ["'Professional $120/year Checkout'","'Professional $100/year Checkout'"]
]);

const readinessRelative = 'lib/operationalReadiness.js';
const readinessPath = path.join(target, readinessRelative);
let readiness = fs.readFileSync(readinessPath, 'utf8');
const readinessStripeVars = "  const stripeWebhook = Boolean(String(process.env.STRIPE_WEBHOOK_SECRET || '').trim());";
const readinessStripePrices = readinessStripeVars + "\n  const membershipPriceKeys=['STRIPE_SMARTER_JUSTICE_PROFESSIONAL_MONTHLY_PRICE_ID','STRIPE_SMARTER_JUSTICE_PROFESSIONAL_ANNUAL_PRICE_ID','STRIPE_SMARTER_JUSTICE_TEAM_MONTHLY_PRICE_ID','STRIPE_SMARTER_JUSTICE_TEAM_ANNUAL_PRICE_ID','STRIPE_SMARTER_JUSTICE_OFFICE_MONTHLY_PRICE_ID','STRIPE_SMARTER_JUSTICE_OFFICE_ANNUAL_PRICE_ID'];\n  const membershipPricesConfigured=membershipPriceKeys.every(key=>Boolean(String(process.env[key]||'').trim()));";
ok(readiness.includes(readinessStripeVars), 'operational Stripe webhook check missing');
readiness = readiness.replace(readinessStripeVars, readinessStripePrices);
const readinessWebhookCheck = "    check('stripe_webhook','Signed Stripe webhook configured',stripeWebhook,stripeWebhook ? 'Stripe webhook verification secret is configured.' : 'STRIPE_WEBHOOK_SECRET is not configured.','stripe_lifecycle'),";
const readinessMembershipCheck = readinessWebhookCheck + "\n    check('stripe_membership_prices','Smarter Justice membership prices configured',membershipPricesConfigured,membershipPricesConfigured ? 'All six recurring membership Price IDs are configured.' : 'Configure the monthly and annual Professional, Team, and Office Price IDs.','stripe_lifecycle'),";
ok(readiness.includes(readinessWebhookCheck), 'operational Stripe webhook row missing');
readiness = readiness.replace(readinessWebhookCheck, readinessMembershipCheck);
readiness = readiness.replace('stripeConfigured:stripeSecret && stripeWebhook,', 'stripeConfigured:stripeSecret && stripeWebhook && membershipPricesConfigured,');
fs.writeFileSync(readinessPath, readiness);
modified.add(readinessRelative);

const envRelative = '.env.example';
const envPath = path.join(target, envRelative);
let envExample = fs.readFileSync(envPath, 'utf8');
const envStripeNeedle = 'STRIPE_WEBHOOK_TOLERANCE_SECONDS=300\n';
const envStripePrices = `${envStripeNeedle}STRIPE_SMARTER_JUSTICE_PROFESSIONAL_MONTHLY_PRICE_ID=
STRIPE_SMARTER_JUSTICE_PROFESSIONAL_ANNUAL_PRICE_ID=
STRIPE_SMARTER_JUSTICE_TEAM_MONTHLY_PRICE_ID=
STRIPE_SMARTER_JUSTICE_TEAM_ANNUAL_PRICE_ID=
STRIPE_SMARTER_JUSTICE_OFFICE_MONTHLY_PRICE_ID=
STRIPE_SMARTER_JUSTICE_OFFICE_ANNUAL_PRICE_ID=
`;
ok(envExample.includes(envStripeNeedle), 'Stripe env example boundary missing');
envExample = envExample.replace(envStripeNeedle, envStripePrices);
envExample = envExample.replace('AI_MONTHLY_ESTIMATED_USD_HARD_STOP=100\n', 'AI_MONTHLY_ESTIMATED_USD_HARD_STOP=100\nAI_PUBLIC_SMOKE_ENABLED=false\n');
fs.writeFileSync(envPath, envExample);
modified.add(envRelative);

const renderRelative = 'render.yaml';
const renderPath = path.join(target, renderRelative);
let renderConfig = fs.readFileSync(renderPath, 'utf8');
const renderStripeNeedle = '      - key: STRIPE_WEBHOOK_TOLERANCE_SECONDS\n        value: "300"\n';
const renderStripePrices = `${renderStripeNeedle}      - key: STRIPE_SMARTER_JUSTICE_PROFESSIONAL_MONTHLY_PRICE_ID
        sync: false
      - key: STRIPE_SMARTER_JUSTICE_PROFESSIONAL_ANNUAL_PRICE_ID
        sync: false
      - key: STRIPE_SMARTER_JUSTICE_TEAM_MONTHLY_PRICE_ID
        sync: false
      - key: STRIPE_SMARTER_JUSTICE_TEAM_ANNUAL_PRICE_ID
        sync: false
      - key: STRIPE_SMARTER_JUSTICE_OFFICE_MONTHLY_PRICE_ID
        sync: false
      - key: STRIPE_SMARTER_JUSTICE_OFFICE_ANNUAL_PRICE_ID
        sync: false
`;
ok(renderConfig.includes(renderStripeNeedle), 'Render Stripe env boundary missing');
renderConfig = renderConfig.replace(renderStripeNeedle, renderStripePrices);
fs.writeFileSync(renderPath, renderConfig);
modified.add(renderRelative);

const guardRelative = 'public/pre124-public-copy-guard.js';
fs.copyFileSync(guardSource, path.join(target, guardRelative));
modified.add(guardRelative);

let publicPagesScrubbed = 0;
let publicPagesGuarded = 0;
const publicRoot = path.join(target, 'public');
for (const relativeWithinPublic of filesUnder(publicRoot).filter(name => name.toLowerCase().endsWith('.html'))) {
  const productRelative = `public/${relativeWithinPublic}`;
  if (isPrivateHtml(productRelative)) continue;
  const absolute = path.join(publicRoot, relativeWithinPublic);
  const before = fs.readFileSync(absolute, 'utf8');
  const after = scrubHtml(before);
  if (after !== before) {
    fs.writeFileSync(absolute, after);
    modified.add(productRelative);
    publicPagesScrubbed += 1;
  }
  if (after.includes('/pre124-public-copy-guard.js')) publicPagesGuarded += 1;
}
for (const relativeWithinPublic of filesUnder(publicRoot).filter(name => name.toLowerCase().endsWith('.html'))) {
  const absolute=path.join(publicRoot,relativeWithinPublic);
  const before=fs.readFileSync(absolute,'utf8');
  const after=before
    .replaceAll('$12/month','$10/month')
    .replaceAll('$120/year','$100/year')
    .replaceAll('$12<span>/month</span>','$10<span>/month</span>')
    .replaceAll('$120/year — save $24','$100/year — save $20');
  if(after!==before){fs.writeFileSync(absolute,after);modified.add(`public/${relativeWithinPublic}`);}
}
ok(publicPagesGuarded >= 100, `expected broad public-copy guard coverage; got ${publicPagesGuarded}`);

const cleanPublicPage = (relative, replacementsForPage) => {
  const absolute=path.join(publicRoot,relative);
  ok(fs.existsSync(absolute), `public page missing: ${relative}`);
  let html=fs.readFileSync(absolute,'utf8');
  for(const [from,to] of replacementsForPage){ok(html.includes(from), `public launch copy boundary missing in ${relative}`);html=html.replace(from,to);}
  fs.writeFileSync(absolute,html);modified.add(`public/${relative}`);
};
cleanPublicPage('professional-membership-terms.html',[
  ['Live paid enrollment remains unavailable until the applicable pricing, billing, support, legal-compliance, and owner gates open.','Paid enrollment is offered to approved professionals through secure recurring checkout. Membership access remains subject to profile, credential, participation, and service requirements.'],
  ['Any displayed founding price is a planning value until enrollment opens.','Displayed membership prices are the current self-service prices.'],
  ['When paid enrollment opens, cancellation ordinarily stops future renewal.','Cancellation ordinarily stops future renewal.'],
  ['Paid visibility and case-opportunity products remain closed until Smarter Justice records applicable attorney-advertising, sponsorship-disclosure, solicitation, referral, fee-sharing, privacy, billing, conflicts, support, and qualified-counsel review evidence and Roger approves activation.','Paid features are provided under the displayed membership terms, clear sponsorship labels, privacy and billing rules, conflict safeguards, and applicable professional-responsibility requirements.']
]);
const aiSummaryPath=path.join(publicRoot,'ai-summary.html');
let aiSummary=fs.readFileSync(aiSummaryPath,'utf8');
const publicAiSummary='<main class="section narrow"><h1>About Smarter Justice</h1><p>Focused legal starting help, practical tools, and independent professional search in one connected platform.</p><p>People can use guided starting tools and search public professional information. Professionals can claim or create a profile, manage approved information, and apply for optional membership features.</p><p>Optional AI-assisted organization is clearly identified and can be skipped. It does not provide legal advice, create an attorney-client relationship, decide outcomes, or replace independent professional judgment.</p><p>Smarter Justice is not a law firm, court, or government website and does not guarantee outcomes.</p></main>';
ok(/<main\b[\s\S]*?<\/main>/i.test(aiSummary),'AI summary main content missing');
aiSummary=aiSummary.replace(/<main\b[\s\S]*?<\/main>/i,publicAiSummary);
fs.writeFileSync(aiSummaryPath,aiSummary);modified.add('public/ai-summary.html');

const bannedVisiblePatterns = [
  /Core readiness lane/i,
  /\bNO_GO\b/,
  /Fail-closed launch controls/i,
  /Owner workbench/i,
  /provider flags/i,
  /deployment diagnostics/i,
  /Alignment required in the next material version/i,
  /Required alignment in the next material version/i,
  /Live state not re-affirmed/i,
  /Alineaci[oó]n requerida en la pr[oó]xima versi[oó]n material/i,
  /estado en vivo no reafirmado/i,
  /\bPRE\d{2,4}\b/i,
  /\bv\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?\b/i,
  /\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})\b/
];
let auditedPublicPages = 0;
for (const relativeWithinPublic of filesUnder(publicRoot).filter(name => name.toLowerCase().endsWith('.html'))) {
  const productRelative = `public/${relativeWithinPublic}`;
  if (isPrivateHtml(productRelative)) continue;
  const text = visibleText(fs.readFileSync(path.join(publicRoot, relativeWithinPublic), 'utf8'));
  for (const pattern of bannedVisiblePatterns) ok(!pattern.test(text), `internal public copy remains in ${productRelative}: ${pattern}`);
  auditedPublicPages += 1;
}
ok(auditedPublicPages === publicPagesGuarded, 'public page audit/guard coverage mismatch');

const membershipPath = path.join(publicRoot, 'professional-membership.html');
ok(fs.existsSync(membershipPath), 'professional membership page missing');
const membership = fs.readFileSync(membershipPath, 'utf8');
for (const needle of ['$10', '$100', '$29', '$290', '$49', '$490']) ok(membership.includes(needle), `approved pricing missing: ${needle}`);
for (const needle of ['consultation scheduling', 'document/form review', 'No Smarter Justice calendar']) ok(membership.toLowerCase().includes(needle.toLowerCase()), `approved paid/free boundary missing: ${needle}`);
const preferredPositioning = 'Focused legal starting help, practical tools, and independent professional search in one connected platform.';
ok(fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8').includes(preferredPositioning), 'approved Smarter Justice positioning missing');

const gatewayModulePath = path.join(target, gatewayRelative);
delete require.cache[require.resolve(gatewayModulePath)];
const gatewayModule = require(gatewayModulePath);
const safeOutput = {
  plainLanguageSummary: 'This is a preparation summary, not a legal conclusion.',
  likelyNextPath: 'Review the organized information.',
  missingInformation: [],
  reviewRecommendation: 'Review and correct the information before relying on it.',
  safetyNotes: ['This is not legal advice and does not create an attorney-client relationship.']
};
const unsafeOutput = { ...safeOutput, plainLanguageSummary: 'This is legal advice.' };
ok(gatewayModule.validateOutput(safeOutput).ok, 'safe negative legal disclaimer is still rejected by AI validator');
ok(!gatewayModule.validateOutput(unsafeOutput).ok, 'affirmative legal-advice claim is not rejected by AI validator');

for (const [relative, expected] of baseHashes.entries()) {
  if (modified.has(relative)) continue;
  const deployed = path.join(target, relative);
  ok(fs.existsSync(deployed), `unchanged predecessor file missing: ${relative}`);
  ok(sha(deployed) === expected, `unchanged PRE123 file mutated: ${relative}`);
}

const changedHashes = {};
for (const relative of [...modified].sort()) {
  const absolute = path.join(target, relative);
  if (fs.existsSync(absolute)) changedHashes[relative] = sha(absolute);
}
const receipt = {
  schemaVersion: 'smarter-justice.pre124.completion-receipt.v1',
  release: 'v2.0.0-pre124',
  baseRelease: 'v2.0.0-pre123',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  navigatorOrCommunityMutation: false,
  stripeMutation: true,
  paymentSetupDeferredByOwner: false,
  paymentSetupAuthorizedByOwner: true,
  changes: {
    aiProviderValidation: 'SAFE_NEGATIVE_DISCLAIMERS_ALLOWED_AFFIRMATIVE_LEGAL_CLAIMS_REJECTED',
    publicCopyGuard: true,
    publicPagesScrubbed,
    publicPagesGuarded,
    publicPagesAudited: auditedPublicPages,
    individualMembershipPrice: '$10/month or $100/year',
    otherApprovedPricesPreserved: ['$29/month or $290/year', '$49/month or $490/year'],
    freeListingPaidAccessBoundaryPreserved: true
  },
  changedHashes,
  providerLiveSmokeRequiredAfterDeploy: true,
  predecessorUnchangedFilesHashVerified: true,
  preferredPositioning,
  generatedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, 'PRE124_COMPLETION_RECEIPT.json'), JSON.stringify(receipt, null, 2) + '\n');

const marker = {
  schemaVersion: 'smarter-justice.pre124.render-bootstrap.v1',
  release: 'v2.0.0-pre124',
  baseRelease: 'v2.0.0-pre123',
  deploymentStrategy: 'EXACT_PRE123_RUNTIME_PLUS_AUDITED_PRE124_COMPLETION_PATCH',
  productAuthority: 'SMARTER_JUSTICE_ONLY',
  navigatorOrCommunityMutation: false,
  stripeMutation: true,
  paymentSetupDeferredByOwner: false,
  paymentSetupAuthorizedByOwner: true,
  providerKeyValueNeverExposed: true,
  providerLiveSmokeRequired: true,
  productionDeploymentAuthorized: true,
  runtimeFiles: filesUnder(target).filter(name => !/^\.pre\d+-render-bootstrap\.json$/.test(path.basename(name))).length,
  preparedAt: new Date().toISOString()
};
fs.writeFileSync(path.join(target, '.pre124-render-bootstrap.json'), JSON.stringify(marker, null, 2) + '\n');
console.log(`[PRE124 DEPLOY] qualified no-loss PRE124 prepared; ${auditedPublicPages} public pages audited; production billing integration authorized`);
