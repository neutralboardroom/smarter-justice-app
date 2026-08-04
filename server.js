const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');
const { URL } = require('url');
const { PRACTICE_AREAS, listPracticeSummaries, getPracticeBySlug } = require('./data/practiceAreas');
const { PORTALS, listPortalSummaries, getPortalBySlug, recommendPortalForPractice, recommendPortalsForStory } = require('./data/portals');
const { OFFICIAL_SOURCE_CATALOG, FORM_READINESS_LEVELS, listCatalog } = require('./data/officialSourceCatalog');
const { FORM_PATHS, FORM_PATH_READINESS, recommendFormPaths, evaluateFormPathReadiness } = require('./data/formPaths');
const { schemaForPractice, DEFAULT_DOCUMENT_TYPES } = require('./data/intakeSchemas');
const { MATTER_PATHS, schemaForMatterPath } = require('./data/matterPaths');
const { REVIEW_READY_DRAFT_LEVELS, REVIEW_READY_DRAFT_PATHS, buildReviewReadyDraftEvaluation } = require('./data/reviewReadyDrafts');
const { US_STATES } = require('./data/jurisdictions');
const store = require('./lib/store');
const mailer = require('./lib/mailer');
const { buildStartingPoint, inferPractice } = require('./lib/router');
const aiProviders = require('./lib/aiProviders');
const controlCenter = require('./lib/controlCenter');
const legalPortalWorkspace = require('./lib/legalPortalWorkspace');
const crossPortalRegistryControls = require('./lib/crossPortalRegistryControls');
const portfolioTruth = require('./lib/portfolioTruth');
const legalNetworkActionCenter = require('./lib/legalNetworkActionCenter');
const buildProgram = require('./lib/buildProgram');
const domainRegistry = require('./lib/domainRegistry');
const pilotProgram = require('./lib/pilotProgram');
const professionalPromotionProgram = require('./lib/professionalPromotionProgram');
const paidPilotOperations = require('./lib/paidPilotOperations');
const revenueAccessModel = require('./lib/revenueAccessModel');
const publicPaidServices = require('./lib/publicPaidServices');
const fieldLaunchProgram = require('./lib/fieldLaunchProgram');
const { PORTAL_INTEGRATION_STANDARD_VERSION, ORIGIN_STORY_STANDARD_VERSION, APPROVED_ORIGIN_SENTENCE, PORTAL_INTEGRATION_CONTRACTS } = require('./data/portalIntegrationContracts');
const { FOUNDING_LAUNCH_VERSION, listFoundingLaunchPortals, getFoundingLaunchPortal } = require('./data/foundingLaunchPortals');
const { INITIAL_LAUNCH_PILOT_VERSION, listInitialLaunchPilots } = require('./data/initialLaunchPilots');
const professionalMarketplace = require('./lib/professionalMarketplace');
const professionalNetwork = require('./lib/professionalNetwork');
const portalPresenceManagement = require('./lib/portalPresenceManagement');
const professionalPortalAdapterLab = require('./lib/professionalPortalAdapterLab');
const masterRules = require('./data/masterRulesPack');
const professionalSources = require('./lib/publicProfessionalDataSources');
const professionalAccounts = require('./lib/professionalAccounts');
const ownerAccounts = require('./lib/ownerAccounts');
const operationalReadiness = require('./lib/operationalReadiness');
const migrations = require('./lib/migrations');
const security = require('./lib/accountSecurity');
const { INNOVATION_LAB_V1725 } = require('./data/innovationLabV1725');
const { TRUST_VERIFICATION_RESEARCH_V1725 } = require('./data/trustVerificationResearchV1725');
const launchCommandCenter = require('./lib/launchCommandCenter');
const launchActivation = require('./lib/launchActivation');
const launchCohortOperations = require('./lib/launchCohortOperations');
const launchOutreachOperations = require('./lib/launchOutreachOperations');
const serviceReadiness = require('./lib/serviceReadiness');
const launchDayOperations = require('./lib/launchDayOperations');
const legalPortfolioOperatingSystem = require('./lib/legalPortfolioOperatingSystem');
const attorneyPartnerTour = require('./lib/attorneyPartnerTour');
const professionalLifecycleGovernance = require('./lib/professionalLifecycleGovernance');
const initialPortalAuthority = require('./lib/initialPortalAuthority');
const reusableBuildGovernance = require('./lib/reusableBuildGovernance');
const ownerActionReadiness = require('./lib/ownerActionReadiness');
const portalAuthorityDiscovery = require('./lib/portalAuthorityDiscovery');
const commercialTerms = require('./lib/commercialTerms');
const publicFreemium = require('./lib/publicFreemium');
const fifthPassGovernance = require('./lib/fifthPassGovernance');
const eighthPassGovernance = require('./lib/eighthPassGovernance');
const currentReleaseTruth = require('./lib/currentReleaseTruth');
const detachedFinalIdentity = require('./lib/detachedFinalIdentity');
const ownerLaunchActionPacket = require('./lib/ownerLaunchActionPacket');
const coordinatedPromptPack = require('./lib/coordinatedPromptPack');
const deploymentReadiness = require('./lib/deploymentReadiness');
const launchDayOrchestration = require('./lib/launchDayOrchestration');
const professionalIdentityEvidenceRegistry = require('./lib/professionalIdentityEvidenceRegistry');
const portfolioLaunchReadiness = require('./lib/portfolioLaunchReadiness');
const providerPreflight = require('./lib/providerPreflight');
const providerDiscoveryPlan = require('./lib/providerDiscoveryPlan');
const providerDiscoveryAuthorization = require('./lib/providerDiscoveryAuthorization');
const providerDiscoveryAuthorizationLifecycle = require('./lib/providerDiscoveryAuthorizationLifecycle');
const strategicWorkflowGovernance = require('./lib/strategicWorkflowGovernance');
const journeyHandoffPlanner = require('./lib/journeyHandoffPlanner');
const continuousImprovement = require('./lib/continuousImprovement');
const releaseEvidenceCoverage = require('./lib/releaseEvidenceCoverage');
const centralAiGateway = require('./lib/centralAiGateway');
const openAiLaunchGovernance = require('./lib/openAiLaunchGovernance');
const unifiedLiveOperations = require('./lib/unifiedLiveOperations');
const v14ReleaseGovernance = require('./lib/v14ReleaseGovernance');
const v14LiveEvidenceConnector = require('./lib/v14LiveEvidenceConnector');
const v14ReleaseReceiptAutomation = require('./lib/v14ReleaseReceiptAutomation');
const v14EvidenceBatchWorkspace = require('./lib/v14EvidenceBatchWorkspace');
const v14DetachedDeliveryReceipt = require('./lib/v14DetachedDeliveryReceipt');
const v14EvidenceReadinessPlanner = require('./lib/v14EvidenceReadinessPlanner');
const v14SegmentedAcceptanceRunner = require('./lib/v14SegmentedAcceptanceRunner');
const v14EvidenceCollectionPacket = require('./lib/v14EvidenceCollectionPacket');
const v14AcceptanceEvidenceBundle = require('./lib/v14AcceptanceEvidenceBundle');
const v14AcceptanceManifest = require('./ACCEPTANCE_SUITE_MANIFEST_V1.7.83.json');

const VERSION = '1.7.83';
const PUBLIC = path.join(__dirname, 'public');
const MAX_UPLOADS_PER_REQUEST = Number(process.env.MAX_UPLOADS_PER_REQUEST || 6);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 8 * 1024 * 1024);
const ALLOWED_UPLOAD_EXTENSIONS = (process.env.ALLOWED_UPLOAD_EXTENSIONS || '.pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.rtf,.eml,.msg').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const ALLOWED_UPLOAD_MIME_PREFIXES = (process.env.ALLOWED_UPLOAD_MIME_PREFIXES || 'application/pdf,image/,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument,application/rtf,message/rfc822,application/octet-stream').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const WEBHOOK_TOLERANCE_SECONDS = Number(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS || 300);
const BODY_LIMIT_BYTES = Number(process.env.BODY_LIMIT_BYTES || 14 * 1024 * 1024);
let BASE_URL = process.env.APP_BASE_URL || 'http://localhost:' + (process.env.PORT || 3000);
const OWNER_EMAIL = String(process.env.OWNER_NOTIFICATION_EMAIL || '').trim();
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 80);
const rateBuckets = new Map();
const STAFF_SESSION_COOKIE = 'sj_staff_session';
const STAFF_SESSION_HOURS = Math.max(1, Math.min(12, Number(process.env.STAFF_SESSION_HOURS || 8)));
const CONTINUATION_TOKEN_DAYS = Math.max(1, Math.min(365, Number(process.env.CONTINUATION_TOKEN_DAYS || 180)));

function envFlag(name){ return /^(1|true|yes|on)$/i.test(String(process.env[name] || '').trim()); }
function safeHttpsUrl(value){
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'https:' ? url.toString() : '';
  } catch { return ''; }
}
const STOP_DOMESTIC_VIOLENCE_URL = safeHttpsUrl(process.env.PORTAL_DOMESTIC_VIOLENCE_AID_URL || process.env.STOP_DOMESTIC_VIOLENCE_URL || process.env.PORTAL_DOMESTIC_VIOLENCE_SUPPORT_URL || '');
const STOP_SIGN_PROJECT_DESTINATION_VERIFIED = envFlag('DOMESTIC_VIOLENCE_AID_DESTINATION_VERIFIED') || envFlag('STOP_SIGN_PROJECT_DESTINATION_VERIFIED');
const STOP_DOMESTIC_VIOLENCE_ARTWORK_PATH = /^\/[A-Za-z0-9_./-]+$/.test(String(process.env.STOP_DOMESTIC_VIOLENCE_ARTWORK_PATH || '/images/stop-sign-project.png').trim()) ? String(process.env.STOP_DOMESTIC_VIOLENCE_ARTWORK_PATH || '/images/stop-sign-project.png').trim() : '';

function securityHeaders(extra={}){
  const tawkConfigured = Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID);
  const scriptSources = tawkConfigured ? "'self' https://embed.tawk.to" : "'self'";
  const connectSources = tawkConfigured ? "'self' https://*.tawk.to wss://*.tawk.to" : "'self'";
  const frameSources = tawkConfigured ? "https://*.tawk.to" : "'none'";
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': `default-src 'self'; img-src 'self' data: https://api.qrserver.com https://*.tawk.to; script-src ${scriptSources}; style-src 'self' 'unsafe-inline'; connect-src ${connectSources}; frame-src ${frameSources}; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://checkout.stripe.com`,
    ...extra
  };
  if (process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER)) headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  return headers;
}
function sendResponse(res, status, headers, body){
  const response = { status, headers, body:Buffer.isBuffer(body) ? body : Buffer.from(String(body)) };
  if (res.__deferResponse) { if (!res.__pendingResponse) res.__pendingResponse = response; return; }
  res.writeHead(response.status, response.headers);
  res.end(response.body);
}
function commitDeferredResponse(res){
  const response = res.__pendingResponse;
  res.__pendingResponse = null;
  if (!response || res.writableEnded) return;
  res.writeHead(response.status, response.headers);
  res.end(response.body);
}
function json(res, status, data){
  const body = JSON.stringify(data, null, 2);
  sendResponse(res, status, securityHeaders({ 'Content-Type':'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store' }), body);
}
function readinessJson(res, status, data){
  const body = JSON.stringify(data, null, 2);
  const headers = securityHeaders({ 'Content-Type':'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store, max-age=0', 'X-Robots-Tag':'noindex, nofollow, noarchive' });
  if (status === 503) headers['Retry-After'] = String(data.retryAfterSeconds || 60);
  sendResponse(res, status, headers, body);
}
function jsonWithCookie(res, status, data, cookies){
  const body = JSON.stringify(data, null, 2);
  const headers = securityHeaders({ 'Content-Type':'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store' });
  if (cookies) headers['Set-Cookie'] = Array.isArray(cookies) ? cookies.filter(Boolean) : cookies;
  sendResponse(res, status, headers, body);
}
function text(res, status, body, type='text/plain; charset=utf-8'){
  sendResponse(res, status, securityHeaders({ 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store' }), body);
}
function trustProxy(){ return Boolean(process.env.RENDER) || envFlag('TRUST_PROXY'); }
function getIp(req){
  const forwarded = trustProxy() ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
  return forwarded || req.socket.remoteAddress || 'unknown';
}
function rateLimit(req, routeKey, options = {}){
  if (process.env.NODE_ENV === 'test') return null;
  const maxRequests = Math.max(1, Number(options.maxRequests || RATE_LIMIT_MAX));
  const windowMs = Math.max(1000, Number(options.windowMs || RATE_LIMIT_WINDOW_MS));
  const key = `${getIp(req)}:${routeKey}`;
  const now = Date.now();
  const current = rateBuckets.get(key) || { count: 0, reset: now + windowMs };
  if (now > current.reset) { current.count = 0; current.reset = now + windowMs; }
  current.count += 1; rateBuckets.set(key, current);
  if (current.count > maxRequests) return { retryAfterSeconds: Math.ceil((current.reset - now) / 1000) };
  return null;
}
function readBody(req){
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (Buffer.byteLength(data) > BODY_LIMIT_BYTES) { reject(new Error('Body too large')); req.destroy(); }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
function readRawBody(req, limitBytes=BODY_LIMIT_BYTES){
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > limitBytes) { reject(new Error('Body too large')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function parseJson(req){
  const raw = await readBody(req);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (err) { err.statusCode = 400; throw err; }
}
function mimeFor(filePath){
  const ext = path.extname(filePath).toLowerCase();
  return ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json; charset=utf-8'})[ext] || 'application/octet-stream';
}
function serveStatic(req, res, pathname){
  let p = pathname === '/' ? '/index.html' : pathname;
  if (!path.extname(p)) p += '.html';
  const target = path.normalize(path.join(PUBLIC, p));
  if (!target.startsWith(PUBLIC)) return text(res, 403, 'Forbidden');
  fs.readFile(target, (err, data) => {
    if (err) return text(res, 404, 'Not found');
    const ext = path.extname(target).toLowerCase();
    const publicAsset = ['.css','.js','.svg','.png','.jpg','.jpeg','.webp','.ico'].includes(ext);
    const safetySensitivePage = p === '/domestic-violence-aid.html';
    const protectedPage = new Set([
      '/admin.html','/staff.html','/control-center.html','/dashboard.html','/next-path.html',
      '/checkout-success.html','/checkout-cancel.html','/launch-readiness.html','/production-readiness.html',
      '/ai-summary.html','/professional-login.html','/professional-signup.html','/professional-dashboard.html',
      '/owner-login.html','/internal-access.html','/partner-flyer.html','/professional-network.html','/portal-profile-acceptance.html'
    ]).has(p);
    const headers = {
      'Content-Type': mimeFor(target),
      'Content-Length': data.length,
      'Cache-Control': safetySensitivePage ? 'no-store, max-age=0' : (publicAsset ? 'public, max-age=86400, stale-while-revalidate=604800' : 'no-cache')
    };
    if (protectedPage || safetySensitivePage) headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive';
    if (safetySensitivePage) headers['Referrer-Policy'] = 'no-referrer';
    res.writeHead(200, securityHeaders(headers));
    res.end(data);
  });
}

function publicAttachment(a){
  if (!a) return null;
  return {
    id: a.id || '',
    name: a.name || '',
    originalName: a.originalName || a.name || '',
    documentType: a.documentType || '',
    mimeType: a.mimeType || '',
    sizeBytes: Number(a.sizeBytes || 0),
    uploadedAt: a.uploadedAt || '',
    uploadState: a.uploadState || 'saved for review'
  };
}
function normalizeAiPreference(value){ return String(value || '').trim().toLowerCase() === 'ai-assisted' ? 'ai-assisted' : 'rules-only'; }
function publicAiReview(review){
  if (!review) return null;
  const externalAiUsed = review.mode === 'ai-provider' || review.externalAiUsed === true;
  return {
    plainLanguageSummary: review.plainLanguageSummary || '',
    likelyNextPath: review.likelyNextPath || '',
    missingInformation: Array.isArray(review.missingInformation) ? review.missingInformation.slice(0,20) : [],
    reviewRecommendation: review.reviewRecommendation || '',
    safeUseNotice: review.safeUseNotice || '',
    safetyNotes: Array.isArray(review.safetyNotes) ? review.safetyNotes.slice(0,20) : [],
    externalAiUsed,
    assistanceLabel: externalAiUsed ? 'AI-assisted organization' : 'Guided rules-based organization',
    availabilityNote: review.fallbackReason || ''
  };
}
function publicAnalysis(value){
  if (!value || typeof value !== 'object') return value || null;
  const copy = JSON.parse(JSON.stringify(value));
  if (copy.aiReview) copy.aiReview = publicAiReview(copy.aiReview);
  return copy;
}
async function buildAssistanceReview({preference,caseInput,analysis}){
  return normalizeAiPreference(preference) === 'ai-assisted'
    ? aiProviders.generateMatterReview({caseInput,analysis})
    : aiProviders.buildFallbackAiReview({caseInput,analysis});
}
function publicCase(c){
  if (!c) return null;
  const privateAccessToken = c.continuationToken || c.publicAccessToken || '';
  const analysis = publicAnalysis(c.analysis);
  const aiPreference = normalizeAiPreference(c.aiPreference);
  const publicReview = publicAiReview(c.analysis?.aiReview);
  return {
    id: privateAccessToken,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    fullName: c.fullName,
    email: c.email,
    practiceSlug: c.practiceSlug,
    practiceName: c.practiceName,
    subcategory: c.subcategory,
    jurisdiction: c.jurisdiction,
    status: c.status,
    humanReviewLane: c.humanReviewLane,
    professionalReviewLane: c.professionalReviewLane,
    paymentStatus: c.paymentStatus,
    deliveryStatus: c.deliveryStatus || 'not ready for delivery',
    attachments: (c.attachments || []).map(publicAttachment).filter(Boolean),
    documentType: c.documentType || '',
    deadlineDate: c.deadlineDate || '',
    dateReceived: c.dateReceived || '',
    desiredHelp: c.desiredHelp || '',
    smartAnswers: c.smartAnswers || {},
    futureLeadFieldsCaptured: c.futureLeadFieldsCaptured || {},
    analysis,
    matterPath: analysis?.matterPath || null,
    correctNextPath: analysis?.correctNextPath || c.correctNextPath || '',
    dynamicMissingInformation: analysis?.dynamicMissingInformation || [],
    aiReview: publicReview,
    aiPreference,
    assistanceMode: publicReview?.externalAiUsed ? 'AI-assisted organization' : (aiPreference === 'ai-assisted' ? 'Rules-based guidance used after an AI request' : 'Guided rules-based organization'),
    externalAiUsed:Boolean(publicReview?.externalAiUsed),
    aiPreferenceUpdatedAt:c.aiPreferenceUpdatedAt || c.aiConsentAt || '',
    verifiedFormPaths: analysis?.verifiedFormPaths || [],
    missingInformation: analysis?.missingInformation || [],
    continuationLink: c.continuationLink,
    tokenExpiresAt: c.tokenExpiresAt || '',
    formDraftStatus: c.formDraftStatus || 'not generated yet',
    draftPackageReady: Boolean(c.draftPackageReady),
    referralCode: c.referralCode || '',
    userFacingNote: c.userFacingNote || '',
    userActionNeeded: c.userActionNeeded || '',
    moreInfoRequestedAt: c.moreInfoRequestedAt || '',
    uploadWarnings: c.uploadWarnings || [],
    formPathEvaluation: c.formPathEvaluation || c.analysis?.formPathEvaluation || null,
    reviewReadyDraft: c.reviewReadyDraft || c.analysis?.reviewReadyDraft || null,
    reviewReadyDraftStatus: c.reviewReadyDraftStatus || 'not reviewed yet',
    reviewReadyDraftApprovedAt: c.reviewReadyDraftApprovedAt || '',
    reviewReadyDraftOverrides: c.reviewReadyDraftOverrides || {},
    reviewReadyDraftFieldNotes: c.reviewReadyDraftFieldNotes || '',
    recommendedPortal: c.recommendedPortal || analysis?.recommendedPortal || null,
    portalRouting: analysis?.portalRouting || null,
    paymentRequestedAt: c.paymentRequestedAt || '',
    paymentConfirmedAt: c.paymentConfirmedAt || '',
    paidServiceOrders: publicPaidServices.publicOrdersForCase(c.id)
  };
}

function findUserCase(token){
  const value = String(token || '').trim();
  if (!value) return null;
  const record = store.allCases().find(c => c.continuationToken === value || c.publicAccessToken === value) || null;
  if (!record || record.continuationAccessRevokedAt) return null;
  if (record.tokenExpiresAt && Date.parse(record.tokenExpiresAt) <= Date.now()) return null;
  return record;
}

function requestBearerToken(req){
  const value = String(req.headers.authorization || '');
  return /^Bearer\s+/i.test(value) ? value.replace(/^Bearer\s+/i, '').trim() : '';
}
function staffSessionValid(req){
  const token = security.parseCookies(req)[STAFF_SESSION_COOKIE] || '';
  const secret = String(process.env.ADMIN_TOKEN || '').trim();
  if (!token || secret.length < 24) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch { return false; }
  if (!payload || Number(payload.expiresAt || 0) <= Date.now()) return false;
  const expected = crypto.createHmac('sha256', secret).update(parts[0]).digest('base64url');
  return security.timingSafeTextEqual(expected, parts[1]);
}
function issueStaffSession(){
  const secret = String(process.env.ADMIN_TOKEN || '').trim();
  if (secret.length < 24) return null;
  const encoded = Buffer.from(JSON.stringify({ expiresAt:Date.now()+STAFF_SESSION_HOURS*3600000, nonce:crypto.randomBytes(16).toString('base64url') })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}
function staffSessionCookie(token, clear=false){ return security.cookie(STAFF_SESSION_COOKIE, token, { clear, maxAgeSeconds:STAFF_SESSION_HOURS*3600, sameSite:'Strict' }); }
function requireAdmin(req, urlObj){
  if (staffSessionValid(req)) return true;
  const headerToken = String(req.headers['x-admin-token'] || '').trim();
  const bearerToken = requestBearerToken(req);
  const allowQuery = /^true|1|yes$/i.test(String(process.env.ALLOW_ADMIN_TOKEN_QUERY || ''));
  const queryToken = allowQuery ? String(urlObj.searchParams.get('token') || '').trim() : '';
  const token = headerToken || bearerToken || queryToken;
  const configured = String(process.env.ADMIN_TOKEN || '').trim();
  if (!token || !configured || token.length !== configured.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(configured));
}
function requireOwner(req){
  if (ownerAccounts.accountFromRequest(req)) return true;
  const legacyAllowed = process.env.NODE_ENV !== 'production' || /^true|1|yes$/i.test(String(process.env.ALLOW_LEGACY_OWNER_TOKEN || ''));
  if (!legacyAllowed) return false;
  const headerToken = String(req.headers['x-owner-control-token'] || '').trim();
  const bearerToken = requestBearerToken(req);
  const token = headerToken || bearerToken;
  const configured = String(process.env.OWNER_CONTROL_CENTER_TOKEN || '').trim();
  if (!token || !configured || token.length !== configured.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(configured));
}
function requireRulesPackAccess(req){
  if (requireOwner(req)) return true;
  const headerToken = String(req.headers['x-portal-rules-token'] || '').trim();
  const configured = String(process.env.PORTAL_RULES_API_TOKEN || '').trim();
  if (!headerToken || !configured || headerToken.length !== configured.length) return false;
  return crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(configured));
}
function requirePartnerAccess(req, urlObj, partner){
  const headerToken = String(req.headers['x-partner-access'] || '').trim();
  const bearerToken = requestBearerToken(req);
  const token = headerToken || bearerToken;
  const configured = String(partner?.accessToken || '').trim();
  if (!token || !configured || token.length !== configured.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(configured));
}
function csrfProtectionEnabled(){ return process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER) || envFlag('ENFORCE_CSRF_PROTECTION'); }
function requestUsesAuthenticatedCookie(req){
  const cookies = security.parseCookies(req);
  return Boolean(cookies[ownerAccounts.SESSION_COOKIE] || cookies[professionalAccounts.SESSION_COOKIE] || cookies[STAFF_SESSION_COOKIE]);
}
function csrfExemptPath(pathName){
  return new Set([
    '/api/owner/auth/login','/api/professional/auth/signup','/api/professional/auth/login',
    '/api/professional/auth/email-verification/request','/api/professional/auth/email-verification/confirm',
    '/api/professional/auth/password-reset/request','/api/professional/auth/password-reset/confirm',
    '/api/staff/auth/login'
  ]).has(pathName);
}
function csrfCookieForRequest(req){ return security.csrfCookie(security.csrfTokenFromRequest(req) || security.generateCsrfToken()); }
function validateCsrf(req){
  const forwardedProto = trustProxy() ? String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() : '';
  const protocol = forwardedProto ? `${forwardedProto}:` : (BASE_URL.startsWith('https:') ? 'https:' : 'http:');
  const allowedOrigins = [BASE_URL, ...String(process.env.CSRF_ALLOWED_ORIGINS || '').split(',').map(x=>x.trim()).filter(Boolean)];
  return security.validateCsrfRequest(req, { allowedOrigins, requestHost:String(req.headers.host || ''), requestProtocol:protocol });
}
function sensitiveTrafficGateEnforced(){ return process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER) || envFlag('ENFORCE_SENSITIVE_TRAFFIC_GATE'); }
function sensitiveCasePath(pathName){
  return pathName === '/api/free-question' || /^\/api\/cases\//.test(pathName) || pathName === '/api/checkout' || pathName === '/api/checkout/confirm' || pathName === '/api/admin/cases' || /^\/api\/admin\/cases\//.test(pathName) || new Set(['/api/contact','/api/help','/api/public/profile-requests','/api/community-partners/register','/api/professional-membership-interest','/api/professional-launch-interest']).has(pathName);
}
function sensitiveUnavailable(res){ return json(res,503,{ok:false,error:'This form is temporarily unavailable because protected storage and operating approval are not active. No information was saved. Free device-only tools and the non-saved starting-point tool remain available.',safeAlternative:'/free-tools.html'}); }
function makeContinuationLink(token){ return `${BASE_URL.replace(/\/$/,'')}/dashboard.html?case=${encodeURIComponent(token)}`; }
function notification(kind, payload){
  const userKinds = new Set(['free_question_received','private_continuation_link_requested','more_information_needed','payment_received','payment_received_webhook','file_ready','case_upload_added']);
  const to = String(userKinds.has(kind) && payload?.email ? payload.email : OWNER_EMAIL).trim();
  const delivery = !to ? 'spooled-no-recipient' : (mailer.configured() ? 'smtp-queued' : 'spooled-no-smtp');
  const envelope=professionalLifecycleGovernance.notificationEnvelope(kind,payload,{purpose:'Minimum necessary workflow notice.'});
  const suppliedKey=String(payload?.idempotencyKey||'').trim();
  if(suppliedKey){
    const duplicate=store.notifications().find(item=>item.idempotencyKeyHash===envelope.idempotencyKeyHash);
    if(duplicate)return {...duplicate,duplicateSuppressed:true};
  }
  const note = store.addNotification({ kind, to, payload:envelope.safePayload, safePayload:envelope.safePayload, delivery, ...envelope });
  store.addAudit({ actor: 'system', action: `notification:${kind}`, caseId: envelope.safePayload.caseId || '', details: { recipientConfigured:Boolean(to),classification:envelope.classification,idempotencyKeyHash:envelope.idempotencyKeyHash,workflowStateIndependent:true } });
  if (to) mailer.sendNotification(note).then(result => {
    store.addAudit({ actor:'system', action:result.sent?'email_sent':'email_not_sent', caseId: envelope.safePayload.caseId || '', details:{ kind,classification:envelope.classification,providerMessageId:result.providerMessageId||'',reason:result.reason||'',accepted:result.accepted||0,rejected:result.rejected||0 } });
  }).catch(err => store.addAudit({ actor:'system', action:'email_send_failed', caseId: envelope.safePayload.caseId || '', details:{ kind,classification:envelope.classification,error:cleanPublicError(err.message) } }));
  return note;
}
function decodeBase64Attachment(a){
  const raw = String(a && a.dataBase64 || '');
  const payload = raw.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  if (!payload) return null;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(payload) || payload.length % 4 === 1) return null;
  try {
    const buffer = Buffer.from(payload, 'base64');
    if (!buffer.length || buffer.toString('base64').replace(/=+$/,'') !== payload.replace(/=+$/,'')) return null;
    return buffer;
  } catch { return null; }
}
function estimateAttachmentBytes(a){
  const buffer = decodeBase64Attachment(a);
  if (buffer) return buffer.length;
  return Number(a && a.sizeBytes || 0);
}
function uploadMimeAllowed(mime){
  const m = String(mime || '').toLowerCase();
  if (!m) return true;
  return ALLOWED_UPLOAD_MIME_PREFIXES.some(prefix => m === prefix || (prefix.endsWith('/') && m.startsWith(prefix)) || m.startsWith(prefix));
}
function attachmentSignatureMatches(ext, buffer){
  if (!buffer) return false;
  const ascii = buffer.subarray(0,12).toString('ascii');
  if (ext === '.pdf') return ascii.startsWith('%PDF-');
  if (ext === '.png') return buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (ext === '.jpg' || ext === '.jpeg') return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (ext === '.webp') return ascii.startsWith('RIFF') && ascii.slice(8,12) === 'WEBP';
  if (ext === '.docx') return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  if (['.txt','.csv','.rtf','.eml'].includes(ext)) {
    const sample=buffer.subarray(0,2048); let printable=0;
    for(const byte of sample) if(byte===9||byte===10||byte===13||(byte>=32&&byte<=126)||byte>=128) printable++;
    return !sample.length || printable/sample.length > 0.92;
  }
  return ['.doc','.msg'].includes(ext); // Legacy binary formats remain quarantined for human review.
}
function normalizeAttachmentInputs(inputs){
  const warnings = [];
  const raw = Array.isArray(inputs) ? inputs : [];
  if (raw.length > MAX_UPLOADS_PER_REQUEST) warnings.push(`Only ${MAX_UPLOADS_PER_REQUEST} uploads were accepted in one request.`);
  const accepted = raw.slice(0, MAX_UPLOADS_PER_REQUEST).map(a => {
    if (!a || !a.name) return null;
    const originalName = String(a.name || 'upload');
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) { warnings.push(`${originalName} was not saved because that file type is not accepted yet.`); return null; }
    if (!uploadMimeAllowed(a.mimeType || a.type || '')) { warnings.push(`${originalName} was not saved because the file type could not be verified.`); return null; }
    const buffer = decodeBase64Attachment(a);
    if (!buffer) { warnings.push(`${originalName} was not saved because its contents could not be read safely.`); return null; }
    if (buffer.length > MAX_UPLOAD_BYTES) { warnings.push(`${originalName} was not saved because it is larger than the upload limit.`); return null; }
    if (!attachmentSignatureMatches(ext, buffer)) { warnings.push(`${originalName} was not saved because its contents did not match the file name.`); return null; }
    return { ...a, sizeBytes: buffer.length, originalExtension: ext, uploadState: 'quarantined-awaiting-review' };
  }).filter(Boolean);
  return { accepted, warnings };
}
function collectSmartAnswers(body){
  const smart = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (key.startsWith('smart_')) smart[key.slice(6)] = String(value || '').slice(0, 700);
  }
  for (const key of ['documentType','dateReceived','deadlineDate','courtOrAgency','agencyOrCourt','opposingParty','amountInvolved','desiredHelp','taxPrepOrResolution','taxYears','taxYear','noticeNumber','incomeSource','householdSize','assets','bankAccounts','monthlyIncome','monthlyExpenses','proposedMonthlyPayment','filingStatus','dependents','entityType','businessName','ownerNames','registeredAgent','accidentDate','injuries','policeReport','insuranceCompany','claimNumber','medicalBills','incidentDate','providerName','injuryDescription','recordsRequested','conditions','doctors','medications','workHistory','appealLevel','markText','ownerName','goodsServices','firstUseDate','specimenAvailable']) {
    if (body[key]) smart[key] = String(body[key]).slice(0, 700);
  }
  return smart;
}
function enrichQuestion(body){
  const smart = collectSmartAnswers(body);
  return [
    body.question || '',
    body.documentType ? `Document type: ${body.documentType}` : '',
    body.noticeOrDeadline ? `Notice or deadline details: ${body.noticeOrDeadline}` : '',
    body.deadlineDate ? `Deadline/date shown: ${body.deadlineDate}` : '',
    body.dateReceived ? `Date received: ${body.dateReceived}` : '',
    body.agencyOrCourt ? `Agency, court, company, or office: ${body.agencyOrCourt}` : '',
    body.courtOrAgency ? `Court, agency, company, or office: ${body.courtOrAgency}` : '',
    body.opposingParty ? `Other party involved: ${body.opposingParty}` : '',
    body.amountInvolved ? `Amount involved: ${body.amountInvolved}` : '',
    body.desiredHelp ? `Requested help: ${body.desiredHelp}` : '',
    body.urgency ? `Urgency selected: ${body.urgency}` : '',
    body.zipCode ? `ZIP code: ${body.zipCode}` : '',
    Object.entries(smart).filter(([k]) => !['documentType','dateReceived','deadlineDate','courtOrAgency','agencyOrCourt','opposingParty','amountInvolved','desiredHelp'].includes(k)).map(([k,v]) => `${k.replace(/([A-Z])/g,' $1')}: ${v}`).join('\n')
  ].filter(Boolean).join('\n');
}
function makePartnerCode(name, custom){
  const base = (custom || name || 'partner').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 14) || 'PARTNER';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `${base}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    if (!store.allPartners().some(p => p.code === code)) return code;
  }
  return `${base}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}
function publicPartner(partner){
  if (!partner) return null;
  return {
    code: partner.code,
    name: partner.name,
    type: partner.type || '',
    createdAt: partner.createdAt || '',
    dashboardUrl: partner.dashboardUrl || '',
    flyerUrl: partner.flyerUrl || ''
  };
}
function publicReferralStart(c){
  const credited = /paid|waived/i.test(String(c.paymentStatus || ''));
  return {
    createdAt: c.createdAt || '',
    startStatus: credited ? 'Credited start' : 'Started',
    creditStatus: credited ? 'Credit recorded' : 'No credit recorded yet'
  };
}
function svgQr(data){
  const size = 260;
  const encoded = encodeURIComponent(String(data || BASE_URL).slice(0, 900));
  const qrProvider = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&format=png&margin=10&data=${encoded}`;
  const label = String(data || 'Smarter Justice tracked start link').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Tracked Smarter Justice QR code"><title>${label}</title><rect width="${size}" height="${size}" rx="18" fill="#fff"/><image href="${qrProvider}" x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/><desc>Scannable QR code generated for the tracked Community Partner start link.</desc></svg>`;
}
function htmlEscape(str){ return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function currentStorageMode(){
  return store.storageStatus().mode;
}
function sensitiveTrafficApproved(){
  const explicitlyApproved = /^(1|true|yes)$/i.test(String(process.env.SENSITIVE_TRAFFIC_APPROVED || ''));
  return Boolean(explicitlyApproved && store.storageStatus().operationalForSensitiveTraffic && ownerAccounts.status().mfaRequiredForAll);
}
function launchReadinessChecklist(){
  const storage = store.storageStatus();
  const ownerAuth = ownerAccounts.status();
  const item = (key, ok, message, required=true) => ({ key, ok:Boolean(ok), message, required });
  const items = [
    item('adminToken', String(process.env.ADMIN_TOKEN || '').trim().length >= 24, 'Set a long ADMIN_TOKEN before staff use.'),
    item('ownerAccount', ownerAuth.accountAuthenticationReady, 'Configure the owner account with a strong password and short-lived session access.'),
    item('ownerMfa', ownerAuth.mfaRequiredForAll, 'Enable authenticator MFA and store owner recovery codes securely.'),
    item('sensitiveTrafficOwnerApproval', /^(1|true|yes)$/i.test(String(process.env.SENSITIVE_TRAFFIC_APPROVED || '')), 'Keep SENSITIVE_TRAFFIC_APPROVED=false until storage, security, legal, operational, real-device, and owner acceptance evidence is complete.'),
    item('legacyOwnerTokenDisabled', process.env.NODE_ENV !== 'production' || !/^true|1|yes$/i.test(String(process.env.ALLOW_LEGACY_OWNER_TOKEN || '')), 'Keep legacy owner-token access disabled in production after owner account setup.'),
    item('appBaseUrl', Boolean(process.env.APP_BASE_URL), 'Set APP_BASE_URL to the live Render or custom domain.'),
    item('smtp', mailer.status().configured, 'Configure SMTP host, credentials, and an explicit sender identity for password recovery, owner alerts, and user confirmations.'),
    item('stripeSecret', Boolean(process.env.STRIPE_SECRET_KEY), 'Configure the Stripe secret key for test-mode Checkout.'),
    item('stripeWebhook', Boolean(process.env.STRIPE_WEBHOOK_SECRET), 'Configure and verify the signed Stripe webhook.'),
    item('starterPrice', Boolean(process.env.STRIPE_STARTER_REVIEW_PRICE_ID), 'Add at least one Stripe Price ID for a starter review service.'),
    item('databasePersistence', storage.databaseReady, 'Use verified PostgreSQL persistence. If PostgreSQL is selected but unavailable, sensitive writes are blocked rather than saved locally.'),
    item('databaseTransactions', storage.databaseTransactionsReady, 'Verify pooled PostgreSQL transactions and awaited request-level commits for paid-pilot mutations.'),
    item('privateUploadStorage', storage.privateUploadStorageReady, 'Use durable private upload storage before accepting sensitive documents.'),
    item('storageOperational', storage.operationalForSensitiveTraffic, 'Both the production database and durable private upload storage must be ready for sensitive paid traffic.'),
    item('liveChat', Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID), 'Optional: configure tawk.to; the contact fallback remains available.', false),
    item('openAiCentralGateway', centralAiGateway.status().available, 'Optional: keep the OpenAI-only central gateway dark until the protected key, billing, deployment, evaluations, and controlled live smoke evidence pass. Deterministic rules fallback remains available.', false),
    item('reviewReadyDrafts', REVIEW_READY_DRAFT_PATHS.length >= 5, 'Form-support worksheets are available; any paid human review remains separate.'),
    item('ownerEmail', Boolean(OWNER_EMAIL), 'Set OWNER_NOTIFICATION_EMAIL so owner alerts have a recipient.'),
    item('uploadLimits', MAX_UPLOADS_PER_REQUEST <= 6 && MAX_UPLOAD_BYTES <= 8 * 1024 * 1024, 'Upload limits are set conservatively.')
  ];
  const operational=operationalReadiness.machineChecks();
  const operationalItems=operational.checks.map(entry=>item(`operational:${entry.key}`,entry.ready,entry.detail,true));
  const allItems=[...items,...operationalItems];
  return { storageMode:storage.mode, storage, ownerAuthentication:ownerAuth, operationalReadiness:operational, migrationManifest:migrations.manifest(), requiredChecks:allItems.filter(x=>x.required).length, optionalChecks:allItems.filter(x=>!x.required).length, readyForPaidTraffic:allItems.filter(x=>x.required).every(x=>x.ok), items:allItems };
}

function buildReviewPackageHtml(c){
  const concerns = (c.analysis?.concerns || []).map(x=>`<li>${htmlEscape(x)}</li>`).join('') || '<li>No immediate concern detected yet.</li>';
  const steps = (c.analysis?.nextSteps || []).map(x=>`<li>${htmlEscape(x)}</li>`).join('') || '<li>Continue answering starting questions.</li>';
  const files = (c.attachments || []).map(a=>`<li>${htmlEscape(a.originalName || a.name)} — ${htmlEscape(a.documentType || a.mimeType || '')} (${Math.round((a.sizeBytes||0)/1024)} KB)</li>`).join('') || '<li>No documents uploaded yet.</li>';
  const paths = (c.analysis?.verifiedFormPaths || []).map(p=>`<li><strong>${htmlEscape(p.title)}</strong> — ${htmlEscape(p.readinessLabel)}<br><small>${htmlEscape(p.deliveryType || '')}</small>${p.missingFields?.length ? `<br><em>Missing helpful details:</em> ${htmlEscape(p.missingFields.join(', '))}` : ''}</li>`).join('') || '<li>No supported form is selected yet. Continue answering the starting questions before choosing a form.</li>';
  const smart = Object.entries(c.smartAnswers || {}).filter(([,v])=>v).map(([k,v])=>`<tr><th>${htmlEscape(k.replace(/([A-Z])/g,' $1'))}</th><td>${htmlEscape(v)}</td></tr>`).join('') || '<tr><td colspan="2">No extra details saved yet.</td></tr>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Smarter Justice Saved Work Summary ${htmlEscape(c.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#142536;margin:32px;max-width:900px}h1,h2{color:#0f2f4a}.box{border:1px solid #d9e2ec;border-radius:14px;padding:16px;margin:14px 0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e2ec;padding:8px;text-align:left;vertical-align:top}small,.fine{color:#596b7a}</style></head><body><h1>Smarter Justice saved work summary</h1><p class="fine">Saved-work support summary. Not a law firm. Not the government. No guaranteed approval, timing, benefits, tax outcome, settlement, legal outcome, or case result.</p><div class="box"><h2>Saved work summary</h2><p><strong>Practice area:</strong> ${htmlEscape(c.practiceName)} ${c.subcategory ? '— '+htmlEscape(c.subcategory) : ''}</p><p><strong>Progress:</strong> ${htmlEscape(c.status)}</p><p><strong>Human Review Specialist:</strong> ${htmlEscape(c.humanReviewLane)}</p><p><strong>Professional review:</strong> ${htmlEscape(c.professionalReviewLane)}</p><p><strong>Payment:</strong> ${htmlEscape(c.paymentStatus)}</p><p><strong>Available to download:</strong> ${htmlEscape(c.deliveryStatus || 'Nothing is ready to download yet')}</p>${c.userActionNeeded ? `<p><strong>Action needed:</strong> ${htmlEscape(c.userActionNeeded)}</p>` : ''}${c.userFacingNote ? `<p><strong>Message from Smarter Justice:</strong> ${htmlEscape(c.userFacingNote)}</p>` : ''}<p><strong>State/local:</strong> ${htmlEscape([c.jurisdiction?.city,c.jurisdiction?.county,c.jurisdiction?.state].filter(Boolean).join(', ') || 'Not provided')}</p></div>${c.analysis?.matterPath ? `<div class="box"><h2>Suggested next step</h2><p><strong>${htmlEscape(c.analysis.matterPath.userNextPathTitle || c.analysis.matterPath.stageName || '')}</strong></p><p>${htmlEscape(c.analysis.matterPath.userNextPathSummary || '')}</p><ul>${(c.analysis.matterPath.dynamicMissingInformation || []).map(x=>`<li>${htmlEscape(x.label || x)}</li>`).join('') || '<li>No path-specific missing items listed yet.</li>'}</ul></div>` : ''}${c.analysis?.aiReview ? `<div class="box"><h2>Automated starting summary</h2><p>${htmlEscape(c.analysis.aiReview.plainLanguageSummary || '')}</p><p class="fine">This summary helps organize the starting point. It is not legal, tax, accounting, or other professional advice.</p></div>` : ''}<div class="box"><h2>Possible concerns that may need review</h2><ul>${concerns}</ul></div><div class="box"><h2>Suggested next steps</h2><ul>${steps}</ul></div><div class="box"><h2>Possible form or document path</h2><ul>${paths}</ul></div><div class="box"><h2>Uploaded documents</h2><ul>${files}</ul></div><div class="box"><h2>Starting details saved</h2><table>${smart}</table></div><p class="fine">Users remain responsible for reviewing, signing, filing, and submitting any official forms unless a separate professional engagement says otherwise. Official government forms are often free from the government.</p></body></html>`;
}

function prettyKey(key){ return String(key || '').replace(/([A-Z])/g,' $1').replace(/^smart /,'').replace(/^./, c => c.toUpperCase()); }
function buildDraftPackageHtml(c){
  const paths = c.analysis?.verifiedFormPaths || [];
  const primary = paths[0] || null;
  const facts = { ...(c.smartAnswers || {}), ...(c.futureLeadFieldsCaptured || {}), state:c.jurisdiction?.state || '', county:c.jurisdiction?.county || '', city:c.jurisdiction?.city || '', fullName:c.fullName || '', email:c.email || '', phone:c.phone || '', documentType:c.documentType || '', deadlineDate:c.deadlineDate || '' };
  const factRows = Object.entries(facts).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => `<tr><th>${htmlEscape(prettyKey(k))}</th><td>${htmlEscape(v)}</td></tr>`).join('') || '<tr><td colspan="2">No starter details saved yet.</td></tr>';
  const missing = (primary?.missingFieldLabels || primary?.missingFields || c.missingInformation || []).map(x => `<li>${htmlEscape(x)}</li>`).join('') || '<li>No missing starter details listed yet, but Human Review Specialist review is still required.</li>';
  const forms = (primary?.officialForms || []).map(x => `<li>${htmlEscape(x)}</li>`).join('') || '<li>No official form selected yet.</li>';
  const checklist = (primary?.reviewerChecklist || []).map(x => `<li>${htmlEscape(x)}</li>`).join('') || '<li>Confirm official source, jurisdiction, user identity, deadline, and supporting documents before preparing any completed form.</li>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Smarter Justice Form Information Worksheet ${htmlEscape(c.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#142536;margin:32px;max-width:920px}h1,h2{color:#0f2f4a}.box{border:1px solid #d9e2ec;border-radius:14px;padding:16px;margin:14px 0;background:#fff}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e2ec;padding:8px;text-align:left;vertical-align:top}.fine{color:#596b7a}.warning{background:#fff7ed;border-color:#f4c790}</style></head><body><h1>Smarter Justice form information worksheet</h1><p class="fine">This is not a filed form and not legal, tax, accounting, or other professional advice. It organizes the user’s answers so missing details, official instructions, and appropriate review needs can be checked.</p><div class="box"><h2>Selected path</h2><p><strong>${htmlEscape(primary?.title || 'No supported form selected yet')}</strong></p><p><strong>Readiness:</strong> ${htmlEscape(primary?.readinessLabel || c.analysis?.formReadiness?.label || 'Worksheet first')}</p><p><strong>Delivery type:</strong> ${htmlEscape(primary?.deliveryType || 'Organized information worksheet first')}</p><p><strong>Draft status:</strong> ${htmlEscape(c.formDraftStatus || 'not generated yet')}</p></div>${c.analysis?.matterPath ? `<div class="box"><h2>Where this issue may stand</h2><p><strong>${htmlEscape(c.analysis.matterPath.stageName || '')}</strong></p><p>${htmlEscape(c.analysis.matterPath.stageDescription || '')}</p><p><strong>Starting-information completeness:</strong> ${htmlEscape(String(c.analysis.matterPath.formReadinessScore || 0))}%</p></div>` : ''}<div class="box"><h2>Official forms and sources to check</h2><ul>${forms}</ul><p class="fine">Always verify the latest official source, instructions, fees, filing method, and signature requirements before preparing or providing any completed form.</p></div><div class="box warning"><h2>Missing details or questions that need review</h2><ul>${missing}</ul></div><div class="box"><h2>Organized information</h2><table>${factRows}</table></div><div class="box"><h2>Review checklist</h2><ul>${checklist}</ul></div><p class="fine">Smarter Justice is a private support service, not a law firm and not the government. Official government forms are often free from the government. No approval, refund, benefit, tax outcome, settlement, timing, filing acceptance, or case result is guaranteed.</p></body></html>`;
}


function buildReviewReadyDraftHtml(c){
  const evaln = c.reviewReadyDraft || c.analysis?.reviewReadyDraft || buildReviewReadyDraftEvaluation(c || {});
  const mappedRows = (evaln.mappedFields || []).map(f => `<tr><th>${htmlEscape(f.label)}${f.required ? ' *' : ''}</th><td>${f.present ? htmlEscape(f.value) : '<em>Missing</em>'}</td><td>${htmlEscape(f.help || f.reviewNote || '')}</td></tr>`).join('') || '<tr><td colspan="3">No mapped fields available for this file yet.</td></tr>';
  const missing = (evaln.missingRequiredFields || []).map(f => `<li>${htmlEscape(f.label || f)}</li>`).join('') || '<li>No required starter fields are missing, but human review is still required.</li>';
  const docs = (evaln.requiredDocuments || []).map(d => `<li>${htmlEscape(d)}</li>`).join('') || '<li>No document checklist selected yet.</li>';
  const uploaded = (c.attachments || []).map(a=>`<li>${htmlEscape(a.originalName || a.name)} — ${htmlEscape(a.documentType || a.mimeType || '')}</li>`).join('') || '<li>No uploaded documents yet.</li>';
  const checklist = (evaln.staffReviewChecklist || []).map(x=>`<li>${htmlEscape(x)}</li>`).join('') || '<li>Human Review Specialist must verify source, missing fields, and documents before delivery.</li>';
  const blockers = (evaln.deliveryBlockers || []).map(x=>`<li>${htmlEscape(x)}</li>`).join('') || '<li>No unresolved items were identified automatically, but Human Review Specialist and user review are still required.</li>';
  const overrides = Object.entries(c.reviewReadyDraftOverrides || {}).map(([k,v])=>`<li><strong>${htmlEscape(prettyKey(k))}:</strong> ${htmlEscape(v)}</li>`).join('') || '<li>No staff field corrections saved yet.</li>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Smarter Justice Draft for Review ${htmlEscape(c.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#142536;margin:32px;max-width:980px}h1,h2{color:#0f2f4a}.box{border:1px solid #d9e2ec;border-radius:14px;padding:16px;margin:14px 0;background:#fff}.warning{background:#fff7ed;border-color:#f4c790}.ok{background:#ecfdf5;border-color:#9be4c0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e2ec;padding:8px;text-align:left;vertical-align:top}small,.fine{color:#596b7a}</style></head><body><h1>Form draft for review</h1><p class="fine">This is a preliminary form draft organized from saved answers for Human Review Specialist review. It is not a filed form, not legal, tax, accounting, or other professional advice, and not ready for signature until review and user verification are complete.</p><div class="box"><h2>${htmlEscape(evaln.title || 'Organizer only')}</h2><p><strong>Status:</strong> ${htmlEscape(c.reviewReadyDraftStatus || 'not reviewed yet')}</p><p><strong>Readiness:</strong> ${htmlEscape(evaln.label || '')} · ${htmlEscape(String(evaln.completionPercent || 0))}% starter completeness</p><p><strong>Official source:</strong> ${htmlEscape(evaln.officialSourceName || 'Not selected')} ${evaln.officialUrl ? `— <a href="${htmlEscape(evaln.officialUrl)}">official source</a>` : ''}</p><p><strong>Forms:</strong> ${htmlEscape((evaln.officialFormNumbers || []).join(', ') || 'No official form number selected')}</p><p><strong>Source checked:</strong> ${htmlEscape(evaln.sourceCheckedDate || 'Not recorded')}</p><p><strong>Boundary:</strong> ${htmlEscape(evaln.automationBoundary || 'Human review required before delivery.')}</p></div><div class="box warning"><h2>Missing required starter fields</h2><ul>${missing}</ul></div><div class="box warning"><h2>What must happen before delivery</h2><p><strong>Status:</strong> ${htmlEscape(evaln.approvalStatus || c.reviewReadyDraftStatus || 'not reviewed yet')}</p><p><strong>Ready to send to the user for review:</strong> ${evaln.canDeliverForUserReview ? 'Yes, after final staff confirmation' : 'No'}</p><ul>${blockers}</ul></div><div class="box"><h2>Saved answers placed into draft fields</h2><table><thead><tr><th>Form question</th><th>Saved answer</th><th>Review note</th></tr></thead><tbody>${mappedRows}</tbody></table></div><div class="box"><h2>Required document checklist</h2><ul>${docs}</ul><h3>Uploaded so far</h3><ul>${uploaded}</ul></div><div class="box"><h2>Professional-review recommendation</h2><p>${htmlEscape(evaln.professionalReviewRecommendation || c.professionalReviewLane || 'Professional review may be recommended depending on the facts.')}</p></div><div class="box ok"><h2>Review checklist</h2><ul>${checklist}</ul></div><p class="fine">Users remain responsible for reviewing, correcting, signing, filing, and submitting any official forms unless a separate professional engagement says otherwise. Official government forms are often free from the government. Smarter Justice does not guarantee approval, timing, refunds, benefits, settlements, tax outcomes, or legal outcomes.</p></body></html>`;
}


function rebuildCaseAnalysis(c){
  c.analysis = buildStartingPoint({
    question: c.question,
    practiceArea: c.practiceSlug,
    subcategory: c.subcategory,
    state: c.jurisdiction?.state || '',
    county: c.jurisdiction?.county || '',
    city: c.jurisdiction?.city || '',
    attachments: (c.attachments || []).map(publicAttachment).filter(Boolean),
    documentType: c.documentType || '',
    smartAnswers: c.smartAnswers || {}
  });
  c.analysis.recommendedPortal = recommendPortalForPractice(c.analysis.practiceSlug || c.practiceSlug, c.requestedPortal || '');
  c.analysis.portalRouting = { umbrella:'Smarter Justice', recommendedPortalSlug: c.analysis.recommendedPortal.slug, recommendedPortalName: c.analysis.recommendedPortal.name, status: c.analysis.recommendedPortal.status, userMessage: c.analysis.recommendedPortal.userRouteMessage };
  c.recommendedPortal = c.analysis.recommendedPortal;
  c.reviewReadyDraft = buildReviewReadyDraftEvaluation(c);
  c.analysis.reviewReadyDraft = c.reviewReadyDraft;
  c.correctNextPath = c.analysis.correctNextPath || c.analysis.matterPath?.userNextPathTitle || c.correctNextPath || '';
  c.formPathEvaluation = c.analysis.formPathEvaluation || c.formPathEvaluation || null;
  return c;
}

function humanReviewServiceFor(value){
  const key=String(value||'').trim();
  return revenueAccessModel.readState().humanReviewServices.find(service=>service.id===key||service.checkoutCode===key)||null;
}
function publicPaidServiceEnvironment(service={}){
  const priceEnvKey=String(service.priceEnvKey||'').trim();
  return {
    publicPaidServicesEnabled:envFlag('PUBLIC_PAID_SERVICES_ENABLED'),
    sensitiveTrafficApproved:sensitiveTrafficApproved(),
    stripeConfigured:Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured:Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    smtpConfigured:mailer.configured(),
    ownerEmailConfigured:Boolean(OWNER_EMAIL),
    priceConfigured:Boolean(priceEnvKey&&process.env[priceEnvKey]),
    priceId:priceEnvKey?String(process.env[priceEnvKey]||'').trim():'',
    priceEnvKey
  };
}
function stripeRequest(method, stripePath, formData, options={}){
  return new Promise((resolve, reject) => {
    const body = formData ? querystring.stringify(formData) : '';
    const headers = { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) };
    const idempotencyKey=String(options.idempotencyKey||'').trim();
    if(idempotencyKey)headers['Idempotency-Key']=idempotencyKey;
    const req = https.request({ hostname: 'api.stripe.com', path: stripePath, method, headers }, res => {
      let data = ''; res.on('data', d => data += d); res.on('end', () => { try { const parsed = JSON.parse(data || '{}'); if (res.statusCode >= 400) return reject(new Error(parsed.error?.message || `Stripe API error ${res.statusCode}`)); resolve(parsed); } catch (err) { reject(err); } });
    });
    req.on('error', reject); if (body) req.write(body); req.end();
  });
}
async function handleCheckout(body){
  const publicToken=String(body.caseId||body.publicToken||'').trim();
  const c=publicToken?findUserCase(publicToken):null;
  if(!c)return {status:404,data:{ok:false,error:'Saved work not found for this review request.'}};
  const service=humanReviewServiceFor(body.serviceType||body.serviceId);
  const environment=publicPaidServiceEnvironment(service||{});
  const orderResult=await publicPaidServices.createOrder({
    caseId:c.id,
    publicToken,
    email:String(body.email||c.email||'').trim(),
    serviceId:service?.id||body.serviceId||body.serviceType,
    acknowledgments:body.acknowledgments||{}
  },environment);
  if(orderResult.error){
    return {status:409,data:{ok:false,error:orderResult.error,message:'No payment was taken. Paid Human Review Specialist services remain closed until every required launch control is complete.',availability:orderResult.availability?{available:false,service:orderResult.availability.service}:undefined,missingAcknowledgments:orderResult.missingAcknowledgments||[]}};
  }
  const order=orderResult.order;
  if(orderResult.duplicate){
    return {status:409,data:{ok:false,error:'A checkout or active review request already exists for this service and saved work.',order:publicPaidServices.publicOrdersForCase(c.id).find(x=>x.id===order.id)||null,case:publicCase(c)}};
  }
  try{
    const cleanBase=BASE_URL.replace(/\/$/,'');
    const session=await stripeRequest('POST','/v1/checkout/sessions',{
      mode:'payment',
      success_url:`${cleanBase}/checkout-success.html?case=${encodeURIComponent(publicToken)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${cleanBase}/checkout-cancel.html?case=${encodeURIComponent(publicToken)}`,
      'line_items[0][price]':environment.priceId,
      'line_items[0][quantity]':'1',
      client_reference_id:c.id,
      customer_email:order.email,
      allow_promotion_codes:'true',
      'metadata[kind]':'public_paid_service',
      'metadata[orderId]':order.id,
      'metadata[caseId]':c.id,
      'metadata[serviceId]':order.serviceId,
      'metadata[termsVersion]':order.termsVersion
    });
    await publicPaidServices.markCheckoutCreated(order.id,session);
    c.paymentStatus='secure checkout created';
    c.paymentRequestedAt=store.now();
    c.updatedAt=store.now();
    store.upsertCase(c);
    notification('payment_step_requested',{caseId:c.id,serviceType:order.serviceId,stripeConfigured:true,priceConfigured:true});
    store.addAudit({actor:'user',action:'public_paid_service_checkout_created',caseId:c.id,details:{orderId:order.id,serviceId:order.serviceId,sessionId:session.id}});
    return {status:200,data:{ok:true,checkoutUrl:session.url,sessionId:session.id,order:publicPaidServices.publicOrdersForCase(c.id).find(x=>x.id===order.id)||null,case:publicCase(c)}};
  }catch(err){
    await publicPaidServices.updateOrder(order.id,{status:'payment failed',userFacingStatus:'Secure checkout could not be created. No payment was taken.',ownerNotes:`Checkout creation failed: ${String(err.message||err).slice(0,1000)}`,historyNote:'Stripe Checkout creation failed before payment.'}).catch(()=>{});
    await paidPilotOperations.recordBillingIssue({dedupeKey:`public-checkout:${order.id}`,type:'public-checkout-creation',severity:'high',accountId:'',stripeEventId:'',summary:`Public paid-service checkout failed for ${order.id}: ${String(err.message||err).slice(0,1000)}`}).catch(()=>{});
    return {status:502,data:{ok:false,error:'Secure checkout could not be created. No payment was taken. Please try again later or contact support.',order:publicPaidServices.publicOrdersForCase(c.id).find(x=>x.id===order.id)||null}};
  }
}
async function confirmCheckout(urlObj){
  const publicToken=String(urlObj.searchParams.get('case')||'').trim();
  const sessionId=String(urlObj.searchParams.get('session_id')||'').trim();
  const c=publicToken?findUserCase(publicToken):null;
  if(!c)return {status:404,data:{ok:false,error:'Saved work not found.'}};
  if(!process.env.STRIPE_SECRET_KEY||!sessionId)return {status:409,data:{ok:false,error:'A valid secure checkout session is required to confirm payment.',case:publicCase(c)}};
  const session=await stripeRequest('GET',`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if(session?.metadata?.kind!=='public_paid_service'||String(session?.metadata?.caseId||'')!==String(c.id))return {status:409,data:{ok:false,error:'This checkout session does not match the saved work.'}};
  const applied=await publicPaidServices.applyCheckoutSession(session,'checkout.session.completed');
  if(applied.error)return {status:409,data:{ok:false,error:applied.error}};
  if(applied.paid){
    c.paymentStatus='paid online';
    c.paymentConfirmedAt=c.paymentConfirmedAt||store.now();
    c.status='Payment received — Human Review Specialist assignment pending';
    c.updatedAt=store.now();
    store.upsertCase(c);
    notification('payment_received',{caseId:c.id,email:c.email||'',sessionId:session.id,amountTotal:session.amount_total,currency:session.currency});
  }
  return {status:200,data:{ok:true,sessionStatus:session.status,paymentStatus:session.payment_status,order:publicPaidServices.publicOrdersForCase(c.id).find(x=>x.id===applied.order?.id)||null,case:publicCase(c)}};
}


function professionalTargetOwned(account, target){
  if (!account || !target) return false;
  if (target.kind === 'professional') return (account.professionalIds || []).includes(target.id);
  if (target.kind === 'firm') return (account.firmIds || []).includes(target.id);
  return false;
}
async function handleProfessionalMembershipCheckout(req, body){
  const auth=professionalAccounts.accountFromRequest(req);
  if(!auth) return {status:401,data:{ok:false,error:'Sign in to your professional account first.'}};
  const requested={kind:String(body.kind||auth.account.membershipTarget?.kind||''),id:String(body.id||auth.account.membershipTarget?.id||''),planId:String(body.planId||auth.account.membershipTarget?.planId||''),seatCount:Number(body.seatCount||auth.account.membershipTarget?.seatCount||1),billingCadence:['annual','monthly'].includes(body.billingCadence)?body.billingCadence:'monthly'};
  if(!professionalTargetOwned(auth.account,requested)) return {status:403,data:{ok:false,error:'That membership target is not connected to this professional account.'}};
  const owner=professionalMarketplace.getOwnerData();
  const plan=owner.membershipPlans.find(item=>item.id===requested.planId);
  if(!plan||!['pilot-ready','active'].includes(plan.status)) return {status:400,data:{ok:false,error:'That membership plan is not available to select right now.'}};
  if((requested.kind==='professional'&&plan.audience!=='individual')||(requested.kind==='firm'&&plan.audience!=='firm')) return {status:400,data:{ok:false,error:'That membership plan does not match the selected professional or firm account.'}};
  const targetRecord=requested.kind==='firm'?owner.firms.find(item=>item.id===requested.id):owner.professionals.find(item=>item.id===requested.id);
  if(!targetRecord) return {status:404,data:{ok:false,error:'The selected membership profile could not be found.'}};
  const targetReadiness=requested.kind==='firm'?professionalMarketplace.firmProfileReadiness(targetRecord):professionalMarketplace.professionalProfileReadiness(targetRecord);
  if(!targetReadiness.readyForReview || !targetReadiness.currentRevisionSubmitted || targetReadiness.reviewStatus!=='approved') return {status:409,data:{ok:false,error:'Complete, submit, and receive approval for the current profile revision before payment.',profileReadiness:targetReadiness}};
  if(targetRecord.membership?.status==='active') return {status:409,data:{ok:false,error:'This professional or firm membership is already active. Use professional support for billing, cancellation, or plan changes; a second subscription was not created.',membership:targetRecord.membership}};
  const authoritativeSeatCount=requested.kind==='firm'?Math.max(1,Math.min(500,Number(targetRecord.seatCount)||1)):1;
  if(requested.kind==='firm'&&Number(requested.seatCount)!==authoritativeSeatCount) return {status:409,data:{ok:false,error:'The firm seat count changed. Refresh the dashboard and review the updated recurring price before checkout.',authoritativeSeatCount}};
  const target={...requested,seatCount:authoritativeSeatCount};
  const enrollment=professionalMarketplace.membershipEnrollmentAvailability(target);
  if(!enrollment.available) return {status:409,data:{ok:false,error:enrollment.reason,pilotStatus:enrollment.controls?.status || 'paused',capacity:enrollment.capacity}};
  const pilot=pilotProgram.professionalView(auth.account.id);
  const application=pilot.application;
  if(!application) return {status:409,data:{ok:false,error:'Submit the professional membership application before checkout.',pilot}};
  if(application.status!=='approved-for-payment') return {status:409,data:{ok:false,error:'The professional membership application is not approved for payment.',paymentGate:pilot.paymentGate,pilot}};
  if(application.targetKind!==target.kind||application.targetId!==target.id||application.planId!==target.planId) return {status:409,data:{ok:false,error:'The approved application does not match the selected membership target or plan. Return to the application section or contact professional support.',applicationTarget:{kind:application.targetKind,id:application.targetId,planId:application.planId}}};
  if(Number(application.targetRevision||0)!==Number(targetReadiness.profileRevision||0)) return {status:409,data:{ok:false,error:'The approved application is based on an older profile revision. Submit the current profile and have the application reviewed again before payment.',approvedRevision:Number(application.targetRevision||0),currentRevision:Number(targetReadiness.profileRevision||0)}};
  if(Number(application.seatCount||1)!==target.seatCount) return {status:409,data:{ok:false,error:'The approved seat count does not match the current firm workspace. Request an application update before payment.',approvedSeatCount:Number(application.seatCount||1),currentSeatCount:target.seatCount}};
  if(application.billingCadence!==target.billingCadence) return {status:409,data:{ok:false,error:'The selected billing frequency differs from the approved application. Update the application or contact professional support before payment.',approvedBillingCadence:application.billingCadence}};
  const gate=pilot.paymentGate;
  if(!gate.available) return {status:409,data:{ok:false,error:'Membership payment is not open for this account yet.',paymentGate:gate,pilot}};
  const acknowledgments={
    acceptMembershipTerms:Boolean(body.acceptMembershipTerms),
    acceptRecurringBilling:Boolean(body.acceptRecurringBilling),
    acceptCancellationPolicy:Boolean(body.acceptCancellationPolicy),
    acceptNoGuarantees:Boolean(body.acceptNoGuarantees)
  };
  const missingAcknowledgments=Object.entries(acknowledgments).filter(([,accepted])=>!accepted).map(([key])=>({acceptMembershipTerms:'Professional Membership Terms',acceptRecurringBilling:'Recurring billing acknowledgment',acceptCancellationPolicy:'Cancellation and refund acknowledgment',acceptNoGuarantees:'No-guarantee acknowledgment'}[key]));
  if(missingAcknowledgments.length) return {status:400,data:{ok:false,error:`Confirm the required checkout terms: ${missingAcknowledgments.join(', ')}.`,missingAcknowledgments}};
  let unitAmount=target.billingCadence==='annual'?plan.annualPriceCents:plan.monthlyPriceCents; let quantity=1; let quote=null;
  if(target.kind==='firm'){
    quote=professionalMarketplace.calculateFirmMembershipQuote(target.planId,target.seatCount);
    if(quote.error) return {status:400,data:{ok:false,error:quote.error}};
    unitAmount=target.billingCadence==='annual'?quote.annualDiscountedPerSeatCents:quote.monthlyDiscountedPerSeatCents; quantity=quote.seatCount;
  }
  if(!unitAmount) return {status:400,data:{ok:false,error:'Pricing is not available yet for that plan and billing schedule.'}};
  const totalAmount=Number(unitAmount)*Number(quantity);
  professionalAccounts.setMembershipTarget(auth.account.id,target);
  const termsVersions=pilot.termsVersions||{};
  if(!process.env.STRIPE_SECRET_KEY) return {status:200,data:{ok:true,stripeConfigured:false,message:'Your application is approved, but secure subscription checkout is not configured yet. No payment was taken.',target,quote,totalAmountCents:totalAmount,paymentGate:gate}};
  const suppliedIdempotencyKey=String(req.headers['idempotency-key']||body.idempotencyKey||'').trim();
  const idempotencyKey=/^[A-Za-z0-9._:-]{8,200}$/.test(suppliedIdempotencyKey)?suppliedIdempotencyKey:`sj-membership-${auth.account.id}-${application.id}-${target.billingCadence}-${target.seatCount}`.slice(0,200);
  const interval=target.billingCadence==='annual'?'year':'month'; const cleanBase=BASE_URL.replace(/\/$/,'');
  const form={
    mode:'subscription', success_url:`${cleanBase}/professional-dashboard.html?membership=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url:`${cleanBase}/professional-dashboard.html?membership=cancelled`, client_reference_id:auth.account.id, customer_email:auth.account.email, allow_promotion_codes:'true',
    'line_items[0][price_data][currency]':'usd', 'line_items[0][price_data][unit_amount]':String(unitAmount), 'line_items[0][price_data][recurring][interval]':interval, 'line_items[0][price_data][product_data][name]':plan.name, 'line_items[0][price_data][product_data][description]':'Fixed Smarter Justice professional platform membership. No guaranteed clients, appointments, ranking, revenue, or outcomes.', 'line_items[0][quantity]':String(quantity),
    'metadata[kind]':'professional_membership', 'metadata[accountId]':auth.account.id, 'metadata[membershipKind]':target.kind, 'metadata[membershipId]':target.id, 'metadata[planId]':target.planId, 'metadata[seatCount]':String(target.seatCount), 'metadata[billingCadence]':target.billingCadence, 'metadata[applicationId]':application.id, 'metadata[membershipTermsVersion]':String(termsVersions.membershipTerms||''), 'metadata[privacyVersion]':String(termsVersions.privacy||''), 'metadata[checkoutAcknowledgmentVersion]':'1.0.0',
    'subscription_data[metadata][kind]':'professional_membership', 'subscription_data[metadata][accountId]':auth.account.id, 'subscription_data[metadata][membershipKind]':target.kind, 'subscription_data[metadata][membershipId]':target.id, 'subscription_data[metadata][planId]':target.planId, 'subscription_data[metadata][seatCount]':String(target.seatCount), 'subscription_data[metadata][billingCadence]':target.billingCadence, 'subscription_data[metadata][applicationId]':application.id
  };
  try{
    const session=await stripeRequest('POST','/v1/checkout/sessions',form,{idempotencyKey});
    await pilotProgram.markCheckoutStarted(auth.account,session.id);
    store.addAudit({actor:'professional-account',action:'professional_membership_checkout_created',details:{accountId:auth.account.id,applicationId:application.id,kind:target.kind,targetId:target.id,planId:target.planId,seatCount:target.seatCount,billingCadence:target.billingCadence,unitAmountCents:Number(unitAmount),quantity,totalAmountCents:totalAmount,acknowledgments,checkoutAcknowledgmentVersion:'1.0.0',sessionId:session.id,idempotencyKeyHash:crypto.createHash('sha256').update(idempotencyKey).digest('hex')}});
    return {status:200,data:{ok:true,stripeConfigured:true,checkoutUrl:session.url,sessionId:session.id,target,quote,totalAmountCents:totalAmount}};
  }catch(error){
    store.addAudit({actor:'professional-account',action:'professional_membership_checkout_failed',details:{accountId:auth.account.id,applicationId:application.id,kind:target.kind,targetId:target.id,planId:target.planId,error:String(error.message||error).slice(0,500)}});
    return {status:502,data:{ok:false,error:'Secure membership checkout could not be created. No payment was taken. Please try again or contact professional support.'}};
  }
}

async function applyProfessionalMembershipSession(session,eventType='checkout.session.completed'){
  if(session?.metadata?.kind!=='professional_membership') return {handled:false};
  const target={kind:session.metadata.membershipKind,id:session.metadata.membershipId,planId:session.metadata.planId,seatCount:Number(session.metadata.seatCount||1),billingCadence:session.metadata.billingCadence||'monthly'};
  const verifiedCompletedEvent=eventType==='checkout.session.completed';
  const sessionComplete=session.status==='complete';
  const paymentSatisfied=['paid','no_payment_required'].includes(session.payment_status);
  const paid=(verifiedCompletedEvent||sessionComplete)&&paymentSatisfied;
  if(!paid) return {handled:true,activated:false,accountId:session.metadata.accountId||''};
  const applied=await professionalMarketplace.applyMembershipPayment(target,{sessionId:session.id||'',customerId:session.customer||'',subscriptionId:session.subscription||''});
  if(session.metadata.accountId) await pilotProgram.recordPayment(session.metadata.accountId,{status:applied.error?'failed':'paid',reference:session.id||''});
  store.addAudit({actor:'stripe',action:'professional_membership_activated',details:{accountId:session.metadata.accountId||'',kind:target.kind,targetId:target.id,planId:target.planId,seatCount:target.seatCount,sessionId:session.id||'',applied:!applied.error}});
  return {handled:true,activated:!applied.error,error:applied.error||'',accountId:session.metadata.accountId||'',target};
}
async function confirmProfessionalMembership(req,urlObj){
  const auth=professionalAccounts.accountFromRequest(req); if(!auth) return {status:401,data:{ok:false,error:'Sign in to confirm the membership.'}};
  const sessionId=urlObj.searchParams.get('session_id')||''; if(!process.env.STRIPE_SECRET_KEY||!sessionId) return {status:200,data:{ok:true,stripeConfigured:Boolean(process.env.STRIPE_SECRET_KEY),message:'Payment confirmation requires a completed secure checkout session.'}};
  const session=await stripeRequest('GET',`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if(session?.metadata?.accountId!==auth.account.id) return {status:403,data:{ok:false,error:'That Checkout session does not belong to this professional account.'}};
  const applied=await applyProfessionalMembershipSession(session,'manual-confirm');
  return {status:200,data:{ok:true,sessionStatus:session.status,paymentStatus:session.payment_status,membershipActivated:applied.activated,dashboard:professionalAccounts.dashboard(req)}};
}

function parseStripeSignature(header){
  const parts = String(header || '').split(',').map(x => x.trim()).filter(Boolean);
  const out = { signatures: [] };
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 't') out.timestamp = v;
    if (k === 'v1') out.signatures.push(v);
  }
  return out;
}
function verifyStripeWebhookSignature(rawBody, signatureHeader){
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret) return { ok:false, error:'Stripe webhook secret is not configured.' };
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed.timestamp || !parsed.signatures.length) return { ok:false, error:'Missing Stripe signature timestamp or v1 signature.' };
  const ageSeconds = Math.abs(Math.floor(Date.now()/1000) - Number(parsed.timestamp));
  if (Number.isFinite(ageSeconds) && ageSeconds > WEBHOOK_TOLERANCE_SECONDS) return { ok:false, error:'Stripe webhook signature timestamp is outside the allowed tolerance.' };
  const payload = `${parsed.timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const matched = parsed.signatures.some(sig => {
    const a = Buffer.from(sig, 'hex'); const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  return matched ? { ok:true } : { ok:false, error:'Stripe webhook signature verification failed.' };
}
function applyStripeCheckoutSession(session, eventType='checkout.session.completed'){
  const caseId = session?.client_reference_id || session?.metadata?.caseId || '';
  const c = caseId ? store.findCase(caseId) : null;
  if (!c) return { found:false, caseId };
  if (eventType === 'checkout.session.completed' || session.payment_status === 'paid') {
    c.paymentStatus = 'paid via Stripe webhook';
    c.paymentConfirmedAt = store.now();
    c.status = 'Payment received — review/delivery step in progress';
  } else if (eventType === 'checkout.session.expired') {
    c.paymentStatus = 'payment session expired';
  } else if (/failed|async_payment_failed/.test(eventType)) {
    c.paymentStatus = 'payment failed or incomplete';
  }
  c.stripeSessionId = session.id || c.stripeSessionId || '';
  c.updatedAt = store.now();
  store.upsertCase(c);
  store.addAudit({ actor:'stripe', action:`stripe_webhook:${eventType}`, caseId:c.id, details:{ sessionId:session.id || '', paymentStatus:session.payment_status || '', amountTotal:session.amount_total || null, currency:session.currency || '' } });
  if (eventType === 'checkout.session.completed' || session.payment_status === 'paid') notification('payment_received_webhook', { caseId:c.id, sessionId:session.id, amountTotal:session.amount_total, currency:session.currency });
  return { found:true, case: c };
}
function stripeObjectReference(object={}){
  const metadata=object.metadata||{};
  return {
    eventType:'',
    kind:String(metadata.membershipKind||''), id:String(metadata.membershipId||''), accountId:String(metadata.accountId||''),
    subscriptionId:String((typeof object.subscription==='string'?object.subscription:'') || (object.object==='subscription'?object.id:'') || ''),
    customerId:String(typeof object.customer==='string'?object.customer:(object.customer?.id||'')),
    invoiceId:String((object.object==='invoice'?object.id:'') || (typeof object.invoice==='string'?object.invoice:'') || ''),
    stripeStatus:String(object.status||''),
    currentPeriodEnd:object.current_period_end?new Date(Number(object.current_period_end)*1000).toISOString():'',
    cancellationAtPeriodEnd:Boolean(object.cancel_at_period_end),
    summary:''
  };
}
async function applyProfessionalBillingLifecycle(event){
  const object=event?.data?.object||{}; const input=stripeObjectReference(object); input.eventType=String(event?.type||'');
  if(input.eventType==='invoice.payment_failed') input.summary='Stripe reported a failed recurring membership payment.';
  if(input.eventType==='charge.refunded') input.summary='Stripe reported a refunded membership charge.';
  const applied=await professionalMarketplace.applyMembershipLifecycle(input);
  if(applied.error){
    await paidPilotOperations.recordBillingIssue({dedupeKey:`reconcile:${event.id}`,type:'membership-reconciliation',severity:/failed|refunded|deleted/.test(input.eventType)?'high':'medium',accountId:input.accountId,membershipKind:input.kind,membershipId:input.id,stripeEventId:event.id,summary:`${input.eventType}: ${applied.error}`});
    return {handled:true,applied:false,error:applied.error,input};
  }
  if(input.accountId){
    if(input.eventType==='invoice.payment_failed') await pilotProgram.recordPayment(input.accountId,{status:'failed',reference:input.invoiceId||event.id});
    if(input.eventType==='customer.subscription.deleted') await pilotProgram.recordPayment(input.accountId,{status:'cancelled',reference:input.subscriptionId||event.id});
    if(input.eventType==='charge.refunded') await pilotProgram.recordPayment(input.accountId,{status:'refunded',reference:object.id||event.id});
  }
  if(input.eventType==='invoice.payment_failed') await paidPilotOperations.recordBillingIssue({dedupeKey:`payment-failed:${input.invoiceId||event.id}`,type:'recurring-payment-failed',severity:'high',accountId:input.accountId,membershipKind:input.kind,membershipId:input.id,stripeEventId:event.id,summary:'A recurring professional membership payment failed and requires owner follow-up.'});
  return {handled:true,applied:true,target:applied.target,input};
}
async function handleStripeWebhook(req, res){
  const rawBody = await readRawBody(req, BODY_LIMIT_BYTES);
  const verified = verifyStripeWebhookSignature(rawBody, req.headers['stripe-signature']);
  if (!verified.ok) { store.addAudit({ actor:'stripe', action:'stripe_webhook_rejected', details:{ error:verified.error } }); return json(res, 400, { ok:false, error:verified.error }); }
  let event;
  try { event = JSON.parse(rawBody.toString('utf8')); } catch { return json(res, 400, { ok:false, error:'Invalid JSON webhook body.' }); }
  const ledger=await paidPilotOperations.beginStripeEvent(event);
  if(ledger.error) return json(res,400,{ok:false,error:ledger.error});
  if(ledger.duplicate) return json(res,200,{received:true,duplicate:true,handled:ledger.event.status==='handled'||ledger.event.status==='ignored',status:ledger.event.status});
  let result = { received:true, handled:false };
  try{
    if (event && event.type && event.data && event.data.object && String(event.type).startsWith('checkout.session.')) {
      const session=event.data.object;
      if(session?.metadata?.kind==='professional_membership'){
        const applied=await applyProfessionalMembershipSession(session,event.type);
        result={received:true,handled:true,professionalMembership:true,activated:applied.activated,accountId:applied.accountId||'',error:applied.error||''};
        if(applied.error) await paidPilotOperations.recordBillingIssue({dedupeKey:`checkout:${event.id}`,type:'checkout-activation',severity:'high',accountId:applied.accountId||'',stripeEventId:event.id,summary:applied.error});
      } else if(session?.metadata?.kind==='public_paid_service'){
        const applied=await publicPaidServices.applyCheckoutSession(session,event.type);
        const order=applied.order||null;
        const c=order?.caseId?store.findCase(order.caseId):null;
        if(c){
          if(applied.paid){c.paymentStatus='paid online';c.paymentConfirmedAt=c.paymentConfirmedAt||store.now();c.status='Payment received — Human Review Specialist assignment pending';notification('payment_received_webhook',{caseId:c.id,email:c.email||'',sessionId:session.id,amountTotal:session.amount_total,currency:session.currency});}
          else if(event.type==='checkout.session.expired')c.paymentStatus='checkout expired — no payment recorded';
          c.updatedAt=store.now();store.upsertCase(c);
        }
        result={received:true,handled:true,publicPaidService:true,paid:Boolean(applied.paid),orderId:order?.id||'',caseId:order?.caseId||'',error:applied.error||''};
        if(applied.error)await paidPilotOperations.recordBillingIssue({dedupeKey:`public-checkout:${event.id}`,type:'public-checkout-application',severity:'high',stripeEventId:event.id,summary:applied.error});
      } else {
        const applied = applyStripeCheckoutSession(session, event.type);
        result = { received:true, handled:true, foundCase: applied.found, caseId: applied.caseId || applied.case?.id || '' };
      }
    } else if(event && event.type && /^(customer\.subscription\.|invoice\.(paid|payment_failed)|charge\.refunded)/.test(String(event.type))){
      const applied=await applyProfessionalBillingLifecycle(event);
      result={received:true,...applied};
    } else {
      store.addAudit({ actor:'stripe', action:'stripe_webhook_received_unhandled', details:{ type:event?.type || 'unknown' } });
      result={received:true,handled:false,ignored:true};
    }
    await paidPilotOperations.completeStripeEvent(event.id,{status:result.handled?'handled':'ignored',resultSummary:JSON.stringify({handled:result.handled,activated:result.activated||false,applied:result.applied||false}).slice(0,2000),lastError:result.error||''});
    return json(res, 200, result);
  }catch(err){
    await paidPilotOperations.completeStripeEvent(event.id,{status:'failed',lastError:err.message||'Webhook processing failed.'}).catch(()=>{});
    await paidPilotOperations.recordBillingIssue({dedupeKey:`webhook:${event.id}`,type:'webhook-processing',severity:'critical',stripeEventId:event.id,summary:err.message||'Stripe webhook processing failed.'}).catch(()=>{});
    return json(res,500,{ok:false,received:true,handled:false,error:'The signed event was recorded but could not be applied. Owner follow-up is required.'});
  }
}

async function handleApiCore(req, res, urlObj){
  const pathName = urlObj.pathname;
  const sensitiveRead = req.method === 'GET' && (/^\/api\/cases\//.test(pathName) || /^\/api\/community-partners\//.test(pathName) || pathName === '/api/admin/cases' || pathName.startsWith('/api/owner/') || pathName === '/api/system/master-rules-pack' || pathName === '/api/launch-readiness' || pathName === '/api/checkout/confirm' || pathName.startsWith('/api/professional/') || pathName.startsWith('/api/public/nys-attorneys'));
  if (['POST','PUT','PATCH','DELETE'].includes(req.method) || sensitiveRead) {
    const limited = rateLimit(req, pathName);
    if (limited) return json(res, 429, { ok:false, error:'Too many requests. Please try again later.', retryAfterSeconds: limited.retryAfterSeconds });
  }
  const stateChanging = ['POST','PUT','PATCH','DELETE'].includes(req.method);
  if (stateChanging && csrfProtectionEnabled() && requestUsesAuthenticatedCookie(req) && !csrfExemptPath(pathName)) {
    const check = validateCsrf(req);
    if (!check.ok) return json(res,403,{ok:false,error:check.error});
  }
  if (sensitiveTrafficGateEnforced() && sensitiveCasePath(pathName) && !sensitiveTrafficApproved()) return sensitiveUnavailable(res);
  if (req.method === 'GET' && pathName === '/livez') return readinessJson(res,200,serviceReadiness.liveness());
  if (req.method === 'GET' && pathName === '/readyz') {
    const snapshot=serviceReadiness.readiness(urlObj.searchParams.get('lane')||'');
    return readinessJson(res,snapshot.ok?200:503,snapshot);
  }
  if (req.method === 'GET' && pathName === '/health') {
    return json(res, 200, {
      ok:true,
      app:'Smarter Justice',
      version:VERSION,
      timestamp:new Date().toISOString(),
      practiceAreas:PRACTICE_AREAS.length,
      portalCount:PORTALS.length,
      sensitiveTrafficApproved:sensitiveTrafficApproved()
    });
  }
  if (req.method === 'GET' && pathName === '/api/system/master-rules-pack') {
    if (!requireRulesPackAccess(req)) return json(res, 403, { ok:false, error:'Approved portal or owner access is required.' });
    const requestedVersion = String(urlObj.searchParams.get('version') || masterRules.MASTER_RULES_PACK_VERSION);
    if (requestedVersion !== masterRules.MASTER_RULES_PACK_VERSION) return json(res, 404, { ok:false, error:'That rules-pack version is not available in this release.', currentVersion:masterRules.MASTER_RULES_PACK_VERSION });
    const format = String(urlObj.searchParams.get('format') || 'json').toLowerCase();
    if (format === 'markdown' || format === 'md') return text(res, 200, masterRules.markdown(), 'text/markdown; charset=utf-8');
    return json(res, 200, { ok:true, ...masterRules.apiPayload() });
  }
  if (req.method === 'GET' && pathName === '/api/public-config') return json(res, 200, {
    ok:true,
    sensitiveTrafficApproved:sensitiveTrafficApproved(),
    secureUploadsAvailable:sensitiveTrafficApproved(),
    contactRequestsAvailable:sensitiveTrafficApproved(),
    profileCorrectionRequestsAvailable:sensitiveTrafficApproved(),
    communityPartnerRegistrationAvailable:sensitiveTrafficApproved(),
    professionalMembershipInterestAvailable:sensitiveTrafficApproved(),
    sensitivePublicFormMessage:sensitiveTrafficApproved()?'Protected request forms are available.':'Protected request forms are temporarily unavailable. No information will be collected until protected storage and operating approval are active.',
    publicStoryRouting:{ available:true, saved:false },
    assistance:{ defaultMode:'rules-only', aiChoiceRequired:true, aiAssistanceAvailable:centralAiGateway.publicStatus().available, transparency:centralAiGateway.publicStatus() },
    liveChat:{
      configured:Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID),
      propertyId:String(process.env.TAWK_PROPERTY_ID || ''),
      widgetId:String(process.env.TAWK_WIDGET_ID || '')
    },
    publicServiceInitiatives:{
      stopDomesticViolence:{
        configured:Boolean(STOP_SIGN_PROJECT_DESTINATION_VERIFIED && STOP_DOMESTIC_VIOLENCE_URL && STOP_DOMESTIC_VIOLENCE_ARTWORK_PATH),
        siteUrl:STOP_DOMESTIC_VIOLENCE_URL,
        artworkPath:STOP_DOMESTIC_VIOLENCE_ARTWORK_PATH,
        title:'The Stop Sign Project',
        relationship:'A Domestic Violence Aid Community Initiative',
        domesticViolenceAidSafeEntry:'/domestic-violence-aid.html',
        liveDestinationAccepted:Boolean(STOP_SIGN_PROJECT_DESTINATION_VERIFIED && STOP_DOMESTIC_VIOLENCE_URL)
      }
    }
  });
  if (req.method === 'GET' && pathName === '/api/practice-areas') return json(res, 200, { practiceAreas: listPracticeSummaries(), states: US_STATES, defaultDocumentTypes: DEFAULT_DOCUMENT_TYPES });
  if (req.method === 'GET' && pathName === '/api/public/domain-network') return json(res, 200, { ok:true, ...domainRegistry.getPublicData() });
  if (req.method === 'GET' && pathName === '/api/public/attorney-partner-tour') return json(res, 200, { ok:true, tour:attorneyPartnerTour.publicTourData(urlObj.searchParams.get('practice') || '') });
  if (req.method === 'GET' && pathName === '/api/portals') return json(res, 200, { ok:true, portals: listPortalSummaries(), statuses: ['Available here now','Separate website available','Separate website not open yet','Planned'] });
  if (req.method === 'GET' && pathName.startsWith('/api/portals/')) { const slug = decodeURIComponent(pathName.split('/').pop() || ''); const portal = getPortalBySlug(slug); return portal ? json(res, 200, { ok:true, portal }) : json(res, 404, { ok:false, error:'Portal not found.' }); }
  if (req.method === 'GET' && pathName === '/api/portal-recommendation') { const practiceSlug = urlObj.searchParams.get('practice') || ''; const portal = recommendPortalForPractice(practiceSlug); return json(res, 200, { ok:true, practiceSlug, portal }); }
  if (req.method === 'GET' && pathName.startsWith('/api/intake-schema/')) {
    const slug = decodeURIComponent(pathName.split('/').pop() || 'other');
    return json(res, 200, { ok:true, slug, schema: schemaForPractice(slug), matterPath: schemaForMatterPath(slug) });
  }
  if (req.method === 'GET' && pathName === '/api/matter-paths') return json(res, 200, { ok:true, matterPaths: MATTER_PATHS });
  if (req.method === 'GET' && pathName === '/api/ai-status') {
    const status=centralAiGateway.publicStatus();
    return json(res, 200, { ok:true, ...status, message:status.available?'OpenAI-assisted structured organization is optional. Guided rules-based help remains available without AI.':'Guided rules-based help is available. OpenAI-assisted organization is not currently open.' });
  }
  if (req.method === 'POST' && /^\/api\/internal\/ai-gateway\/v1\/tools\/[^/]+$/.test(pathName)) {
    const auth=centralAiGateway.authenticatePortal(req);
    if(!auth.ok)return json(res,403,{ok:false,errorCode:auth.code,error:'Server-to-server portal authorization failed.'});
    const body=await parseJson(req);const toolId=decodeURIComponent(pathName.split('/').pop()||'');
    if(body.prompt!==undefined)return json(res,400,{ok:false,errorCode:'INPUT_INVALID',error:'Arbitrary prompts are not accepted. Call a registered tool with structured input.'});
    if(body.contractVersion!=='sj-ai-gateway-v1.0.0')return json(res,409,{ok:false,errorCode:'INPUT_INVALID',error:'Gateway contract version mismatch.',currentContractVersion:'sj-ai-gateway-v1.0.0'});
    if(body.toolId&&body.toolId!==toolId)return json(res,400,{ok:false,errorCode:'INPUT_INVALID',error:'Tool identity mismatch.'});
    const result=await centralAiGateway.executeRegisteredTool({portalId:auth.portalId,toolId,input:body.input,correlationId:body.correlationId,accountId:body.accountId,ipHash:body.ipHash});
    const statusCode=result.statusCode||200;const payload={ok:statusCode<400,...result};delete payload.statusCode;return json(res,statusCode,payload);
  }
  if (req.method === 'GET' && pathName === '/api/professional-program-status') return json(res,200,{ok:true,...pilotProgram.publicProgramStatus()});
  if (req.method === 'GET' && pathName === '/api/public/launch-status') return json(res,200,{ok:true,...launchCommandCenter.publicStatus()});
  if (req.method === 'GET' && pathName === '/api/public/service-status') return json(res,200,serviceReadiness.publicStatus());
  if (req.method === 'GET' && pathName === '/api/official-source-catalog') return json(res, 200, { catalog: listCatalog(), readinessLevels: FORM_READINESS_LEVELS });
  if (req.method === 'GET' && pathName === '/api/form-paths') return json(res, 200, { formPaths: FORM_PATHS, readinessLevels: FORM_PATH_READINESS, reviewReadyDraftPaths: REVIEW_READY_DRAFT_PATHS, reviewReadyDraftLevels: REVIEW_READY_DRAFT_LEVELS });
  if (req.method === 'GET' && pathName === '/api/review-ready-draft-paths') return json(res, 200, { ok:true, draftPaths: REVIEW_READY_DRAFT_PATHS, levels: REVIEW_READY_DRAFT_LEVELS });
  if (req.method === 'GET' && pathName === '/api/launch-readiness') {
    if (!requireAdmin(req, urlObj)) return json(res, 403, { ok:false, error:'Admin access is required.' });
    return json(res, 200, { ok:true, version: VERSION, checklist: launchReadinessChecklist(), launchCommandCenter:launchCommandCenter.ownerView() });
  }
  if (req.method === 'POST' && pathName === '/api/public/story-route') {
    const limited = rateLimit(req, 'public-story-route', { maxRequests:30, windowMs:60*60*1000 });
    if (limited) return json(res, 429, { ok:false, error:'Too many starting-point requests. Please try again later.', retryAfterSeconds:limited.retryAfterSeconds });
    const body = await parseJson(req);
    const question = String(body.question || '').slice(0, 2500).trim();
    if (question.length < 20) return json(res, 400, { ok:false, error:'Please add a little more detail so Smarter Justice can identify a useful starting point.' });
    const analysis = buildStartingPoint({ question, practiceArea:String(body.practiceArea || ''), subcategory:'', state:String(body.state || ''), county:'', city:'', attachments:[], documentType:'', smartAnswers:{} });
    const routes = recommendPortalsForStory(question, analysis.practiceSlug);
    const domesticViolenceRoute = analysis.practiceSlug === 'domestic-violence-protection-orders';
    const cleanPortal = portal => portal ? ({
      slug:portal.slug,
      name:portal.name,
      status:portal.status,
      publicUrl:portal.publicUrl || '',
      availabilityMessage:portal.availabilityMessage || '',
      userRouteMessage:portal.userRouteMessage || '',
      storySignals:portal.storySignals || []
    }) : null;
    const urgentConcerns = domesticViolenceRoute
      ? ['Safety may be time-sensitive. Use emergency services when there is immediate danger and use a safer device when the current device may be monitored.']
      : (analysis.concerns || []).filter(item => /deadline|urgent|court date|hearing|eviction|foreclosure|deport|garnish|levy|expires|today|tomorrow/i.test(item)).slice(0,3);
    const helpfulDetails = domesticViolenceRoute
      ? ['Whether it is safe to continue using this device','State or county for local resources','Whether you want an advocate, shelter, court information, document help, or a lawyer search']
      : (analysis.dynamicMissingInformation || []).map(item => item.label || item.field || String(item)).filter(Boolean).slice(0,4);
    return json(res, 200, {
      ok:true,
      saved:false,
      message:'This starting-point result did not create an account or save your description.',
      practice:{ slug:analysis.practiceSlug, name:analysis.practiceName },
      primaryPortal:cleanPortal(routes.primary),
      relatedPortals:(routes.related || []).map(cleanPortal),
      urgentConcerns,
      helpfulDetails,
      disclosure:domesticViolenceRoute
        ? 'Domestic Violence Aid is the safety-first starting portal. This result does not create an account or save your description. Current resource details and any live external handoff remain closed until dated safety and staging acceptance is recorded. Smarter Justice is not an emergency service, hotline, shelter, law firm, court, police department, or government agency.'
        : 'This is a starting-point suggestion, not legal or tax advice. Review deadlines and professional credentials independently.'
    });
  }
  if (req.method === 'POST' && pathName === '/api/free-question') {
    const body = await parseJson(req);
    const question = String(body.question || '').slice(0, 2500);
    if (!question.trim()) return json(res, 400, { ok:false, error:'Please describe what happened or what you need help with.' });
    const inferredPractice = inferPractice(question, String(body.practiceArea || ''));
    if (inferredPractice?.slug === 'domestic-violence-protection-orders') return json(res,409,{
      ok:false,
      error:'Domestic-violence descriptions and documents are not saved through the general Smarter Justice starting path. Use the Domestic Violence Aid safe entry page without entering a narrative. Current resource details and any live external handoff remain gated until safety review is accepted.',
      safeAlternative:(STOP_SIGN_PROJECT_DESTINATION_VERIFIED && STOP_DOMESTIC_VIOLENCE_URL) ? STOP_DOMESTIC_VIOLENCE_URL : '/domestic-violence-aid.html',
      noSavedRecord:true
    });
    const id = store.uid('case');
    const continuationToken = store.secureToken('continue');
    const smartAnswers = collectSmartAnswers(body);
    const normalizedUploads = normalizeAttachmentInputs(body.attachments);
    const savedAttachments = normalizedUploads.accepted.map(a => store.saveAttachment(id, { ...a, documentType: body.documentType || smartAnswers.documentType || '' }, { sensitiveTrafficApproved:sensitiveTrafficApproved() })).filter(Boolean);
    const aiPreference = normalizeAiPreference(body.aiPreference);
    const analysis = buildStartingPoint({ question: enrichQuestion(body), practiceArea: body.practiceArea, subcategory: body.subcategory, state: body.state, county: body.county, city: body.city, attachments: savedAttachments, documentType: body.documentType || smartAnswers.documentType || '', smartAnswers });
    analysis.recommendedPortal = recommendPortalForPractice(analysis.practiceSlug, String(body.requestedPortal || ''));
    analysis.portalRouting = { umbrella:'Smarter Justice', recommendedPortalSlug: analysis.recommendedPortal.slug, recommendedPortalName: analysis.recommendedPortal.name, status: analysis.recommendedPortal.status, userMessage: analysis.recommendedPortal.userRouteMessage };
    analysis.aiReview = await buildAssistanceReview({ preference:aiPreference, caseInput: { question, practiceArea: body.practiceArea, subcategory: body.subcategory, state: body.state, county: body.county, city: body.city, documentType: body.documentType || smartAnswers.documentType || '', smartAnswers }, analysis });
    const preferenceRecordedAt = store.now();
    const c = {
      id, continuationToken,
      createdAt: store.now(), updatedAt: store.now(),
      fullName: String(body.fullName || '').slice(0,120), email: String(body.email || '').slice(0,180), phone: String(body.phone || '').slice(0,80),
      language: body.language || 'en', question, practiceSlug: analysis.practiceSlug, practiceName: analysis.practiceName, subcategory: analysis.subcategory,
      jurisdiction: analysis.jurisdiction, status: 'Started — saved work created',
      humanReviewLane: analysis.humanReview, professionalReviewLane: analysis.professionalReview,
      paymentStatus: 'not requested yet', deliveryStatus: 'not ready for delivery', referralCode: body.referralCode || '',
      attachments: savedAttachments, analysis, correctNextPath: analysis.correctNextPath || analysis.matterPath?.userNextPathTitle || '',
      formPathEvaluation: analysis.formPathEvaluation || null, uploadWarnings: normalizedUploads.warnings || [],
      documentType: body.documentType || smartAnswers.documentType || '',
      deadlineDate: body.deadlineDate || smartAnswers.deadlineDate || '',
      dateReceived: body.dateReceived || smartAnswers.dateReceived || '',
      desiredHelp: body.desiredHelp || smartAnswers.desiredHelp || '',
      smartAnswers,
      aiPreference, aiConsentAt:aiPreference==='ai-assisted'?preferenceRecordedAt:'', aiPreferenceUpdatedAt:preferenceRecordedAt,
      futureLeadFieldsCaptured: { urgency: body.urgency || '', zipCode: body.zipCode || '', noticeOrDeadline: body.noticeOrDeadline || '', deadlineDate: body.deadlineDate || smartAnswers.deadlineDate || '', dateReceived: body.dateReceived || smartAnswers.dateReceived || '', agencyOrCourt: body.agencyOrCourt || body.courtOrAgency || smartAnswers.courtOrAgency || '', documentType: body.documentType || smartAnswers.documentType || '', amountInvolved: body.amountInvolved || smartAnswers.amountInvolved || '', opposingParty: body.opposingParty || smartAnswers.opposingParty || '', desiredHelp: body.desiredHelp || smartAnswers.desiredHelp || '', consentToContact: Boolean(body.consentToContact) },
      continuationLink: makeContinuationLink(continuationToken), tokenIssuedAt: store.now(), tokenExpiresAt: new Date(Date.now()+CONTINUATION_TOKEN_DAYS*86400000).toISOString(), continuationAccessRevokedAt:'', continuationAccessRevokedReason:'', formDraftStatus: 'not generated yet', draftPackageReady: false,
      reviewReadyDraftStatus: 'not reviewed yet', reviewReadyDraftApprovedAt: '', reviewReadyDraftOverrides: {}, reviewReadyDraftFieldNotes: '', requestedPortal: String(body.requestedPortal || '').slice(0,80), recommendedPortal: analysis.recommendedPortal, staffNotes: []
    };
    c.reviewReadyDraft = buildReviewReadyDraftEvaluation(c);
    c.analysis.reviewReadyDraft = c.reviewReadyDraft;
    store.upsertCase(c);
    store.addAudit({ actor:'user', action:'saved_work_created', caseId:id, details:{ practice:c.practiceName, referralCode:c.referralCode, attachments:savedAttachments.length, assistancePreference:aiPreference } });
    notification('new_free_question', { caseId: id, practice: c.practiceName, subcategory: c.subcategory, referralCode: c.referralCode, urgent: analysis.concerns });
    if (c.email) notification('free_question_received', { caseId:id, email:c.email, practice:c.practiceName, continuationLink:c.continuationLink });
    return json(res, 200, { ok:true, case: publicCase(c), message:'Your saved work is ready.' });
  }
  if (req.method === 'GET' && pathName.startsWith('/api/cases/') && pathName.endsWith('/review-package')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = findUserCase(id);
    if (!c) return json(res, 404, { ok:false, error:'File not found.' });
    return text(res, 200, buildReviewPackageHtml(c), 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && pathName.startsWith('/api/cases/') && pathName.endsWith('/draft-package')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = findUserCase(id);
    if (!c) return json(res, 404, { ok:false, error:'File not found.' });
    store.addAudit({ actor:'user', action:'draft_package_opened', caseId:c.id, details:{ formDraftStatus:c.formDraftStatus || '' } });
    return text(res, 200, buildDraftPackageHtml(c), 'text/html; charset=utf-8');
  }

  if (req.method === 'POST' && pathName.startsWith('/api/cases/') && pathName.endsWith('/draft-details')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = findUserCase(id);
    if (!c) return json(res, 404, { ok:false, error:'File not found.' });
    const body = await parseJson(req);
    const details = body.details && typeof body.details === 'object' ? body.details : body;
    const allowed = {};
    for (const [key, value] of Object.entries(details || {})) {
      if (/^[a-zA-Z0-9_.-]{1,80}$/.test(key) && value !== undefined && value !== null) allowed[key] = String(value).slice(0,1200);
    }
    c.smartAnswers = { ...(c.smartAnswers || {}), ...allowed };
    c.updatedAt = store.now();
    rebuildCaseAnalysis(c);
    store.upsertCase(c);
    store.addAudit({ actor:'user', action:'review_ready_draft_details_updated', caseId:c.id, details:{ fields:Object.keys(allowed) } });
    return json(res, 200, { ok:true, case: publicCase(c), reviewReadyDraft:c.reviewReadyDraft });
  }

  if (req.method === 'GET' && pathName.startsWith('/api/cases/') && pathName.endsWith('/review-ready-draft')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = findUserCase(id);
    if (!c) return json(res, 404, { ok:false, error:'File not found.' });
    if (!c.reviewReadyDraft) { c.reviewReadyDraft = buildReviewReadyDraftEvaluation(c); c.analysis = c.analysis || {}; c.analysis.reviewReadyDraft = c.reviewReadyDraft; store.upsertCase(c); }
    store.addAudit({ actor:'user', action:'review_ready_draft_opened', caseId:c.id, details:{ reviewReadyDraftStatus:c.reviewReadyDraftStatus || '' } });
    return text(res, 200, buildReviewReadyDraftHtml(c), 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && pathName.startsWith('/api/cases/') && pathName.endsWith('/review-ready-draft.json')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = findUserCase(id);
    if (!c) return json(res, 404, { ok:false, error:'File not found.' });
    if (!c.reviewReadyDraft) c.reviewReadyDraft = buildReviewReadyDraftEvaluation(c);
    return json(res, 200, { ok:true, reviewReadyDraft:c.reviewReadyDraft, case:publicCase(c) });
  }
  if (req.method === 'GET' && pathName.startsWith('/api/cases/')) {
    const id = decodeURIComponent(pathName.split('/').pop());
    const c = findUserCase(id);
    if (!c) return json(res, 404, { ok:false, error:'Case not found.' });
    return json(res, 200, { ok:true, case: publicCase(c) });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/cases/') && pathName.endsWith('/upload')) {
    const parts = pathName.split('/'); const id = decodeURIComponent(parts[3]);
    const c = findUserCase(id); if (!c) return json(res, 404, { ok:false, error:'Case not found.' });
    const body = await parseJson(req);
    const normalizedUploads = normalizeAttachmentInputs(body.attachments);
    const saved = normalizedUploads.accepted.map(a => store.saveAttachment(c.id, a, { sensitiveTrafficApproved:sensitiveTrafficApproved() })).filter(Boolean);
    c.uploadWarnings = [...(c.uploadWarnings || []), ...(normalizedUploads.warnings || [])].slice(-20);
    c.attachments = [...(c.attachments || []), ...saved]; c.updatedAt = store.now();
    rebuildCaseAnalysis(c);
    c.aiPreference=normalizeAiPreference(c.aiPreference);
    c.analysis.aiReview = await buildAssistanceReview({ preference:c.aiPreference, caseInput: { question:c.question, practiceArea:c.practiceSlug, subcategory:c.subcategory, state:c.jurisdiction.state, county:c.jurisdiction.county, city:c.jurisdiction.city, documentType:c.documentType || '', smartAnswers:c.smartAnswers || {} }, analysis:c.analysis });
    c.analysis.reviewReadyDraft = c.reviewReadyDraft;
    c.correctNextPath = c.analysis.correctNextPath || c.analysis.matterPath?.userNextPathTitle || '';
    store.upsertCase(c); store.addAudit({ actor:'user', action:'documents_added', caseId:c.id, details:{ count:saved.length } }); notification('case_upload_added', { caseId: c.id, email:c.email || '', count: saved.length, practice: c.practiceName, continuationLink:c.continuationLink });
    return json(res, 200, { ok:true, attachments: saved.map(publicAttachment).filter(Boolean), case: publicCase(c) });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/cases/') && pathName.endsWith('/assistance-preference')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = findUserCase(id);
    if (!c) return json(res,404,{ok:false,error:'Saved work not found.'});
    const body = await parseJson(req);
    const preference = normalizeAiPreference(body.aiPreference);
    c.aiPreference=preference;
    c.aiPreferenceUpdatedAt=store.now();
    c.aiConsentAt=preference==='ai-assisted'?c.aiPreferenceUpdatedAt:'';
    rebuildCaseAnalysis(c);
    c.analysis.aiReview=await buildAssistanceReview({preference,caseInput:{question:c.question,practiceArea:c.practiceSlug,subcategory:c.subcategory,state:c.jurisdiction?.state||'',county:c.jurisdiction?.county||'',city:c.jurisdiction?.city||'',documentType:c.documentType||'',smartAnswers:c.smartAnswers||{}},analysis:c.analysis});
    c.updatedAt=store.now();
    store.upsertCase(c);
    store.addAudit({actor:'user',action:'assistance_preference_updated',caseId:c.id,details:{assistancePreference:preference,externalAiUsed:Boolean(c.analysis.aiReview?.externalAiUsed)}});
    return json(res,200,{ok:true,message:preference==='ai-assisted'?'AI-assisted organization was requested. Guided rules-based help will be used whenever AI is unavailable.':'Your saved work will use guided rules-based organization without external AI.',case:publicCase(c)});
  }
  if (req.method === 'POST' && pathName.startsWith('/api/cases/') && pathName.endsWith('/email-link')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = findUserCase(id);
    if (!c) return json(res, 404, { ok:false, error:'File not found.' });
    const body = await parseJson(req);
    const email = String(body.email || c.email || '').slice(0,180);
    if (!email || !/@/.test(email)) return json(res, 400, { ok:false, error:'Add an email address first.' });
    c.email = email; c.updatedAt = store.now(); store.upsertCase(c);
    const note = notification('private_continuation_link_requested', { caseId:c.id, email, continuationLink:c.continuationLink });
    store.addAudit({ actor:'user', action:'private_link_email_requested', caseId:c.id, details:{ email } });
    return json(res, 200, { ok:true, message: process.env.SMTP_HOST ? 'A private link email is queued.' : 'Your request was saved, but email delivery is not available yet. Keep this private link so you can return.', notificationId: note.id });
  }
  if (req.method === 'POST' && (pathName === '/api/contact' || pathName === '/api/help')) {
    const body = await parseJson(req);
    const note = notification('contact_help_form', { name: body.name || '', email: body.email || '', phone: body.phone || '', message: String(body.message || '').slice(0,2500), page: body.page || '' });
    return json(res, 200, { ok:true, message:'Your message was saved for Smarter Justice support.', notificationId: note.id });
  }
  if (req.method === 'POST' && pathName === '/api/community-partners/register') {
    const body = await parseJson(req);
    const name = String(body.name || '').trim().slice(0,140);
    if (!name) return json(res, 400, { ok:false, error:'Add the Community Partner name.' });
    const code = makePartnerCode(name, body.requestedCode);
    const accessToken = store.secureToken('partner');
    const dashboardUrl = `${BASE_URL.replace(/\/$/,'')}/community-partner-tools.html?code=${encodeURIComponent(code)}#access=${encodeURIComponent(accessToken)}`;
    const flyerUrl = `${BASE_URL.replace(/\/$/,'')}/partner-flyer.html?code=${encodeURIComponent(code)}`;
    const partner = store.upsertPartner({ id: store.uid('partner'), code, accessToken, name, contactName: String(body.contactName || '').slice(0,140), email: String(body.email || '').slice(0,180), phone: String(body.phone || '').slice(0,80), type: String(body.type || '').slice(0,80), createdAt: store.now(), credits: 0, starts: 0, dashboardUrl, flyerUrl });
    notification('community_partner_registered', { code, name: partner.name, email: partner.email });
    store.addAudit({ actor:'community_partner', action:'partner_registered', details:{ code, name:partner.name } });
    return json(res, 200, { ok:true, partner: publicPartner(partner) });
  }
  if (req.method === 'GET' && pathName.startsWith('/api/community-partners/')) {
    const code = decodeURIComponent(pathName.split('/').pop());
    const partner = store.allPartners().find(p => p.code === code);
    if (!partner) return json(res, 404, { ok:false, error:'Community Partner dashboard not found.' });
    if (!partner.accessToken) return json(res, 409, { ok:false, error:'This older dashboard needs a new private access link from Smarter Justice support.' });
    if (!requirePartnerAccess(req, urlObj, partner)) return json(res, 403, { ok:false, error:'The private dashboard access key is required.' });
    const cases = store.allCases().filter(c => c.referralCode === code);
    const credited = cases.filter(c => /paid|waived/i.test(String(c.paymentStatus || ''))).length;
    return json(res, 200, { ok:true, partner: publicPartner(partner), summary:{ starts:cases.length, credits:credited }, referredStarts: cases.slice(0,100).map(publicReferralStart) });
  }
  if (req.method === 'GET' && pathName === '/api/qr') {
    const data = urlObj.searchParams.get('data') || BASE_URL;
    return text(res, 200, svgQr(data), 'image/svg+xml');
  }


  if (req.method === 'GET' && pathName === '/api/staff/auth/status') return jsonWithCookie(res,200,{ok:true,authenticated:staffSessionValid(req)},csrfCookieForRequest(req));
  if (req.method === 'POST' && pathName === '/api/staff/auth/login') {
    const body=await parseJson(req); const configured=String(process.env.ADMIN_TOKEN || '').trim(); const supplied=String(body.token || '').trim();
    if (!configured || supplied.length !== configured.length || !crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(configured))) return json(res,401,{ok:false,error:'The authorized team access code was not accepted.'});
    const session=issueStaffSession(); if(!session)return json(res,503,{ok:false,error:'Authorized team access is not configured.'});
    return jsonWithCookie(res,200,{ok:true,message:'Authorized team access is active.'},[staffSessionCookie(session),csrfCookieForRequest(req)]);
  }
  if (req.method === 'POST' && pathName === '/api/staff/auth/logout') return jsonWithCookie(res,200,{ok:true},[staffSessionCookie('',true),security.csrfCookie('',true)]);

  if (req.method === 'GET' && pathName === '/api/owner/auth/status') {
    const auth=ownerAccounts.accountFromRequest(req); const status=ownerAccounts.status();
    return jsonWithCookie(res,200,{ok:true,authenticated:Boolean(auth),account:auth?.account || null,accountAuthenticationReady:status.accountAuthenticationReady,mfaRequiredForAll:status.mfaRequiredForAll,legacyTokenAllowed:process.env.NODE_ENV!=='production' || /^true|1|yes$/i.test(String(process.env.ALLOW_LEGACY_OWNER_TOKEN || ''))},csrfCookieForRequest(req));
  }
  if (req.method === 'POST' && pathName === '/api/owner/auth/login') {
    const limited=rateLimit(req,'owner-login',{maxRequests:10,windowMs:15*60*1000}); if(limited) return json(res,429,{ok:false,error:'Too many sign-in attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds});
    const result=ownerAccounts.login(await parseJson(req),{ip:getIp(req),userAgent:req.headers['user-agent'] || ''});
    return result.error?json(res,401,{ok:false,error:result.error,mfaRequired:Boolean(result.mfaRequired),emailVerificationRequired:Boolean(result.emailVerificationRequired)}):jsonWithCookie(res,200,{ok:true,account:result.account,expiresAt:result.session.expiresAt},[result.session.cookie,csrfCookieForRequest(req)]);
  }
  if (req.method === 'POST' && pathName === '/api/owner/auth/logout') { const result=ownerAccounts.logout(req); return jsonWithCookie(res,200,{ok:true},[result.cookie,security.csrfCookie('',true)]); }
  if (req.method === 'POST' && pathName === '/api/owner/auth/mfa/begin') { const result=ownerAccounts.beginMfa(req); if(result.unauthorized)return json(res,401,{ok:false,error:'Owner sign-in is required.'}); return json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/auth/mfa/confirm') { const body=await parseJson(req); const result=ownerAccounts.confirmMfa(req,body.code); if(result.unauthorized)return json(res,401,{ok:false,error:'Owner sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/auth/recovery-codes/rotate') { const result=ownerAccounts.rotateRecoveryCodes(req,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Owner sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/auth/sessions/revoke-others') { const result=ownerAccounts.revokeOtherSessions(req); return result.unauthorized?json(res,401,{ok:false,error:'Owner sign-in is required.'}):json(res,200,{ok:true,...result}); }

  if (req.method === 'GET' && pathName === '/api/public/launch-invitation') { const result=launchOutreachOperations.resolveInvitation(urlObj.searchParams.get('token')||''); return result.error?json(res,404,{ok:false,error:result.error}):json(res,200,{ok:true,invitation:result.invitation}); }
  if (req.method === 'POST' && pathName === '/api/public/launch-invitation/open') { const body=await parseJson(req); const result=launchOutreachOperations.recordInvitationOpen(body.token||''); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,invitation:result.invitation}); }
  if (req.method === 'POST' && pathName === '/api/public/launch-event') { const result=launchOutreachOperations.recordEvent(await parseJson(req),'public-launch'); return json(res,200,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/public/professional-growth-policy') return json(res,200,{ok:true,...professionalPromotionProgram.publicPolicy()});
  if (req.method === 'GET' && pathName === '/api/public/professionals') {
    return json(res,200,{ok:true,...professionalMarketplace.searchPublicProfessionals({q:urlObj.searchParams.get('q'),city:urlObj.searchParams.get('city')||urlObj.searchParams.get('borough'),postalCode:urlObj.searchParams.get('postalCode'),state:urlObj.searchParams.get('state'),county:urlObj.searchParams.get('county'),practiceArea:urlObj.searchParams.get('practice'),professionalType:urlObj.searchParams.get('professionalType')||urlObj.searchParams.get('type'),language:urlObj.searchParams.get('language'),serviceMethod:urlObj.searchParams.get('serviceMethod'),profileStatus:urlObj.searchParams.get('profileStatus'),sourceFreshness:urlObj.searchParams.get('sourceFreshness'),inquiryAvailability:urlObj.searchParams.get('inquiryAvailability'),portal:urlObj.searchParams.get('portal'),limit:urlObj.searchParams.get('limit'),offset:urlObj.searchParams.get('offset')})});
  }
  if (req.method === 'POST' && pathName === '/api/public/profile-requests') {
    const limited=rateLimit(req,'public-profile-request',{maxRequests:8,windowMs:60*60*1000});
    if(limited)return json(res,429,{ok:false,error:'Too many profile requests were submitted from this connection. Try again later.',retryAfterSeconds:limited.retryAfterSeconds});
    const body=await parseJson(req);
    if(!body.privacyAcknowledged)return json(res,400,{ok:false,error:'Confirm that the request does not include client-confidential, financial-account, medical, or government-identifier information.'});
    if(String(body.requestType||'').trim()==='claim')return json(res,400,{ok:false,error:'Profile claims require a verified professional account. Use the claim link on the profile.'});
    const result=professionalMarketplace.createProfileRequest(body,'public-profile-request');
    if(result.error)return json(res,400,{ok:false,error:result.error});
    return json(res,201,{ok:true,receipt:professionalMarketplace.publicProfileRequestReceipt(result.request),message:'Your profile request was recorded for review. Keep the reference number. Smarter Justice may ask for identity or source information before making a change.'});
  }
  if (req.method === 'GET' && pathName.startsWith('/api/public/professionals/')) {
    const id=decodeURIComponent(pathName.split('/').pop()||''); const professional=professionalMarketplace.getPublicProfessional(id);
    return professional?json(res,200,{ok:true,professional}):json(res,404,{ok:false,error:'Professional profile not found.'});
  }
  if (req.method === 'GET' && pathName === '/api/public/firms') return json(res,200,{ok:true,...professionalMarketplace.searchPublicFirms({q:urlObj.searchParams.get('q'),city:urlObj.searchParams.get('city')||urlObj.searchParams.get('borough'),postalCode:urlObj.searchParams.get('postalCode'),state:urlObj.searchParams.get('state'),county:urlObj.searchParams.get('county'),practiceArea:urlObj.searchParams.get('practice'),language:urlObj.searchParams.get('language'),serviceMethod:urlObj.searchParams.get('serviceMethod'),profileStatus:urlObj.searchParams.get('profileStatus'),sourceFreshness:urlObj.searchParams.get('sourceFreshness'),inquiryAvailability:urlObj.searchParams.get('inquiryAvailability'),portal:urlObj.searchParams.get('portal'),limit:urlObj.searchParams.get('limit'),offset:urlObj.searchParams.get('offset')})});
  if (req.method === 'GET' && pathName.startsWith('/api/public/firms/')) { const id=decodeURIComponent(pathName.split('/').pop()||''); const firm=professionalMarketplace.getPublicFirm(id); return firm?json(res,200,{ok:true,firm}):json(res,404,{ok:false,error:'Firm profile not found.'}); }
  if (req.method === 'GET' && pathName === '/api/public/nys-attorneys') {
    try { const result=await professionalSources.previewNysAttorneys({firstName:urlObj.searchParams.get('firstName'),lastName:urlObj.searchParams.get('lastName'),registrationNumber:urlObj.searchParams.get('registrationNumber'),county:urlObj.searchParams.get('county'),city:urlObj.searchParams.get('city'),state:urlObj.searchParams.get('state'),companyName:urlObj.searchParams.get('companyName'),streetAddress:urlObj.searchParams.get('streetAddress'),limit:urlObj.searchParams.get('limit'),offset:urlObj.searchParams.get('offset')}); return json(res,200,{ok:true,officialSource:true,source:result.source,queryUrl:result.queryUrl,count:result.count,professionals:result.rows.map(x=>({displayName:x.displayName,professionalType:x.professionalType,officeLocations:x.officeLocations,jurisdictions:x.jurisdictions,publicFacts:x.publicFacts,sourceRecords:x.sourceRecords,claimable:true,disclosure:'Official public registration information. This record is not a Smarter Justice membership, endorsement, or consultation offer.'}))}); } catch(err){ return json(res,502,{ok:false,error:'The official New York attorney data source could not be reached. Try again later.',detail:process.env.NODE_ENV==='test'?err.message:undefined}); }
  }
  if (req.method === 'GET' && pathName === '/api/initial-launch-pilots') return json(res,200,{ok:true,version:INITIAL_LAUNCH_PILOT_VERSION,pilots:listInitialLaunchPilots(),profileAuthority:'Smarter Justice',publicProfileAuthority:'focused legal micro-portals',claimArchitecture:'portal-first discovery with central Smarter Justice execution'});
  if (req.method === 'GET' && pathName === '/api/founding-launch-portals') {
    return json(res,200,{ok:true,version:FOUNDING_LAUNCH_VERSION,portals:listFoundingLaunchPortals(),disclosure:'Portal status, domain ownership, professional participation, deployment, and live availability are separate states.'});
  }
  if (req.method === 'GET' && pathName === '/api/revenue-access-model') { return json(res,200,{ok:true,...revenueAccessModel.publicView()}); }
  if (req.method === 'GET' && pathName === '/api/public/paid-services') { const catalog=publicPaidServices.publicCatalog(service=>publicPaidServiceEnvironment(service)); catalog.services=catalog.services.map(service=>({...service,availabilityMessage:service.available?'Available for secure checkout.':'Not open for purchase yet.'})); return json(res,200,{ok:true,...catalog}); }
  if (req.method === 'GET' && pathName === '/api/public/field-launch/config') { return json(res,200,{ok:true,...fieldLaunchProgram.publicConfig(urlObj.searchParams.get('campaign')||'')}); }
  if (req.method === 'POST' && pathName === '/api/public/field-launch/events') {
    const limited=rateLimit(req,'field-launch-events',{maxRequests:120,windowMs:60*60*1000});
    if(limited)return json(res,429,{ok:false,error:'Too many field-attribution events. Try again later.',retryAfterSeconds:limited.retryAfterSeconds});
    const body=await parseJson(req); const result=await fieldLaunchProgram.recordEvent(body);
    return result.error?json(res,400,{ok:false,...result}):json(res,201,{ok:true,recorded:true,idempotentReplay:Boolean(result.idempotentReplay)});
  }
  if (req.method === 'GET' && pathName.startsWith('/api/founding-launch-portals/')) {
    const slug=decodeURIComponent(pathName.split('/').pop()||''); const portal=getFoundingLaunchPortal(slug);
    return portal?json(res,200,{ok:true,version:FOUNDING_LAUNCH_VERSION,portal}):json(res,404,{ok:false,error:'Founding launch portal not found.'});
  }
  if (req.method === 'POST' && pathName === '/api/professional/auth/signup') { const limited=rateLimit(req,'professional-signup',{maxRequests:8,windowMs:60*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many account-creation attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const result=await professionalAccounts.createAccount(await parseJson(req)); if(result.error)return json(res,400,{ok:false,error:result.error}); const payload={ok:true,account:result.account,verification:result.verification,message:result.message}; return result.session?jsonWithCookie(res,201,payload,[result.session.cookie,csrfCookieForRequest(req)]):json(res,201,payload); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/login') { const limited=rateLimit(req,'professional-login',{maxRequests:10,windowMs:15*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many sign-in attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const result=professionalAccounts.login(await parseJson(req)); if(!result.error)await store.flush(); return result.error?json(res,401,{ok:false,error:result.error,mfaRequired:Boolean(result.mfaRequired),emailVerificationRequired:Boolean(result.emailVerificationRequired)}):jsonWithCookie(res,200,{ok:true,account:result.account},[result.session.cookie,csrfCookieForRequest(req)]); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/logout') { const result=professionalAccounts.logout(req); await store.flush(); return jsonWithCookie(res,200,{ok:true},[result.cookie,security.csrfCookie('',true)]); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/email-verification/request') { const limited=rateLimit(req,'professional-email-verification-request',{maxRequests:5,windowMs:60*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many verification requests. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const body=await parseJson(req); const result=await professionalAccounts.requestEmailVerification(body.email); return json(res,200,{ok:true,message:'If an unverified account matches that address, a verification message will be sent.',...(process.env.NODE_ENV==='test'&&result.testToken?{testToken:result.testToken}:{})}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/email-verification/confirm') { const limited=rateLimit(req,'professional-email-verification-confirm',{maxRequests:10,windowMs:30*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many verification attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const body=await parseJson(req); const result=await professionalAccounts.verifyEmail(body.token); return result.error?json(res,400,{ok:false,error:result.error}):jsonWithCookie(res,200,{ok:true,account:result.account,message:'Your email address is verified. You are now signed in.'},[result.session.cookie,csrfCookieForRequest(req)]); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/password-reset/request') { const limited=rateLimit(req,'professional-password-reset-request',{maxRequests:5,windowMs:60*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many password-reset requests. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const body=await parseJson(req); const result=await professionalAccounts.requestPasswordReset(body.email); return json(res,200,{ok:true,message:'If an active account matches that address, a password-reset message will be sent.',...(process.env.NODE_ENV==='test'&&result.testToken?{testToken:result.testToken}:{})}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/password-reset/confirm') { const limited=rateLimit(req,'professional-password-reset-confirm',{maxRequests:10,windowMs:30*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many password-reset attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const body=await parseJson(req); const result=professionalAccounts.resetPassword(body.token,body.password); if(!result.error)await store.flush(); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,message:'Your password was reset. Sign in again on all devices.'}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/mfa/begin') { const result=professionalAccounts.beginMfa(req); if(!result.unauthorized&&!result.error)await store.flush(); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/mfa/confirm') { const body=await parseJson(req); const result=professionalAccounts.confirmMfa(req,body.code); if(!result.unauthorized&&!result.error)await store.flush(); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/mfa/disable') { const result=professionalAccounts.disableMfa(req,await parseJson(req)); if(!result.unauthorized&&!result.error)await store.flush(); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/sessions/revoke-others') { const result=professionalAccounts.revokeOtherSessions(req); if(!result.unauthorized)await store.flush(); return result.unauthorized?json(res,401,{ok:false,error:'Professional sign-in is required.'}):json(res,200,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/professional/session') { const auth=professionalAccounts.accountFromRequest(req); return auth?jsonWithCookie(res,200,{ok:true,account:auth.account},csrfCookieForRequest(req)):jsonWithCookie(res,401,{ok:false,error:'Professional sign-in is required.'},csrfCookieForRequest(req)); }
  if (req.method === 'GET' && pathName === '/api/professional/dashboard') { const dashboard=professionalAccounts.dashboard(req); return dashboard?json(res,200,{ok:true,...dashboard}):json(res,401,{ok:false,error:'Professional sign-in is required.'}); }
  if (req.method === 'GET' && pathName === '/api/professional/network') { const auth=professionalAccounts.accountFromRequest(req); return auth?json(res,200,{ok:true,network:professionalNetwork.professionalView(auth.rawAccount)}):json(res,401,{ok:false,error:'Professional sign-in is required.'}); }
  if (req.method === 'POST' && /^\/api\/professional\/portal-profiles\/(professional|firm)\/[^/]+\/[^/]+\/submit-review$/.test(pathName)) {
    const parts=pathName.split('/'); const targetKind=parts[4]; const targetId=decodeURIComponent(parts[5]||''); const portalId=decodeURIComponent(parts[6]||'');
    const result=professionalAccounts.submitPortalProfileForReview(req,targetKind,targetId,portalId,await parseJson(req));
    if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That record is not connected to this account.'}); if(result.conflict)return json(res,409,{ok:false,...result}); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && /^\/api\/professional\/portal-profiles\/(professional|firm)\/[^/]+\/[^/]+$/.test(pathName)) {
    const parts=pathName.split('/'); const targetKind=parts[4]; const targetId=decodeURIComponent(parts[5]||''); const portalId=decodeURIComponent(parts[6]||'');
    const result=professionalAccounts.updatePortalProfileForAccount(req,targetKind,targetId,portalId,await parseJson(req));
    if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That record is not connected to this account.'}); if(result.conflict)return json(res,409,{ok:false,...result}); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && pathName === '/api/professional/communication-preferences') { const result=professionalAccounts.updateCommunicationPreferences(req,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/claim-profile') { const auth=professionalAccounts.accountFromRequest(req); if(!auth) return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const body=await parseJson(req); const result=professionalAccounts.attachClaim(auth.account.id,String(body.professionalId||'')); return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,message:'Your claim request was saved. Smarter Justice must verify identity and credentials before the profile is marked claimed.'}); }
  if (req.method === 'POST' && pathName === '/api/professional/claim-firm') { const auth=professionalAccounts.accountFromRequest(req); if(!auth) return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const body=await parseJson(req); const result=professionalAccounts.attachFirmClaim(auth.account.id,String(body.firmId||'')); return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,message:'Your firm profile claim was saved. Smarter Justice must verify identity and authority before account control is granted.'}); }
  if (req.method === 'POST' && /^\/api\/professional\/profiles\/[^/]+\/submit-review$/.test(pathName)) { const id=decodeURIComponent(pathName.split('/').slice(-2,-1)[0]||''); const result=professionalAccounts.submitProfessionalProfileForReview(req,id); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That profile is not connected to this account.'}); return result.error?json(res,409,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/profiles') { const result=professionalAccounts.createProfessionalForAccount(req,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result}); }
  if (req.method === 'POST' && pathName.startsWith('/api/professional/profiles/')) { const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalAccounts.updateProfessionalForAccount(req,id,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That profile is not connected to this account.'}); if(result?.conflict)return json(res,409,{ok:false,...result}); return result?.error?json(res,400,{ok:false,error:result.error,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/professional\/firms\/[^/]+\/submit-review$/.test(pathName)) { const id=decodeURIComponent(pathName.split('/').slice(-2,-1)[0]||''); const result=professionalAccounts.submitFirmForReview(req,id); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That firm is not connected to this account.'}); return result.error?json(res,409,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/firms') { const result=professionalAccounts.createFirmForAccount(req,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/professional\/firms\/[^/]+\/professionals$/.test(pathName)) { const parts=pathName.split('/'); const id=decodeURIComponent(parts[4]||''); const result=professionalAccounts.addProfessionalToFirm(req,id,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That firm is not connected to this account.'}); return result?.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,message:'The professional profile was added to the central firm workspace. Verification and marketplace eligibility remain separate.'}); }
  if (req.method === 'POST' && pathName.startsWith('/api/professional/firms/')) { const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalAccounts.updateFirmForAccount(req,id,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That firm is not connected to this account.'}); if(result?.conflict)return json(res,409,{ok:false,...result}); return result?.error?json(res,400,{ok:false,error:result.error,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/professional/pilot-program') { const auth=professionalAccounts.accountFromRequest(req); return auth?json(res,200,{ok:true,...pilotProgram.professionalView(auth.account.id)}):json(res,401,{ok:false,error:'Professional sign-in is required.'}); }
  if (req.method === 'POST' && pathName === '/api/professional/pilot-program/application/save') { const auth=professionalAccounts.accountFromRequest(req); if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const body=await parseJson(req); const result=await pilotProgram.saveApplication(auth.account,body,String(req.headers['idempotency-key']||body.idempotencyKey||'')); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/pilot-program/application/submit') { const auth=professionalAccounts.accountFromRequest(req); if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const body=await parseJson(req); const result=await pilotProgram.submitApplication(auth.account,body,String(req.headers['idempotency-key']||body.idempotencyKey||'')); return result.error?json(res,409,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/pilot-program/application/withdraw') { const auth=professionalAccounts.accountFromRequest(req); if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const body=await parseJson(req); const result=await pilotProgram.withdrawApplication(auth.account,String(req.headers['idempotency-key']||body.idempotencyKey||'')); return result.error?json(res,409,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/pilot-program/support') { const auth=professionalAccounts.accountFromRequest(req); if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const body=await parseJson(req); const result=await pilotProgram.createSupportTicket(auth.account,body,String(req.headers['idempotency-key']||body.idempotencyKey||'')); return result.error?json(res,400,{ok:false,...result}):json(res,201,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/membership/checkout') { const result=await handleProfessionalMembershipCheckout(req,await parseJson(req)); return json(res,result.status,result.data); }
  if (req.method === 'GET' && pathName === '/api/professional/membership/confirm') { const result=await confirmProfessionalMembership(req,urlObj); return json(res,result.status,result.data); }

  if (req.method === 'GET' && pathName === '/api/professional-membership-offer') {
    const campaignCode = String(urlObj.searchParams.get('campaign') || '').trim();
    const offer = professionalMarketplace.getPublicCampaignOffer(campaignCode);
    if (!offer) return json(res, 404, { ok:false, error:'This professional membership campaign is not currently accepting interest.' });
    return json(res, 200, { ok:true, offer });
  }
  if (req.method === 'POST' && pathName === '/api/professional-membership-interest') {
    const body = await parseJson(req);
    const result = professionalMarketplace.createPublicMembershipInterest(body);
    if (result.error) return json(res, 400, { ok:false, error:result.error });
    return json(res, 201, { ok:true, confirmationId:result.confirmationId, message:'Your professional membership interest was recorded for private follow-up. No membership, profile publication, consultation eligibility, or payment was activated.' });
  }
  if (req.method === 'POST' && pathName === '/api/professional-launch-interest') {
    const body = await parseJson(req);
    const invitation = body.inviteToken ? launchOutreachOperations.resolveInvitation(body.inviteToken) : null;
    if (invitation?.error) return json(res,400,{ok:false,error:invitation.error});
    const result = launchCohortOperations.publicInterest(body, invitation ? { existingContactId:invitation.contactId } : {});
    if (result.error) return json(res, 400, { ok:false, error:result.error });
    if (body.inviteToken) launchOutreachOperations.redeemInvitation(body.inviteToken,result.confirmationId,'attorney-launch-interest');
    launchOutreachOperations.recordEvent({campaignCode:body.campaignCode||'',eventType:'attorney-interest-submitted',audience:'professional'},'attorney-launch-interest');
    notification('professional_launch_interest_received',{contactId:result.confirmationId,professionalName:body.name||body.professionalName||'',email:body.email||'',campaignCode:body.campaignCode||'',portalIds:body.portalIds||body.portals||[]});
    return json(res, 201, { ok:true, confirmationId:result.confirmationId, reusedExistingContact:Boolean(result.reusedExistingContact), message:'Your free-profile launch interest was recorded for private follow-up. No profile was published, no credential or specialty was approved, and no payment or paid-growth product was activated.' });
  }
  if (req.method === 'GET' && pathName === '/api/owner/launch-command-center') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...launchCommandCenter.ownerView()}); }
  if (req.method === 'GET' && pathName === '/api/owner/launch-activation') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...launchActivation.ownerView()}); }
  if (req.method === 'GET' && pathName === '/api/owner/service-readiness') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,serviceReadiness.ownerDiagnostics()); }
  if (req.method === 'GET' && pathName === '/api/owner/launch-activation/export') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,markdown:launchActivation.exportMarkdown()}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-activation/plan') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req); const result=launchActivation.updatePlan(body,'owner-control-center'); return json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-activation/evidence') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req); const result=launchActivation.recordEvidence(body,'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'GET' && pathName === '/api/owner/launch-day-operations') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...launchDayOperations.ownerView()}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-day-operations/shifts') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req); const result=launchDayOperations.createShift(body,'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-day-operations/journeys') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req); const result=launchDayOperations.recordJourney(body,'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-day-operations/support') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req); const result=launchDayOperations.recordSupport(body,'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'GET' && pathName === '/api/owner/launch-day-operations/export') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,markdown:launchDayOperations.exportMarkdown()}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-activation/rehearsals') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req); const result=launchActivation.recordRehearsal(body,'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-activation/issues') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req); const result=launchActivation.recordIssue(body,'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'GET' && pathName === '/api/owner/launch-outreach') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...launchOutreachOperations.ownerView()}); }
  if (req.method === 'GET' && pathName === '/api/owner/launch-outreach/export.csv') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const csv=launchOutreachOperations.exportCsv(); return sendResponse(res,200,securityHeaders({'Content-Type':'text/csv; charset=utf-8','Content-Length':Buffer.byteLength(csv),'Cache-Control':'no-store','Content-Disposition':'attachment; filename="smarter-justice-launch-funnel.csv"'}),csv); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-outreach/campaigns') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=launchOutreachOperations.upsertCampaign(await parseJson(req),'owner-control-center'); return json(res,result.error?400:200,{ok:!result.error,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/launch-outreach\/contacts\/[^/]+\/invitation$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const parts=pathName.split('/'); const contactId=decodeURIComponent(parts[parts.length-2]||''); const result=launchOutreachOperations.issueInvitation(contactId,await parseJson(req),'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/launch-outreach\/invitations\/[^/]+\/revoke$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const parts=pathName.split('/'); const id=decodeURIComponent(parts[parts.length-2]||''); const result=launchOutreachOperations.revokeInvitation(id,await parseJson(req),'owner-control-center'); return json(res,result.error?400:200,{ok:!result.error,...result}); }
  if (req.method === 'GET' && pathName === '/api/owner/launch-cohort') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...launchCohortOperations.ownerView()}); }
  if (req.method === 'GET' && pathName === '/api/owner/launch-cohort/export') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,markdown:launchCohortOperations.exportMarkdown()}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-cohort/plan') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=launchCohortOperations.updateCohort(await parseJson(req),'owner-control-center'); return json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-cohort/contacts') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=launchCohortOperations.createContact(await parseJson(req),'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/launch-cohort\/contacts\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/').pop()||''); const result=launchCohortOperations.updateContact(id,await parseJson(req),'owner-control-center'); return result?json(res,200,{ok:true,...result}):json(res,404,{ok:false,error:'Launch cohort contact was not found.'}); }
  if (req.method === 'POST' && pathName === '/api/owner/launch-cohort/profile-batches/preview') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=launchCohortOperations.previewBatch(await parseJson(req),'owner-control-center'); return json(res,result.error?400:201,{ok:!result.error,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/launch-cohort\/profile-batches\/[^/]+\/commit$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const parts=pathName.split('/'); const id=decodeURIComponent(parts[parts.length-2]||''); const result=launchCohortOperations.commitBatch(id,'owner-control-center'); return json(res,result.error?409:200,{ok:!result.error,...result}); }
  if (req.method === 'GET' && pathName === '/api/owner/operational-readiness') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...operationalReadiness.machineChecks(),pilotPaymentGate:pilotProgram.paymentGate()}); }
  if (req.method === 'GET' && pathName === '/api/owner/ai-status') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,enabled:/^(true|1|yes)$/i.test(String(process.env.AI_REVIEW_ENABLED || '')),providerOrder:String(process.env.AI_PROVIDER_ORDER || 'openai,anthropic,google,xai').split(',').map(value=>value.trim()).filter(Boolean),providers:aiProviders.configuredProviders(),defaultPublicMode:'rules-only',explicitUserChoiceRequired:true});
  }
  if (req.method === 'POST' && pathName === '/api/owner/operational-readiness/database-check') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await operationalReadiness.databaseCheck(); await paidPilotOperations.recordEnvironmentSnapshot({label:'Owner-requested database and migration check',source:'owner-operational-readiness',checks:[{key:'database',label:'PostgreSQL connection and migration status',ready:Boolean(result.ok),status:result.ok?'ready':'blocked',detail:result.error||`Latency ${result.latencyMs||0} ms`} ]}); return json(res,result.ok?200:503,{ok:Boolean(result.ok),...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/operational-readiness/database-reconnect') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const storage=await store.reconnect(); const check=await operationalReadiness.databaseCheck(); return json(res,check.ok?200:503,{ok:Boolean(check.ok),storage,check}); }
  if (req.method === 'GET' && pathName === '/api/owner/revenue-access-model') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...revenueAccessModel.ownerView()}); }
  if (req.method === 'GET' && pathName === '/api/owner/revenue-access-model/export') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,markdown:revenueAccessModel.exportMarkdown()}); }
  if (req.method === 'GET' && pathName === '/api/owner/public-paid-services') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const owner=publicPaidServices.ownerView(); return json(res,200,{ok:true,...owner,catalogReadiness:owner.catalog.map(service=>({serviceId:service.id,...publicPaidServices.availability(service.id,publicPaidServiceEnvironment(humanReviewServiceFor(service.id)||{}))}))}); }
  if (req.method === 'GET' && pathName === '/api/owner/public-paid-services/export') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,markdown:publicPaidServices.exportMarkdown()}); }
  if (req.method === 'POST' && pathName === '/api/owner/public-paid-services/controls') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await publicPaidServices.updateControls(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/public-paid-services\/orders\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await publicPaidServices.updateOrder(id,await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/revenue-access-model\/public-plans\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await revenueAccessModel.updatePublicPlan(id,await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/revenue-access-model\/human-review\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await revenueAccessModel.updateHumanReviewService(id,await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/revenue-access-model\/portals\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const slug=decodeURIComponent(pathName.split('/').pop()||''); const result=await revenueAccessModel.updatePortalAdoption(slug,await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/owner/field-launch-program') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...fieldLaunchProgram.ownerView()}); }
  if (req.method === 'GET' && pathName === '/api/owner/field-launch-program/export') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,markdown:fieldLaunchProgram.exportMarkdown()}); }
  if (req.method === 'POST' && pathName === '/api/owner/field-launch-program/controls') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await fieldLaunchProgram.updateControls(await parseJson(req)); return result.error?json(res,409,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/field-launch-program/locations') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await fieldLaunchProgram.upsertLocation(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/field-launch-program/campaigns') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await fieldLaunchProgram.upsertCampaign(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/field-launch-program/assets') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await fieldLaunchProgram.upsertAsset(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/field-launch-program/staff') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await fieldLaunchProgram.upsertStaff(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/field-launch-program/events') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await fieldLaunchProgram.recordEvent(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,201,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/field-launch-program/daily-reports') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await fieldLaunchProgram.recordDailyReport(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,201,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/professional/growth-access') {
    const auth=professionalAccounts.accountFromRequest(req); if(!auth)return json(res,401,{ok:false,error:'Professional sign-in is required.'});
    const dashboard=professionalAccounts.dashboard(req); const professionals=(dashboard?.professionals||[]).map(row=>({professionalId:row.id,displayName:row.displayName,access:professionalPromotionProgram.evaluateProfessional(row,{paidMembership:row.membership?.status==='active',marketplaceEligible:professionalMarketplace.evaluateProfessionalEligibility(row).consultationEligible})}));
    return json(res,200,{ok:true,policy:professionalPromotionProgram.publicPolicy(),professionals});
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-growth') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...professionalPromotionProgram.ownerView()}); }
  if (req.method === 'POST' && pathName === '/api/owner/professional-growth/controls') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await professionalPromotionProgram.updateControls(await parseJson(req),'owner'); return result.error?json(res,409,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/professional-growth\/professionals\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await professionalPromotionProgram.upsertPromotion(id,await parseJson(req),'owner'); return result.error?json(res,409,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/owner/paid-pilot-operations') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...paidPilotOperations.ownerView(),portalIntegrationStandardVersion:PORTAL_INTEGRATION_STANDARD_VERSION,originStoryStandardVersion:ORIGIN_STORY_STANDARD_VERSION,approvedOriginSentence:APPROVED_ORIGIN_SENTENCE,portalIntegrationContracts:PORTAL_INTEGRATION_CONTRACTS}); }
  if (req.method === 'GET' && pathName === '/api/owner/paid-pilot-operations/export') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,markdown:paidPilotOperations.exportMarkdown()}); }
  if (req.method === 'POST' && pathName === '/api/owner/paid-pilot-operations/readiness-snapshot') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const readiness=launchReadinessChecklist(); const result=await paidPilotOperations.recordEnvironmentSnapshot({label:'Owner-recorded paid-pilot readiness snapshot',source:'owner-control-center',checks:readiness.items.map(item=>({key:item.key,label:item.message,ready:item.ok,status:item.ok?'ready':'incomplete',detail:item.required?'Required':'Optional'}))}); return json(res,201,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/paid-pilot-operations\/billing-issues\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await paidPilotOperations.updateBillingIssue(id,await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/paid-pilot-operations/incidents') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await paidPilotOperations.createIncident(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,201,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/paid-pilot-operations\/incidents\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await paidPilotOperations.updateIncident(id,await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/paid-pilot-operations/approvals') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await paidPilotOperations.recordOwnerApproval(await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,201,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/professional/portal-integration-contracts') { const auth=professionalAccounts.accountFromRequest(req); return auth?json(res,200,{ok:true,standardVersion:PORTAL_INTEGRATION_STANDARD_VERSION,originStoryStandardVersion:ORIGIN_STORY_STANDARD_VERSION,approvedOriginSentence:APPROVED_ORIGIN_SENTENCE,contracts:PORTAL_INTEGRATION_CONTRACTS}):json(res,401,{ok:false,error:'Professional sign-in is required.'}); }
  if (req.method === 'GET' && pathName === '/api/owner/pilot-program') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,...pilotProgram.ownerView()}); }
  if (req.method === 'GET' && pathName === '/api/owner/pilot-program/export') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); return json(res,200,{ok:true,markdown:pilotProgram.exportMarkdown()}); }
  if (req.method === 'POST' && pathName === '/api/owner/pilot-program/controls') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=await pilotProgram.updateControls(await parseJson(req)); return result.error?json(res,409,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/pilot-program/evidence/')) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const key=decodeURIComponent(pathName.split('/').pop()||''); const result=await pilotProgram.updateEvidence(key,await parseJson(req)); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/pilot-program\/applications\/[^/]+\/review$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/')[5]||''); const body=await parseJson(req); const result=await pilotProgram.ownerReviewApplication(id,body,String(req.headers['idempotency-key']||body.idempotencyKey||'')); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/owner\/pilot-program\/support\/[^/]+$/.test(pathName)) { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const id=decodeURIComponent(pathName.split('/').pop()||''); const body=await parseJson(req); const result=await pilotProgram.ownerUpdateSupportTicket(id,body,String(req.headers['idempotency-key']||body.idempotencyKey||'')); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/owner/domain-registry') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,...domainRegistry.getOwnerData()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/domain-registry/export') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,markdown:domainRegistry.markdown()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/domain-registry') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const result=domainRegistry.upsert(await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,summary:domainRegistry.getOwnerData().summary});
  }

  if (req.method === 'GET' && pathName === '/api/owner/build-program') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,...buildProgram.getData()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/build-program/export') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,markdown:buildProgram.exportMarkdown(),data:buildProgram.getData()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/build-program/items') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const result=buildProgram.upsertItem(await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,summary:buildProgram.getData().summary});
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/build-program/records/')) {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const kind=decodeURIComponent(pathName.split('/').pop()||'');
    const result=buildProgram.addRecord(kind,await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,summary:buildProgram.getData().summary});
  }
  if (req.method === 'GET' && pathName === '/api/owner/legal-portfolio-operating-system') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, operatingSystem:legalPortfolioOperatingSystem.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/legal-portfolio-operating-system/export') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, bundle:legalPortfolioOperatingSystem.exportBundle(), markdown:legalPortfolioOperatingSystem.markdown() });
  }
  if (req.method === 'POST' && pathName === '/api/owner/legal-portfolio-operating-system/decisions') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=await legalPortfolioOperatingSystem.recordDecision(await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,summary:legalPortfolioOperatingSystem.summary()});
  }
  if (req.method === 'POST' && /^\/api\/owner\/legal-portfolio-operating-system\/gates\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||'');
    const result=await legalPortfolioOperatingSystem.updateGate(id,await parseJson(req),'owner');
    return result.error?json(res,409,{ok:false,error:result.error}):json(res,200,{ok:true,...result,summary:legalPortfolioOperatingSystem.summary()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/legal-portfolio-operating-system/artifacts') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=await legalPortfolioOperatingSystem.registerArtifact(await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,summary:legalPortfolioOperatingSystem.summary()});
  }
  if (req.method === 'POST' && /^\/api\/owner\/legal-portfolio-operating-system\/dependencies\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||'');
    const result=await legalPortfolioOperatingSystem.updateDependency(id,await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,summary:legalPortfolioOperatingSystem.summary()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/legal-portfolio-operating-system/support-cases') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=await legalPortfolioOperatingSystem.recordSupportCase(await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,summary:legalPortfolioOperatingSystem.summary()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/legal-portfolio-operating-system/incidents') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=await legalPortfolioOperatingSystem.recordIncident(await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,summary:legalPortfolioOperatingSystem.summary()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/legal-portfolio-operating-system/integration-receipts') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=await legalPortfolioOperatingSystem.recordIntegrationReceipt(await parseJson(req),'owner');
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,summary:legalPortfolioOperatingSystem.summary()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/control-center') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, version:VERSION, aiOperations:centralAiGateway.ownerView(), openAiLaunchGovernance:openAiLaunchGovernance.ownerView(), currentReleaseTruth:currentReleaseTruth.ownerView(), detachedFinalIdentity:detachedFinalIdentity.ownerView(), ownerLaunchActionPacket:ownerLaunchActionPacket.ownerView(), coordinatedPromptPack:coordinatedPromptPack.ownerView(), professionalIdentityEvidenceRegistry:professionalIdentityEvidenceRegistry.ownerView(), deploymentReadiness:deploymentReadiness.ownerView(), launchDayOrchestration:launchDayOrchestration.ownerView(), portfolioLaunchReadiness:portfolioLaunchReadiness.ownerView(), providerPreflight:providerPreflight.ownerView(), providerDiscoveryPlan:providerDiscoveryPlan.ownerView(), providerDiscoveryAuthorization:providerDiscoveryAuthorization.ownerView(), providerDiscoveryAuthorizationLifecycle:providerDiscoveryAuthorizationLifecycle.ownerView(), strategicWorkflowGovernance:strategicWorkflowGovernance.ownerView(), journeyHandoffPlanner:journeyHandoffPlanner.ownerView(), continuousImprovement:continuousImprovement.ownerView(), releaseEvidenceCoverage:releaseEvidenceCoverage.ownerView(), unifiedLiveOperations:unifiedLiveOperations.ownerView(), v14ReleaseGovernance:v14ReleaseGovernance.ownerView(), v14LiveEvidenceConnector:v14LiveEvidenceConnector.ownerView(), v14ReleaseReceiptAutomation:v14ReleaseReceiptAutomation.validate(), v14EvidenceBatchWorkspace:v14EvidenceBatchWorkspace.ownerView(), v14DetachedDeliveryReceipt:v14DetachedDeliveryReceipt.ownerView(), v14EvidenceReadinessPlanner:v14EvidenceReadinessPlanner.ownerView(), v14EvidenceCollectionPacket:v14EvidenceCollectionPacket.ownerView(), v14SegmentedAcceptance:v14SegmentedAcceptanceRunner.ownerView(v14AcceptanceManifest), v14AcceptanceEvidenceBundle:v14AcceptanceEvidenceBundle.ownerView(), innovationLab:INNOVATION_LAB_V1725, trustVerificationResearch:TRUST_VERIFICATION_RESEARCH_V1725, attorneyOutreachReadiness:attorneyPartnerTour.ownerView(), systemLaunchReadiness:launchReadinessChecklist(), marketplaceFeatureStatus:professionalMarketplace.publicFeatureStatus(), paidPilotOperations:paidPilotOperations.ownerView(), operationalReadiness:operationalReadiness.machineChecks(), migrationManifest:migrations.manifest(), revenueAccessModel:revenueAccessModel.ownerView(), fieldLaunchProgram:fieldLaunchProgram.ownerView(), professionalGrowth:professionalPromotionProgram.ownerView(), legalPortfolioOperatingSystem:legalPortfolioOperatingSystem.ownerView(), portalIntegrationStandardVersion:PORTAL_INTEGRATION_STANDARD_VERSION, originStoryStandardVersion:ORIGIN_STORY_STANDARD_VERSION, approvedOriginSentence:APPROVED_ORIGIN_SENTENCE, portalIntegrationContracts:PORTAL_INTEGRATION_CONTRACTS, ...controlCenter.getControlCenterData() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/innovation-lab') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, innovationLab:INNOVATION_LAB_V1725, trustVerificationResearch:TRUST_VERIFICATION_RESEARCH_V1725 });
  }
  if (req.method === 'GET' && pathName === '/api/owner/trust-verification-research') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, trustVerificationResearch:TRUST_VERIFICATION_RESEARCH_V1725 });
  }
  if (req.method === 'GET' && pathName === '/api/owner/coordinated-prompt-pack') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, coordinatedPromptPack:coordinatedPromptPack.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/deployment-readiness') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,deploymentReadiness:deploymentReadiness.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/launch-day-orchestration') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,launchDayOrchestration:launchDayOrchestration.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/portfolio-launch-readiness') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,portfolioLaunchReadiness:portfolioLaunchReadiness.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/provider-preflight') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,providerPreflight:providerPreflight.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/provider-discovery-plan') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,providerDiscoveryPlan:providerDiscoveryPlan.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/provider-discovery-authorization') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,providerDiscoveryAuthorization:providerDiscoveryAuthorization.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/provider-discovery-authorization-lifecycle') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,providerDiscoveryAuthorizationLifecycle:providerDiscoveryAuthorizationLifecycle.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/strategic-workflow-governance') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,strategicWorkflowGovernance:strategicWorkflowGovernance.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/journey-handoff-planner') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,journeyHandoffPlanner:journeyHandoffPlanner.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/continuous-improvement') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,continuousImprovement:continuousImprovement.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/release-evidence-coverage') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,releaseEvidenceCoverage:releaseEvidenceCoverage.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/live-evidence') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,liveEvidence:v14LiveEvidenceConnector.ownerView()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/live-evidence/preview') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    const receipt=await parseJson(req);
    const preview=v14LiveEvidenceConnector.previewPromotion(receipt);
    return json(res,preview.validation.ok?200:400,{ok:preview.validation.ok,appVersion:VERSION,preview});
  }
  if (req.method === 'GET' && pathName === '/api/owner/live-evidence/workspace') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,workspace:v14EvidenceBatchWorkspace.ownerView()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/live-evidence/batch-preview') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    const batch=await parseJson(req);
    const preview=v14EvidenceBatchWorkspace.previewTransaction(batch);
    return json(res,preview.validation.ok?200:400,{ok:preview.validation.ok,appVersion:VERSION,preview});
  }
  if ((req.method === 'GET' || req.method === 'POST') && pathName === '/api/owner/live-evidence/readiness-plan') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    if(req.method==='GET')return json(res,200,{ok:true,appVersion:VERSION,readinessPlanner:v14EvidenceReadinessPlanner.ownerView()});
    const batch=await parseJson(req);const plan=v14EvidenceReadinessPlanner.plan(batch);
    return json(res,plan.validation.ok?200:400,{ok:plan.validation.ok,appVersion:VERSION,plan});
  }
  if ((req.method === 'GET' || req.method === 'POST') && pathName === '/api/owner/live-evidence/collection-packet') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    if(req.method==='GET')return json(res,200,{ok:true,appVersion:VERSION,evidenceCollectionPacket:v14EvidenceCollectionPacket.ownerView()});
    const batch=await parseJson(req);const packet=v14EvidenceCollectionPacket.create(batch);
    return json(res,packet.ok?200:400,{ok:packet.ok,appVersion:VERSION,result:packet});
  }
  if (req.method === 'GET' && pathName === '/api/owner/segmented-acceptance') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,segmentedAcceptance:v14SegmentedAcceptanceRunner.ownerView(v14AcceptanceManifest)});
  }
  if (req.method === 'GET' && pathName === '/api/owner/acceptance-evidence-bundle') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,acceptanceEvidenceBundle:v14AcceptanceEvidenceBundle.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/detached-delivery-receipt') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,detachedDeliveryReceipt:v14DetachedDeliveryReceipt.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/unified-live-operations') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,unifiedLiveOperations:unifiedLiveOperations.ownerView(),v14ReleaseGovernance:v14ReleaseGovernance.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/ai-operations') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,aiOperations:centralAiGateway.ownerView(),openAiLaunchGovernance:openAiLaunchGovernance.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-identity-evidence-registry') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, professionalIdentityEvidenceRegistry:professionalIdentityEvidenceRegistry.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/reusable-build-governance') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, reusableBuildGovernance:reusableBuildGovernance.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/owner-action-readiness') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, ownerActionReadiness:ownerActionReadiness.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/launch-action-packet') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, ownerLaunchActionPacket:ownerLaunchActionPacket.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/initial-portal-authority') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, initialPortalAuthority:initialPortalAuthority.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/portal-authority-discovery') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, portalAuthorityDiscovery:portalAuthorityDiscovery.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/commercial-terms') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, commercialTerms:commercialTerms.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/public-freemium-floor') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, publicFreemium:publicFreemium.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/current-release-truth') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, currentReleaseTruth:currentReleaseTruth.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/final-artifact-identity') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, detachedFinalIdentity:detachedFinalIdentity.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/eighth-pass-governance') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, eighthPassGovernance:eighthPassGovernance.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/fifth-pass-governance') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, fifthPassGovernance:fifthPassGovernance.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/portfolio-truth') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, portfolioTruth:portfolioTruth.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-lifecycle-governance') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, governance:professionalLifecycleGovernance.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/dashboard-conformance') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const view=portfolioTruth.ownerView();
    return json(res, 200, { ok:true, appVersion:VERSION, dashboardContracts:view.dashboardContracts, dashboardConformance:view.dashboardConformance });
  }
  if (req.method === 'GET' && pathName === '/api/owner/legal-network-action-center') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, actionCenter:legalNetworkActionCenter.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/legal-network-action-center/export') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, bundle:legalNetworkActionCenter.exportBundle(), markdown:legalNetworkActionCenter.markdown() });
  }
  if (req.method === 'POST' && /^\/api\/owner\/legal-network-action-center\/actions\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||'');
    const result=await legalNetworkActionCenter.updateDisposition(id,await parseJson(req));
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,actionCenter:legalNetworkActionCenter.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/cross-portal-registry-controls') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const data=controlCenter.getControlCenterData();
    return json(res, 200, { ok:true, appVersion:VERSION, controls:data.crossPortalRegistryControls });
  }
  if (req.method === 'POST' && pathName === '/api/owner/cross-portal-registry-controls/validate-import') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=crossPortalRegistryControls.validateImport(await parseJson(req));
    return result.accepted?json(res,200,{ok:true,...result}):json(res,400,{ok:false,error:'Registry import validation failed.',...result});
  }
  if (req.method === 'GET' && pathName === '/api/owner/cross-portal-learning') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const data=controlCenter.getControlCenterData();
    return json(res, 200, { ok:true, appVersion:VERSION, registryVersion:data.capabilityRegistry.version, learning:data.crossPortalLearning });
  }
  if (req.method === 'GET' && pathName === '/api/owner/cross-portal-learning/export') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const data=controlCenter.getControlCenterData();
    return json(res, 200, { ok:true, appVersion:VERSION, exportVersion:'1.0.0', registry:data.capabilityRegistry, learning:data.crossPortalLearning, authority:'Dedicated portal artifacts remain authoritative. This export contains non-confidential product and release metadata only.' });
  }
  if (req.method === 'GET' && pathName === '/api/owner/legal-portal-command-center') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, commandCenter:controlCenter.getControlCenterData().legalPortalCommandCenter });
  }
  if (req.method === 'GET' && pathName === '/api/owner/portal-presence-management') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,appVersion:VERSION,...portalPresenceManagement.ownerView()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/portal-presence-management/review') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req);
    const result=portalPresenceManagement.ownerReviewPortalProfile(body.targetKind,body.targetId,body.portalId,body,'owner-control-center');
    if(result.conflict)return json(res,409,{ok:false,...result}); return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && pathName === '/api/owner/portal-presence-management/acceptance') {
    if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const body=await parseJson(req);
    const result=portalPresenceManagement.upsertAcceptance(body.targetKind,body.targetId,body.portalId,body,'owner-control-center');
    return result.error?json(res,400,{ok:false,...result}):json(res,200,{ok:true,...result});
  }
  if (req.method === 'GET' && pathName === '/api/owner/legal-portal-workspace') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, workspace:legalPortalWorkspace.ownerView() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/legal-portal-workspace/export') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, bundle:legalPortalWorkspace.exportBundle(), markdown:legalPortalWorkspace.markdown() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/neutral-boardroom-handoff') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const handoff=controlCenter.getControlCenterData().neutralBoardroomHandoff;
    return json(res, 200, { ok:true, appVersion:VERSION, handoff, authority:'Non-confidential export only. Dedicated legal-portal exact artifacts remain authoritative. No live connection or automatic write is active.' });
  }
  if (req.method === 'POST' && /^\/api\/owner\/legal-portal-workspace\/portals\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||'');
    const result=await legalPortalWorkspace.updatePortal(id,await parseJson(req));
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,summary:legalPortalWorkspace.ownerView().summary});
  }
  if (req.method === 'GET' && pathName === '/api/owner/control-center/export') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, exportVersion:'1.4.0', appVersion:VERSION, innovationLab:INNOVATION_LAB_V1725, trustVerificationResearch:TRUST_VERIFICATION_RESEARCH_V1725, attorneyOutreachReadiness:attorneyPartnerTour.ownerView(), systemLaunchReadiness:launchReadinessChecklist(), marketplaceFeatureStatus:professionalMarketplace.publicFeatureStatus(), paidPilotOperations:paidPilotOperations.ownerView(), operationalReadiness:operationalReadiness.machineChecks(), migrationManifest:migrations.manifest(), revenueAccessModel:revenueAccessModel.ownerView(), fieldLaunchProgram:fieldLaunchProgram.ownerView(), professionalGrowth:professionalPromotionProgram.ownerView(), legalPortfolioOperatingSystem:legalPortfolioOperatingSystem.ownerView(), portalIntegrationStandardVersion:PORTAL_INTEGRATION_STANDARD_VERSION, originStoryStandardVersion:ORIGIN_STORY_STANDARD_VERSION, approvedOriginSentence:APPROVED_ORIGIN_SENTENCE, portalIntegrationContracts:PORTAL_INTEGRATION_CONTRACTS, ...controlCenter.getControlCenterData() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/control-center/prompts/master') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, kind:'master-coordination', prompt:controlCenter.masterCoordinationPrompt() });
  }
  if (req.method === 'GET' && pathName.startsWith('/api/owner/control-center/prompts/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const slug = decodeURIComponent(pathName.split('/').pop() || '');
    const prompt = controlCenter.promptForPortal(slug);
    return prompt ? json(res, 200, { ok:true, slug, prompt }) : json(res, 404, { ok:false, error:'Portal not found.' });
  }
  if (req.method === 'GET' && pathName.startsWith('/api/owner/control-center/manifests/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const slug = decodeURIComponent(pathName.split('/').pop() || '');
    const manifest = controlCenter.manifestForPortal(slug);
    return manifest ? json(res, 200, { ok:true, slug, manifest }) : json(res, 404, { ok:false, error:'Portal not found.' });
  }
  if (req.method === 'POST' && pathName === '/api/owner/control-center/portals') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const body = await parseJson(req);
    const result = controlCenter.createPortal(body, 'owner');
    return result.error ? json(res, 400, { ok:false, error:result.error }) : json(res, 201, { ok:true, portal:result.portal, warnings:result.warnings, summary:controlCenter.getControlCenterData().summary });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/control-center/portals/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const slug = decodeURIComponent(pathName.split('/').pop() || '');
    const body = await parseJson(req);
    const result = controlCenter.updatePortal(slug, body, 'owner');
    return result ? json(res, 200, { ok:true, portal:result.portal, warnings:result.warnings, summary:controlCenter.getControlCenterData().summary }) : json(res, 404, { ok:false, error:'Portal not found.' });
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-network') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,network:professionalNetwork.ownerView()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-network/export') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,bundle:professionalNetwork.exportBundle()});
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-network/adapter-lab') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,adapterLab:professionalPortalAdapterLab.ownerView()});
  }
  if (req.method === 'GET' && pathName.startsWith('/api/owner/professional-network/adapter-fixtures/')) {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const portalId=decodeURIComponent(pathName.split('/').pop()||'');
    const fixture=professionalPortalAdapterLab.fixtureForPortal(portalId);
    return fixture?json(res,200,{ok:true,fixture}):json(res,404,{ok:false,error:'Professional portal adapter fixture not found.'});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-network/synchronize') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const result=await professionalNetwork.synchronize('owner-control-center');
    return json(res,200,{ok:true,...result,message:'Professional network records were reconciled from the current Smarter Justice marketplace. No legal portal was changed.'});
  }
  if (req.method === 'GET' && pathName.startsWith('/api/owner/professional-network/portal-handoffs/')) {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const portalId=decodeURIComponent(pathName.split('/').pop()||''); const handoff=professionalNetwork.portalHandoff(portalId);
    return handoff?json(res,200,{ok:true,handoff}):json(res,404,{ok:false,error:'Professional-network portal contract not found.'});
  }
  if (req.method === 'POST' && /^\/api\/owner\/professional-network\/offices\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await professionalNetwork.updateOffice(id,await parseJson(req)); return json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && /^\/api\/owner\/professional-network\/seats\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await professionalNetwork.updateSeat(id,await parseJson(req)); return json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && /^\/api\/owner\/professional-network\/practice-assignments\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await professionalNetwork.updatePracticeAssignment(id,await parseJson(req)); return json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && /^\/api\/owner\/professional-network\/portal-assignments\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=await professionalNetwork.updatePortalAssignment(id,await parseJson(req)); return json(res,200,{ok:true,...result});
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-accounts') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,...professionalAccounts.ownerSummary()});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-accounts/manual-profile') { if(!requireOwner(req))return json(res,403,{ok:false,error:'Private owner access is required.'}); const result=professionalAccounts.ownerCreateProfileForAccount(await parseJson(req)); return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,message:'The private profile workspace was created and linked to the professional account. Publication, verification, portal distribution, and payment remain separate.'}); }
  if (req.method === 'POST' && pathName === '/api/owner/professional-accounts/approve-profile-claim') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const body=await parseJson(req);
    const result=professionalAccounts.ownerApproveClaim(String(body.accountId||''),String(body.professionalId||''),String(body.profileRequestId||''));
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,message:'Account control was approved. Credential verification, membership, service activation, and consultation eligibility remain separate gates.'});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-accounts/approve-firm-claim') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const body=await parseJson(req);
    const result=professionalAccounts.ownerApproveFirmClaim(String(body.accountId||''),String(body.firmId||''),String(body.profileRequestId||''));
    return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,message:'Firm account control was approved. Membership, individual credentials, services, and consultation eligibility remain separate.'});
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-marketplace') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, ...professionalMarketplace.getOwnerData(), professionalAccounts:professionalAccounts.ownerSummary() });
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/pilot-controls') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const result=professionalMarketplace.updatePilotControls(await parseJson(req)); return json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/credential-verification') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const body=await parseJson(req); const result=professionalMarketplace.recordCredentialVerification(String(body.professionalId||''),body); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/complaints') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const result=professionalMarketplace.createComplaint(await parseJson(req)); return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result});
  }
  if (req.method === 'POST' && /^\/api\/owner\/professional-marketplace\/complaints\/[^/]+$/.test(pathName)) {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalMarketplace.resolveComplaint(id,await parseJson(req)); return result?json(res,200,{ok:true,...result}):json(res,404,{ok:false,error:'Complaint record not found.'});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/suspension') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    const body=await parseJson(req); const result=professionalMarketplace.setProfessionalSuspension(String(body.professionalId||''),body); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result});
  }

  if (req.method === 'GET' && pathName === '/api/owner/professional-marketplace/export') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, appVersion:VERSION, ...professionalMarketplace.exportData() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/professional-marketplace/public-sources') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, ...professionalSources.publicSources() });
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/public-sources/nys-attorneys/preview') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const body=await parseJson(req);
    const result=await professionalSources.previewNysAttorneys(body);
    store.addAudit({actor:'owner-control-center',action:'official_nys_attorney_source_previewed',details:{count:result.count,filters:Object.keys(body||{}).filter(k=>body[k])}});
    return json(res,200,{ok:true,...result});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/public-sources/nys-attorneys/import') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const body=await parseJson(req);
    let fetched;
    if(process.env.NODE_ENV==='test' && Array.isArray(body.testRows)) fetched={source:professionalSources.PUBLIC_PROFESSIONAL_DATA_SOURCES['nys-attorney-registrations'],queryUrl:'test-fixture',rows:body.testRows.map(professionalSources.normalizeNysAttorneyRow),count:body.testRows.length};
    else fetched=await professionalSources.fetchNysAttorneysByRegistration(body.registrationNumbers||[]);
    const imported=professionalMarketplace.importSeededProfessionals(fetched.rows,{portalEligibility:body.portalEligibility,practiceAreas:body.practiceAreas},'official-nys-attorney-import');
    return json(res,200,{ok:true,source:fetched.source,queryUrl:fetched.queryUrl,fetched:fetched.count,...imported,summary:professionalMarketplace.getOwnerData().summary});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/firm-quote') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const body = await parseJson(req);
    const quote = professionalMarketplace.calculateFirmMembershipQuote(body.planId || 'nyc-founding-firm', body.seatCount || 1);
    return quote.error ? json(res, 400, { ok:false, error:quote.error }) : json(res, 200, { ok:true, quote });
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/outreach-campaigns') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result = professionalMarketplace.createOutreachCampaign(await parseJson(req), 'owner');
    return result.error ? json(res, 400, { ok:false, error:result.error }) : json(res, 201, { ok:true, ...result, summary:professionalMarketplace.getOwnerData().summary });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/professional-marketplace/outreach-campaigns/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id = decodeURIComponent(pathName.split('/').pop() || '');
    const result = professionalMarketplace.updateOutreachCampaign(id, await parseJson(req), 'owner');
    return result ? json(res, 200, { ok:true, ...result, summary:professionalMarketplace.getOwnerData().summary }) : json(res, 404, { ok:false, error:'Outreach campaign not found.' });
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/outreach-prospects') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result = professionalMarketplace.createOutreachProspect(await parseJson(req), 'owner');
    return result.error ? json(res, 400, { ok:false, error:result.error }) : json(res, 201, { ok:true, ...result, summary:professionalMarketplace.getOwnerData().summary });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/professional-marketplace/outreach-prospects/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id = decodeURIComponent(pathName.split('/').pop() || '');
    const result = professionalMarketplace.updateOutreachProspect(id, await parseJson(req), 'owner');
    return result ? json(res, 200, { ok:true, ...result, summary:professionalMarketplace.getOwnerData().summary }) : json(res, 404, { ok:false, error:'Outreach prospect not found.' });
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/firms') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=professionalMarketplace.createFirm(await parseJson(req),'owner');
    return result.error ? json(res,400,{ok:false,error:result.error}) : json(res,201,{ok:true,...result,summary:professionalMarketplace.getOwnerData().summary});
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/professional-marketplace/firms/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalMarketplace.updateFirm(id,await parseJson(req),'owner');
    return result ? (result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,summary:professionalMarketplace.getOwnerData().summary})) : json(res,404,{ok:false,error:'Firm not found.'});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/professionals/seed') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const body=await parseJson(req); const result=professionalMarketplace.createProfessional({...body,seededFromPublicInfo:true},'owner');
    return result.error ? json(res,400,{ok:false,error:result.error}) : json(res,201,{ok:true,...result,summary:professionalMarketplace.getOwnerData().summary});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/professionals') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=professionalMarketplace.createProfessional(await parseJson(req),'owner');
    return result.error ? json(res,400,{ok:false,error:result.error}) : json(res,201,{ok:true,...result,summary:professionalMarketplace.getOwnerData().summary});
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/professional-marketplace/professionals/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalMarketplace.updateProfessional(id,await parseJson(req),'owner');
    return result ? (result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result,summary:professionalMarketplace.getOwnerData().summary})) : json(res,404,{ok:false,error:'Professional not found.'});
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/professional-marketplace/membership-plans/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalMarketplace.updateMembershipPlan(id,await parseJson(req));
    return result ? json(res,200,{ok:true,...result}) : json(res,404,{ok:false,error:'Membership plan not found.'});
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/professional-marketplace/revenue-programs/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalMarketplace.updateRevenueProgram(id,await parseJson(req));
    return result ? json(res,200,{ok:true,...result}) : json(res,404,{ok:false,error:'Revenue program not found.'});
  }
  if (req.method === 'POST' && pathName === '/api/owner/professional-marketplace/profile-requests') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const result=professionalMarketplace.createProfileRequest(await parseJson(req),'owner');
    return result.error ? json(res,400,{ok:false,error:result.error}) : json(res,201,{ok:true,...result});
  }
  if (req.method === 'POST' && pathName.startsWith('/api/owner/professional-marketplace/profile-requests/')) {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalMarketplace.updateProfileRequest(id,await parseJson(req));
    return result ? json(res,200,{ok:true,...result}) : json(res,404,{ok:false,error:'Profile request not found.'});
  }
  if (req.method === 'GET' && pathName === '/api/admin/cases') {
    if (!requireAdmin(req, urlObj)) return json(res, 403, { ok:false, error:'Admin access is required.' });
    return json(res, 200, { ok:true, cases: store.allCases().map(publicCase), notifications: store.readJson('notifications.json', []), partners: store.allPartners().map(publicPartner), auditLog: store.auditLog().slice(0,200) });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/admin/cases/')) {
    if (!requireAdmin(req, urlObj)) return json(res, 403, { ok:false, error:'Admin access is required.' });
    const id = decodeURIComponent(pathName.split('/')[4] || '');
    const c = store.findCase(id); if (!c) return json(res, 404, { ok:false, error:'Case not found.' });
    const body = await parseJson(req);
    const changed = {};
    for (const field of ['status','humanReviewLane','professionalReviewLane','paymentStatus','deliveryStatus','userActionNeeded','formDraftStatus','reviewReadyDraftStatus']) if (body[field]) { changed[field] = { from:c[field], to:String(body[field]).slice(0,200) }; c[field] = String(body[field]).slice(0,200); }
    if (body.reviewReadyDraftOverrides) {
      try {
        const parsed = typeof body.reviewReadyDraftOverrides === 'string' ? JSON.parse(body.reviewReadyDraftOverrides || '{}') : body.reviewReadyDraftOverrides;
        if (parsed && typeof parsed === 'object') { c.reviewReadyDraftOverrides = Object.fromEntries(Object.entries(parsed).map(([k,v]) => [String(k).slice(0,80), String(v).slice(0,1200)])); changed.reviewReadyDraftOverrides = { to: Object.keys(c.reviewReadyDraftOverrides).length + ' corrected fields' }; }
      } catch { changed.reviewReadyDraftOverrides = { error:'Invalid JSON ignored' }; }
    }
    if (body.reviewReadyDraftFieldNotes) { c.reviewReadyDraftFieldNotes = String(body.reviewReadyDraftFieldNotes).slice(0,2500); changed.reviewReadyDraftFieldNotes = { to:'[updated]' }; }
    if (/approved/i.test(String(c.reviewReadyDraftStatus || ''))) c.reviewReadyDraftApprovedAt = c.reviewReadyDraftApprovedAt || store.now();
    if (body.userFacingNote) { c.userFacingNote = String(body.userFacingNote).slice(0,2500); c.moreInfoRequestedAt = store.now(); changed.userFacingNote = { to: '[updated]' }; }
    if (/ready|generated/i.test(String(c.formDraftStatus || ''))) c.draftPackageReady = true;
    if (/more information|waiting for user/i.test(String(c.status || '') + ' ' + String(c.userActionNeeded || ''))) notification('more_information_needed', { caseId:c.id, email:c.email || '', message:c.userFacingNote || c.userActionNeeded || '' });
    if (!Array.isArray(c.staffNotes)) c.staffNotes = [];
    if (body.staffNote) c.staffNotes.push({ at: store.now(), note: String(body.staffNote).slice(0,2000) });
    if (body.revokeContinuationAccess === true) { c.continuationAccessRevokedAt=store.now(); c.continuationAccessRevokedReason=String(body.continuationAccessRevokedReason||'owner or staff security action').slice(0,500); changed.continuationAccess={to:'revoked'}; }
    if (body.rotateContinuationAccess === true) { const nextToken=store.secureToken('continue'); c.continuationToken=nextToken; c.continuationLink=makeContinuationLink(nextToken); c.tokenIssuedAt=store.now(); c.tokenExpiresAt=new Date(Date.now()+CONTINUATION_TOKEN_DAYS*86400000).toISOString(); c.continuationAccessRevokedAt=''; c.continuationAccessRevokedReason=''; changed.continuationAccess={to:'rotated'}; }
    c.updatedAt = store.now(); rebuildCaseAnalysis(c); store.upsertCase(c);
    store.addAudit({ actor:'admin', action:'case_status_updated', caseId:c.id, details:{ changed, staffNoteAdded:Boolean(body.staffNote) } });
    return json(res, 200, { ok:true, case: publicCase(c) });
  }
  if (req.method === 'POST' && pathName === '/api/checkout') {
    const body = await parseJson(req);
    const result = await handleCheckout(body);
    return json(res, result.status, result.data);
  }
  if (req.method === 'GET' && pathName === '/api/checkout/confirm') {
    const result = await confirmCheckout(urlObj);
    return json(res, result.status, result.data);
  }
  return json(res, 404, { ok:false, error:'API route not found.' });
}
async function handleApi(req,res,urlObj){
  if (!['POST','PUT','PATCH','DELETE'].includes(req.method)) return handleApiCore(req,res,urlObj);
  res.__deferResponse = true;
  try {
    await store.runSerializedRequestMutation(()=>handleApiCore(req,res,urlObj));
    res.__deferResponse = false;
    commitDeferredResponse(res);
  } catch (error) {
    res.__pendingResponse = null;
    res.__deferResponse = false;
    throw error;
  }
}
function internalPageRole(pathName){
  let normalized = pathName.endsWith('/') ? `${pathName}index.html` : pathName;
  if (!path.extname(normalized)) normalized += '.html';
  if (['/control-center.html','/professional-network.html'].includes(normalized) || normalized === '/launch-activation.html') return 'owner';
  if (['/admin.html','/staff.html','/launch-readiness.html','/production-readiness.html','/ai-summary.html'].includes(normalized)) return 'staff';
  return '';
}
function redirectToInternalAccess(res,pathName,role){
  const destination = role === 'owner' ? '/owner-login.html' : '/internal-access.html';
  const location = `${destination}?next=${encodeURIComponent(pathName)}`;
  sendResponse(res,302,securityHeaders({'Location':location,'Content-Type':'text/plain; charset=utf-8','Content-Length':0,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive'}),'');
}
const server = http.createServer(async (req,res) => {
  const urlObj = new URL(req.url, BASE_URL);
  try {
    if (req.method === 'POST' && urlObj.pathname === '/webhooks/stripe') {
      res.__deferResponse=true;
      try { await store.runSerializedRequestMutation(()=>handleStripeWebhook(req,res)); res.__deferResponse=false; return commitDeferredResponse(res); }
      catch(error){ res.__pendingResponse=null; res.__deferResponse=false; throw error; }
    }
    if (['/health','/livez','/readyz'].includes(urlObj.pathname) || urlObj.pathname.startsWith('/api/')) return await handleApi(req, res, urlObj);
    if (req.method === 'GET' && urlObj.pathname === '/attorney-tour') { sendResponse(res,302,securityHeaders({'Location':'/attorney-partner-tour.html','Content-Type':'text/plain; charset=utf-8','Content-Length':0,'Cache-Control':'no-cache'}),''); return; }
    const attorneyTourDestination=req.method==='GET'?attorneyPartnerTour.shortRouteForPath(urlObj.pathname):'';
    if(attorneyTourDestination){ sendResponse(res,302,securityHeaders({'Location':attorneyTourDestination,'Content-Type':'text/plain; charset=utf-8','Content-Length':0,'Cache-Control':'no-cache'}),''); return; }
    const role=internalPageRole(urlObj.pathname);
    if(role==='owner' && !requireOwner(req)) return redirectToInternalAccess(res,urlObj.pathname,role);
    if(role==='staff' && !requireOwner(req) && !requireAdmin(req,urlObj)) return redirectToInternalAccess(res,urlObj.pathname,role);
    serveStatic(req, res, urlObj.pathname);
  } catch (err) {
    json(res, err.statusCode || 500, { ok:false, error: err.message || 'Server error' });
  }
});
if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  store.init().then(async () => {
    const ownerBootstrap=ownerAccounts.bootstrapFromEnvironment();
    if(ownerBootstrap.error && process.env.NODE_ENV==='production') throw new Error(ownerBootstrap.error);
    await store.flush();
    server.listen(port, () => {
      const address=server.address();
      const actualPort=address && typeof address==='object' ? address.port : port;
      if(!process.env.APP_BASE_URL && Number(port)===0) BASE_URL=`http://127.0.0.1:${actualPort}`;
      console.log(`Smarter Justice v${VERSION} listening on ${actualPort}`);
    });
  }).catch(err => {
    console.error('Storage initialization failed', err);
    process.exit(1);
  });
}
module.exports = server;
