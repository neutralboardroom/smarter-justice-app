const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');
const { URL } = require('url');
const { PRACTICE_AREAS, listPracticeSummaries, getPracticeBySlug } = require('./data/practiceAreas');
const { PORTALS, listPortalSummaries, getPortalBySlug, recommendPortalForPractice } = require('./data/portals');
const { OFFICIAL_SOURCE_CATALOG, FORM_READINESS_LEVELS, listCatalog } = require('./data/officialSourceCatalog');
const { FORM_PATHS, FORM_PATH_READINESS, recommendFormPaths, evaluateFormPathReadiness } = require('./data/formPaths');
const { schemaForPractice, DEFAULT_DOCUMENT_TYPES } = require('./data/intakeSchemas');
const { MATTER_PATHS, schemaForMatterPath } = require('./data/matterPaths');
const { REVIEW_READY_DRAFT_LEVELS, REVIEW_READY_DRAFT_PATHS, buildReviewReadyDraftEvaluation } = require('./data/reviewReadyDrafts');
const { US_STATES } = require('./data/jurisdictions');
const store = require('./lib/store');
const mailer = require('./lib/mailer');
const { buildStartingPoint } = require('./lib/router');
const aiProviders = require('./lib/aiProviders');
const controlCenter = require('./lib/controlCenter');
const professionalMarketplace = require('./lib/professionalMarketplace');
const masterRules = require('./data/masterRulesPack');
const professionalSources = require('./lib/publicProfessionalDataSources');
const professionalAccounts = require('./lib/professionalAccounts');
const ownerAccounts = require('./lib/ownerAccounts');

const VERSION = '1.6.1';
const PUBLIC = path.join(__dirname, 'public');
const MAX_UPLOADS_PER_REQUEST = Number(process.env.MAX_UPLOADS_PER_REQUEST || 6);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 8 * 1024 * 1024);
const ALLOWED_UPLOAD_EXTENSIONS = (process.env.ALLOWED_UPLOAD_EXTENSIONS || '.pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.rtf,.eml,.msg').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const ALLOWED_UPLOAD_MIME_PREFIXES = (process.env.ALLOWED_UPLOAD_MIME_PREFIXES || 'application/pdf,image/,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument,application/rtf,message/rfc822,application/octet-stream').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const WEBHOOK_TOLERANCE_SECONDS = Number(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS || 300);
const BODY_LIMIT_BYTES = Number(process.env.BODY_LIMIT_BYTES || 14 * 1024 * 1024);
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:' + (process.env.PORT || 3000);
const OWNER_EMAIL = String(process.env.OWNER_NOTIFICATION_EMAIL || '').trim();
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 80);
const rateBuckets = new Map();

function securityHeaders(extra={}){
  const tawkConfigured = Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID);
  const scriptSources = tawkConfigured ? "'self' https://embed.tawk.to" : "'self'";
  const connectSources = tawkConfigured ? "'self' https://*.tawk.to wss://*.tawk.to" : "'self'";
  const frameSources = tawkConfigured ? "https://*.tawk.to" : "'none'";
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': `default-src 'self'; img-src 'self' data: https://api.qrserver.com https://*.tawk.to; script-src ${scriptSources}; style-src 'self' 'unsafe-inline'; connect-src ${connectSources}; frame-src ${frameSources}; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://checkout.stripe.com`,
    ...extra
  };
}
function json(res, status, data){
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, securityHeaders({ 'Content-Type':'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store' }));
  res.end(body);
}
function jsonWithCookie(res, status, data, cookie){
  const body = JSON.stringify(data, null, 2);
  const headers = securityHeaders({ 'Content-Type':'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store' });
  if (cookie) headers['Set-Cookie'] = cookie;
  res.writeHead(status, headers);
  res.end(body);
}
function text(res, status, body, type='text/plain; charset=utf-8'){
  res.writeHead(status, securityHeaders({ 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store' }));
  res.end(body);
}
function getIp(req){ return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'; }
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
    const cache = /\.(svg|css|js|txt|xml)$/.test(target) ? 'public, max-age=300' : 'no-store';
    res.writeHead(200, securityHeaders({ 'Content-Type': mimeFor(target), 'Content-Length': data.length, 'Cache-Control': cache }));
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
function publicCase(c){
  if (!c) return null;
  const privateAccessToken = c.continuationToken || c.publicAccessToken || '';
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
    analysis: c.analysis,
    matterPath: c.analysis?.matterPath || null,
    correctNextPath: c.analysis?.correctNextPath || c.correctNextPath || '',
    dynamicMissingInformation: c.analysis?.dynamicMissingInformation || [],
    aiReview: c.analysis?.aiReview || null,
    aiProviderMode: c.analysis?.aiReview?.mode || 'rules-fallback',
    verifiedFormPaths: c.analysis?.verifiedFormPaths || [],
    missingInformation: c.analysis?.missingInformation || [],
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
    recommendedPortal: c.recommendedPortal || c.analysis?.recommendedPortal || null,
    portalRouting: c.analysis?.portalRouting || null,
    paymentRequestedAt: c.paymentRequestedAt || '',
    paymentConfirmedAt: c.paymentConfirmedAt || ''
  };
}

function findUserCase(token){
  const value = String(token || '').trim();
  if (!value) return null;
  return store.allCases().find(c => c.continuationToken === value || c.publicAccessToken === value) || null;
}
function requestBearerToken(req){
  const value = String(req.headers.authorization || '');
  return /^Bearer\s+/i.test(value) ? value.replace(/^Bearer\s+/i, '').trim() : '';
}
function requireAdmin(req, urlObj){
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
function makeContinuationLink(token){ return `${BASE_URL.replace(/\/$/,'')}/dashboard.html?case=${encodeURIComponent(token)}`; }
function notification(kind, payload){
  const userKinds = new Set(['free_question_received','private_continuation_link_requested','more_information_needed','payment_received','payment_received_webhook','file_ready','case_upload_added']);
  const to = String(userKinds.has(kind) && payload?.email ? payload.email : OWNER_EMAIL).trim();
  const delivery = !to ? 'spooled-no-recipient' : (mailer.configured() ? 'smtp-queued' : 'spooled-no-smtp');
  const note = store.addNotification({ kind, to, payload, delivery });
  store.addAudit({ actor: 'system', action: `notification:${kind}`, caseId: payload?.caseId || '', details: { recipientConfigured:Boolean(to) } });
  if (to) mailer.sendNotification(note).then(result => {
    if (result.sent) store.addAudit({ actor:'system', action:'email_sent', caseId: payload?.caseId || '', details:{ kind } });
  }).catch(err => store.addAudit({ actor:'system', action:'email_send_failed', caseId: payload?.caseId || '', details:{ kind, error:err.message } }));
  return note;
}
function estimateAttachmentBytes(a){
  const declared = Number(a && a.sizeBytes || 0);
  if (declared) return declared;
  const raw = String(a && a.dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
  if (!raw) return 0;
  return Math.ceil(raw.length * 3 / 4);
}
function uploadMimeAllowed(mime){
  const m = String(mime || '').toLowerCase();
  if (!m) return true;
  return ALLOWED_UPLOAD_MIME_PREFIXES.some(prefix => m === prefix || (prefix.endsWith('/') && m.startsWith(prefix)) || m.startsWith(prefix));
}
function normalizeAttachmentInputs(inputs){
  const warnings = [];
  const raw = Array.isArray(inputs) ? inputs : [];
  if (raw.length > MAX_UPLOADS_PER_REQUEST) warnings.push(`Only ${MAX_UPLOADS_PER_REQUEST} uploads were accepted in one request.`);
  const accepted = raw.slice(0, MAX_UPLOADS_PER_REQUEST).map(a => {
    if (!a || !a.name) return null;
    const originalName = String(a.name || 'upload');
    const ext = path.extname(originalName).toLowerCase();
    const size = estimateAttachmentBytes(a);
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) { warnings.push(`${originalName} was not saved because that file type is not accepted yet.`); return null; }
    if (!uploadMimeAllowed(a.mimeType || a.type || '')) { warnings.push(`${originalName} was not saved because the file type could not be verified.`); return null; }
    if (size && size > MAX_UPLOAD_BYTES) { warnings.push(`${originalName} was not saved because it is larger than the upload limit.`); return null; }
    return { ...a, sizeBytes: size, originalExtension: ext, uploadState: 'quarantined-awaiting-review' };
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
function launchReadinessChecklist(){
  const storage = store.storageStatus();
  const ownerAuth = ownerAccounts.status();
  const item = (key, ok, message, required=true) => ({ key, ok:Boolean(ok), message, required });
  const items = [
    item('adminToken', String(process.env.ADMIN_TOKEN || '').trim().length >= 24, 'Set a long ADMIN_TOKEN before staff use.'),
    item('ownerAccount', ownerAuth.accountAuthenticationReady, 'Configure the owner account with a strong password and short-lived session access.'),
    item('ownerMfa', ownerAuth.mfaRequiredForAll, 'Enable authenticator MFA and store owner recovery codes securely.'),
    item('legacyOwnerTokenDisabled', process.env.NODE_ENV !== 'production' || !/^true|1|yes$/i.test(String(process.env.ALLOW_LEGACY_OWNER_TOKEN || '')), 'Keep legacy owner-token access disabled in production after owner account setup.'),
    item('appBaseUrl', Boolean(process.env.APP_BASE_URL), 'Set APP_BASE_URL to the live Render or custom domain.'),
    item('smtp', Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS), 'Configure SMTP for password recovery, owner alerts, and user confirmations.'),
    item('stripeSecret', Boolean(process.env.STRIPE_SECRET_KEY), 'Configure the Stripe secret key for test-mode Checkout.'),
    item('stripeWebhook', Boolean(process.env.STRIPE_WEBHOOK_SECRET), 'Configure and verify the signed Stripe webhook.'),
    item('starterPrice', Boolean(process.env.STRIPE_STARTER_REVIEW_PRICE_ID), 'Add at least one Stripe Price ID for a starter review service.'),
    item('databasePersistence', storage.databaseReady, 'Use verified PostgreSQL persistence. If PostgreSQL is selected but unavailable, sensitive writes are blocked rather than saved locally.'),
    item('privateUploadStorage', storage.privateUploadStorageReady, 'Use durable private upload storage before accepting sensitive documents.'),
    item('storageOperational', storage.operationalForSensitiveTraffic, 'Both the production database and durable private upload storage must be ready for sensitive paid traffic.'),
    item('liveChat', Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID), 'Optional: configure tawk.to; the contact fallback remains available.', false),
    item('aiProvider', aiProviders.configuredProviders().some(p => p.configured), 'Optional: configure an approved AI provider; deterministic rules fallback remains available.', false),
    item('reviewReadyDrafts', REVIEW_READY_DRAFT_PATHS.length >= 5, 'Review-ready draft paths are installed; Human Review Specialist approval remains separate.'),
    item('ownerEmail', Boolean(OWNER_EMAIL), 'Set OWNER_NOTIFICATION_EMAIL so owner alerts have a recipient.'),
    item('uploadLimits', MAX_UPLOADS_PER_REQUEST <= 6 && MAX_UPLOAD_BYTES <= 8 * 1024 * 1024, 'Upload limits are set conservatively.')
  ];
  return { storageMode:storage.mode, storage, ownerAuthentication:ownerAuth, requiredChecks:items.filter(x=>x.required).length, optionalChecks:items.filter(x=>!x.required).length, readyForPaidTraffic:items.filter(x=>x.required).every(x=>x.ok), items };
}

function buildReviewPackageHtml(c){
  const concerns = (c.analysis?.concerns || []).map(x=>`<li>${htmlEscape(x)}</li>`).join('') || '<li>No immediate concern detected yet.</li>';
  const steps = (c.analysis?.nextSteps || []).map(x=>`<li>${htmlEscape(x)}</li>`).join('') || '<li>Continue answering starting questions.</li>';
  const files = (c.attachments || []).map(a=>`<li>${htmlEscape(a.originalName || a.name)} — ${htmlEscape(a.documentType || a.mimeType || '')} (${Math.round((a.sizeBytes||0)/1024)} KB)</li>`).join('') || '<li>No documents uploaded yet.</li>';
  const paths = (c.analysis?.verifiedFormPaths || []).map(p=>`<li><strong>${htmlEscape(p.title)}</strong> — ${htmlEscape(p.readinessLabel)}<br><small>${htmlEscape(p.deliveryType || '')}</small>${p.missingFields?.length ? `<br><em>Missing helpful details:</em> ${htmlEscape(p.missingFields.join(', '))}` : ''}</li>`).join('') || '<li>No verified form path selected yet. Start with an organized file and human review.</li>';
  const smart = Object.entries(c.smartAnswers || {}).filter(([,v])=>v).map(([k,v])=>`<tr><th>${htmlEscape(k.replace(/([A-Z])/g,' $1'))}</th><td>${htmlEscape(v)}</td></tr>`).join('') || '<tr><td colspan="2">No extra details saved yet.</td></tr>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Smarter Justice Organized File ${htmlEscape(c.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#142536;margin:32px;max-width:900px}h1,h2{color:#0f2f4a}.box{border:1px solid #d9e2ec;border-radius:14px;padding:16px;margin:14px 0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e2ec;padding:8px;text-align:left;vertical-align:top}small,.fine{color:#596b7a}</style></head><body><h1>Smarter Justice organized file summary</h1><p class="fine">Private support service. Not a law firm. Not the government. No guaranteed approval, timing, benefits, tax outcome, settlement, legal outcome, or case result.</p><div class="box"><h2>File summary</h2><p><strong>Practice area:</strong> ${htmlEscape(c.practiceName)} ${c.subcategory ? '— '+htmlEscape(c.subcategory) : ''}</p><p><strong>Status:</strong> ${htmlEscape(c.status)}</p><p><strong>Human Review Specialist:</strong> ${htmlEscape(c.humanReviewLane)}</p><p><strong>Professional review:</strong> ${htmlEscape(c.professionalReviewLane)}</p><p><strong>Payment:</strong> ${htmlEscape(c.paymentStatus)}</p><p><strong>Delivery:</strong> ${htmlEscape(c.deliveryStatus || 'not ready for delivery')}</p>${c.userActionNeeded ? `<p><strong>Action needed:</strong> ${htmlEscape(c.userActionNeeded)}</p>` : ''}${c.userFacingNote ? `<p><strong>Message from Smarter Justice:</strong> ${htmlEscape(c.userFacingNote)}</p>` : ''}<p><strong>State/local:</strong> ${htmlEscape([c.jurisdiction?.city,c.jurisdiction?.county,c.jurisdiction?.state].filter(Boolean).join(', ') || 'Not provided')}</p></div>${c.analysis?.matterPath ? `<div class="box"><h2>Suggested next step</h2><p><strong>${htmlEscape(c.analysis.matterPath.userNextPathTitle || c.analysis.matterPath.stageName || '')}</strong></p><p>${htmlEscape(c.analysis.matterPath.userNextPathSummary || '')}</p><ul>${(c.analysis.matterPath.dynamicMissingInformation || []).map(x=>`<li>${htmlEscape(x.label || x)}</li>`).join('') || '<li>No path-specific missing items listed yet.</li>'}</ul></div>` : ''}${c.analysis?.aiReview ? `<div class="box"><h2>Automated starting summary</h2><p>${htmlEscape(c.analysis.aiReview.plainLanguageSummary || '')}</p><p class="fine">This summary helps organize the starting point. It is not legal, tax, accounting, or other professional advice.</p></div>` : ''}<div class="box"><h2>Possible concerns that may need review</h2><ul>${concerns}</ul></div><div class="box"><h2>Suggested next steps</h2><ul>${steps}</ul></div><div class="box"><h2>Possible form or document path</h2><ul>${paths}</ul></div><div class="box"><h2>Uploaded documents</h2><ul>${files}</ul></div><div class="box"><h2>Starting details saved</h2><table>${smart}</table></div><p class="fine">Users remain responsible for reviewing, signing, filing, and submitting any official forms unless a separate professional engagement says otherwise. Official government forms are often free from the government.</p></body></html>`;
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
  return `<!doctype html><html><head><meta charset="utf-8"><title>Smarter Justice Form Preparation Starter File ${htmlEscape(c.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#142536;margin:32px;max-width:920px}h1,h2{color:#0f2f4a}.box{border:1px solid #d9e2ec;border-radius:14px;padding:16px;margin:14px 0;background:#fff}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e2ec;padding:8px;text-align:left;vertical-align:top}.fine{color:#596b7a}.warning{background:#fff7ed;border-color:#f4c790}</style></head><body><h1>Smarter Justice form-preparation starter file</h1><p class="fine">This is not a filed form and not legal, tax, accounting, or other professional advice. It organizes the user's answers so a Human Review Specialist can check what is present, what is missing, and whether a supported form path may be appropriate.</p><div class="box"><h2>Selected path</h2><p><strong>${htmlEscape(primary?.title || 'No verified form path selected yet')}</strong></p><p><strong>Readiness:</strong> ${htmlEscape(primary?.readinessLabel || c.analysis?.formReadiness?.label || 'Worksheet first')}</p><p><strong>Delivery type:</strong> ${htmlEscape(primary?.deliveryType || 'Organized starter file first')}</p><p><strong>Draft status:</strong> ${htmlEscape(c.formDraftStatus || 'not generated yet')}</p></div>${c.analysis?.matterPath ? `<div class="box"><h2>Where this issue may stand</h2><p><strong>${htmlEscape(c.analysis.matterPath.stageName || '')}</strong></p><p>${htmlEscape(c.analysis.matterPath.stageDescription || '')}</p><p><strong>Starting-information completeness:</strong> ${htmlEscape(String(c.analysis.matterPath.formReadinessScore || 0))}%</p></div>` : ''}<div class="box"><h2>Official forms and sources to check</h2><ul>${forms}</ul><p class="fine">Always verify the latest official source, instructions, fees, filing method, and signature requirements before preparing or delivering any completed form.</p></div><div class="box warning"><h2>Missing details or questions that need review</h2><ul>${missing}</ul></div><div class="box"><h2>Organized starter facts</h2><table>${factRows}</table></div><div class="box"><h2>Human Review Specialist checklist</h2><ul>${checklist}</ul></div><p class="fine">Smarter Justice is a private support service, not a law firm and not the government. Official government forms are often free from the government. No approval, refund, benefit, tax outcome, settlement, timing, filing acceptance, or case result is guaranteed.</p></body></html>`;
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
  return `<!doctype html><html><head><meta charset="utf-8"><title>Smarter Justice Draft for Review ${htmlEscape(c.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#142536;margin:32px;max-width:980px}h1,h2{color:#0f2f4a}.box{border:1px solid #d9e2ec;border-radius:14px;padding:16px;margin:14px 0;background:#fff}.warning{background:#fff7ed;border-color:#f4c790}.ok{background:#ecfdf5;border-color:#9be4c0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e2ec;padding:8px;text-align:left;vertical-align:top}small,.fine{color:#596b7a}</style></head><body><h1>Form draft for review</h1><p class="fine">This is a preliminary form draft organized from saved answers for Human Review Specialist review. It is not a filed form, not legal, tax, accounting, or other professional advice, and not ready for signature until review and user verification are complete.</p><div class="box"><h2>${htmlEscape(evaln.title || 'Organizer only')}</h2><p><strong>Status:</strong> ${htmlEscape(c.reviewReadyDraftStatus || 'not reviewed yet')}</p><p><strong>Readiness:</strong> ${htmlEscape(evaln.label || '')} · ${htmlEscape(String(evaln.completionPercent || 0))}% starter completeness</p><p><strong>Official source:</strong> ${htmlEscape(evaln.officialSourceName || 'Not selected')} ${evaln.officialUrl ? `— <a href="${htmlEscape(evaln.officialUrl)}">official source</a>` : ''}</p><p><strong>Forms:</strong> ${htmlEscape((evaln.officialFormNumbers || []).join(', ') || 'No official form number selected')}</p><p><strong>Source checked:</strong> ${htmlEscape(evaln.sourceCheckedDate || 'Not recorded')}</p><p><strong>Boundary:</strong> ${htmlEscape(evaln.automationBoundary || 'Human review required before delivery.')}</p></div><div class="box warning"><h2>Missing required starter fields</h2><ul>${missing}</ul></div><div class="box warning"><h2>What must happen before delivery</h2><p><strong>Status:</strong> ${htmlEscape(evaln.approvalStatus || c.reviewReadyDraftStatus || 'not reviewed yet')}</p><p><strong>Ready to send to the user for review:</strong> ${evaln.canDeliverForUserReview ? 'Yes, after final staff confirmation' : 'No'}</p><ul>${blockers}</ul></div><div class="box"><h2>Saved answers placed into draft fields</h2><table><thead><tr><th>Form question</th><th>Saved answer</th><th>Review note</th></tr></thead><tbody>${mappedRows}</tbody></table></div><div class="box"><h2>Required document checklist</h2><ul>${docs}</ul><h3>Uploaded so far</h3><ul>${uploaded}</ul></div><div class="box"><h2>Professional-review recommendation</h2><p>${htmlEscape(evaln.professionalReviewRecommendation || c.professionalReviewLane || 'Professional review may be recommended depending on the facts.')}</p></div><div class="box ok"><h2>Human Review Specialist checklist</h2><ul>${checklist}</ul></div><p class="fine">Users remain responsible for reviewing, correcting, signing, filing, and submitting any official forms unless a separate professional engagement says otherwise. Official government forms are often free from the government. Smarter Justice does not guarantee approval, timing, refunds, benefits, settlements, tax outcomes, or legal outcomes.</p></body></html>`;
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

function stripePriceFor(serviceType){
  const key = String(serviceType || '').toLowerCase();
  const map = {
    starter_review: process.env.STRIPE_STARTER_REVIEW_PRICE_ID,
    notice_review: process.env.STRIPE_NOTICE_REVIEW_PRICE_ID || process.env.STRIPE_STARTER_REVIEW_PRICE_ID,
    form_prep: process.env.STRIPE_FORM_PREP_PRICE_ID || process.env.STRIPE_STARTER_REVIEW_PRICE_ID,
    tax_review: process.env.STRIPE_TAX_REVIEW_PRICE_ID,
    attorney_review: process.env.STRIPE_ATTORNEY_REVIEW_PRICE_ID,
    professional_review: process.env.STRIPE_PROFESSIONAL_REVIEW_PRICE_ID || process.env.STRIPE_ATTORNEY_REVIEW_PRICE_ID
  };
  return map[key] || map.starter_review || '';
}
function stripeRequest(method, stripePath, formData){
  return new Promise((resolve, reject) => {
    const body = formData ? querystring.stringify(formData) : '';
    const req = https.request({ hostname: 'api.stripe.com', path: stripePath, method, headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } }, res => {
      let data = ''; res.on('data', d => data += d); res.on('end', () => { try { const parsed = JSON.parse(data || '{}'); if (res.statusCode >= 400) return reject(new Error(parsed.error?.message || `Stripe API error ${res.statusCode}`)); resolve(parsed); } catch (err) { reject(err); } });
    });
    req.on('error', reject); if (body) req.write(body); req.end();
  });
}
async function handleCheckout(body){
  const caseId = String(body.caseId || '').trim();
  const c = caseId ? findUserCase(caseId) : null;
  if (!c) return { ok:false, status:404, data:{ ok:false, error:'File not found for payment request.' } };
  const serviceType = body.serviceType || 'starter_review';
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const priceId = stripePriceFor(serviceType);
  c.paymentStatus = stripeConfigured && priceId ? 'payment link created' : 'payment step requested';
  c.paymentRequestedAt = store.now();
  c.status = c.status || 'Started — organized file created';
  c.updatedAt = store.now(); rebuildCaseAnalysis(c); store.upsertCase(c);
  notification('payment_step_requested', { caseId: c.id, serviceType, stripeConfigured, priceConfigured: Boolean(priceId) });
  store.addAudit({ actor:'user', action:'payment_step_requested', caseId:c.id, details:{ serviceType, stripeConfigured:Boolean(stripeConfigured), priceConfigured:Boolean(priceId) } });
  if (!stripeConfigured) return { ok:true, status:200, data:{ ok:true, stripeConfigured:false, message:'Payment request saved. Add Stripe credentials and price IDs to activate Checkout.', case: publicCase(c) } };
  if (!priceId) return { ok:false, status:400, data:{ ok:false, stripeConfigured:true, error:'Stripe secret key is set, but the price ID for this review type is missing.' } };
  const cleanBase = BASE_URL.replace(/\/$/,'');
  const session = await stripeRequest('POST', '/v1/checkout/sessions', {
    mode: 'payment',
    success_url: `${cleanBase}/checkout-success.html?case=${encodeURIComponent(c.continuationToken)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${cleanBase}/checkout-cancel.html?case=${encodeURIComponent(c.continuationToken)}`,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': 1,
    client_reference_id: c.id,
    customer_email: c.email || undefined,
    'metadata[caseId]': c.id,
    'metadata[serviceType]': serviceType,
    allow_promotion_codes: 'true'
  });
  return { ok:true, status:200, data:{ ok:true, stripeConfigured:true, checkoutUrl: session.url, sessionId: session.id, case: publicCase(c) } };
}
async function confirmCheckout(urlObj){
  const token = urlObj.searchParams.get('case') || '';
  const sessionId = urlObj.searchParams.get('session_id') || '';
  const c = token ? findUserCase(token) : null;
  if (!c) return { status:404, data:{ ok:false, error:'File not found.' } };
  if (!process.env.STRIPE_SECRET_KEY || !sessionId) return { status:200, data:{ ok:true, stripeConfigured:Boolean(process.env.STRIPE_SECRET_KEY), message:'Payment confirmation page reached. Stripe confirmation requires a session ID and live Stripe credentials.', case: publicCase(c) } };
  const session = await stripeRequest('GET', `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session.payment_status === 'paid' || session.status === 'complete') {
    c.paymentStatus = 'paid via Stripe Checkout';
    c.paymentConfirmedAt = store.now();
    c.status = 'Payment received — review/delivery step in progress';
    c.updatedAt = store.now();
    c.stripeSessionId = session.id;
    store.upsertCase(c);
    notification('payment_received', { caseId:c.id, sessionId: session.id, amountTotal: session.amount_total, currency: session.currency });
    store.addAudit({ actor:'stripe', action:'payment_confirmed', caseId:c.id, details:{ sessionId:session.id, amountTotal: session.amount_total, currency: session.currency } });
  }
  return { status:200, data:{ ok:true, sessionStatus:session.status, paymentStatus:session.payment_status, case: publicCase(c) } };
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
  const target={kind:String(body.kind||auth.account.membershipTarget?.kind||''),id:String(body.id||auth.account.membershipTarget?.id||''),planId:String(body.planId||auth.account.membershipTarget?.planId||''),seatCount:Number(body.seatCount||auth.account.membershipTarget?.seatCount||1),billingCadence:['annual','monthly'].includes(body.billingCadence)?body.billingCadence:'monthly'};
  if(!professionalTargetOwned(auth.account,target)) return {status:403,data:{ok:false,error:'That membership target is not connected to this professional account.'}};
  const owner=professionalMarketplace.getOwnerData(); const plan=owner.membershipPlans.find(x=>x.id===target.planId);
  if(!plan||!['pilot-ready','active'].includes(plan.status)) return {status:400,data:{ok:false,error:'That membership plan is not available for live signup.'}};
  let unitAmount=target.billingCadence==='annual'?plan.annualPriceCents:plan.monthlyPriceCents; let quantity=1; let quote=null;
  if(target.kind==='firm'){
    quote=professionalMarketplace.calculateFirmMembershipQuote(target.planId,target.seatCount);
    if(quote.error) return {status:400,data:{ok:false,error:quote.error}};
    unitAmount=target.billingCadence==='annual'?quote.annualDiscountedPerSeatCents:quote.monthlyDiscountedPerSeatCents; quantity=quote.seatCount;
  }
  if(!unitAmount) return {status:400,data:{ok:false,error:'Pricing is not configured for that plan and billing cadence.'}};
  const enrollment=professionalMarketplace.membershipEnrollmentAvailability(target);
  if(!enrollment.available) return {status:409,data:{ok:false,error:enrollment.reason,pilotStatus:enrollment.controls?.status || 'paused',capacity:enrollment.capacity}};
  professionalAccounts.setMembershipTarget(auth.account.id,target);
  if(!process.env.STRIPE_SECRET_KEY) return {status:200,data:{ok:true,stripeConfigured:false,message:'The professional account and selected membership were saved. Add the Stripe secret key to activate live subscription checkout.',target,quote}};
  const interval=target.billingCadence==='annual'?'year':'month'; const cleanBase=BASE_URL.replace(/\/$/,'');
  const form={
    mode:'subscription', success_url:`${cleanBase}/professional-dashboard.html?membership=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url:`${cleanBase}/professional-dashboard.html?membership=cancelled`, client_reference_id:auth.account.id, customer_email:auth.account.email, allow_promotion_codes:'true',
    'line_items[0][price_data][currency]':'usd', 'line_items[0][price_data][unit_amount]':String(unitAmount), 'line_items[0][price_data][recurring][interval]':interval, 'line_items[0][price_data][product_data][name]':plan.name, 'line_items[0][price_data][product_data][description]':'Fixed Smarter Justice professional platform membership. No guaranteed clients, appointments, ranking, or outcomes.', 'line_items[0][quantity]':String(quantity),
    'metadata[kind]':'professional_membership', 'metadata[accountId]':auth.account.id, 'metadata[membershipKind]':target.kind, 'metadata[membershipId]':target.id, 'metadata[planId]':target.planId, 'metadata[seatCount]':String(target.seatCount), 'metadata[billingCadence]':target.billingCadence
  };
  const session=await stripeRequest('POST','/v1/checkout/sessions',form);
  store.addAudit({actor:'professional-account',action:'professional_membership_checkout_created',details:{accountId:auth.account.id,kind:target.kind,targetId:target.id,planId:target.planId,seatCount:target.seatCount,billingCadence:target.billingCadence,sessionId:session.id}});
  return {status:200,data:{ok:true,stripeConfigured:true,checkoutUrl:session.url,sessionId:session.id,target,quote}};
}
function applyProfessionalMembershipSession(session,eventType='checkout.session.completed'){
  if(session?.metadata?.kind!=='professional_membership') return {handled:false};
  const target={kind:session.metadata.membershipKind,id:session.metadata.membershipId,planId:session.metadata.planId,seatCount:Number(session.metadata.seatCount||1),billingCadence:session.metadata.billingCadence||'monthly'};
  const verifiedCompletedEvent=eventType==='checkout.session.completed';
  const sessionComplete=session.status==='complete';
  const paymentSatisfied=['paid','no_payment_required'].includes(session.payment_status);
  const paid=(verifiedCompletedEvent||sessionComplete)&&paymentSatisfied;
  if(!paid) return {handled:true,activated:false,accountId:session.metadata.accountId||''};
  const applied=professionalMarketplace.applyMembershipPayment(target,{sessionId:session.id||'',customerId:session.customer||'',subscriptionId:session.subscription||''});
  store.addAudit({actor:'stripe',action:'professional_membership_activated',details:{accountId:session.metadata.accountId||'',kind:target.kind,targetId:target.id,planId:target.planId,seatCount:target.seatCount,sessionId:session.id||'',applied:!applied.error}});
  return {handled:true,activated:!applied.error,error:applied.error||'',accountId:session.metadata.accountId||'',target};
}
async function confirmProfessionalMembership(req,urlObj){
  const auth=professionalAccounts.accountFromRequest(req); if(!auth) return {status:401,data:{ok:false,error:'Sign in to confirm the membership.'}};
  const sessionId=urlObj.searchParams.get('session_id')||''; if(!process.env.STRIPE_SECRET_KEY||!sessionId) return {status:200,data:{ok:true,stripeConfigured:Boolean(process.env.STRIPE_SECRET_KEY),message:'Stripe confirmation requires a completed Checkout session.'}};
  const session=await stripeRequest('GET',`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if(session?.metadata?.accountId!==auth.account.id) return {status:403,data:{ok:false,error:'That Checkout session does not belong to this professional account.'}};
  const applied=applyProfessionalMembershipSession(session,'manual-confirm');
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
async function handleStripeWebhook(req, res){
  const rawBody = await readRawBody(req, BODY_LIMIT_BYTES);
  const verified = verifyStripeWebhookSignature(rawBody, req.headers['stripe-signature']);
  if (!verified.ok) { store.addAudit({ actor:'stripe', action:'stripe_webhook_rejected', details:{ error:verified.error } }); return json(res, 400, { ok:false, error:verified.error }); }
  let event;
  try { event = JSON.parse(rawBody.toString('utf8')); } catch { return json(res, 400, { ok:false, error:'Invalid JSON webhook body.' }); }
  let result = { received:true, handled:false };
  if (event && event.type && event.data && event.data.object && String(event.type).startsWith('checkout.session.')) {
    const session=event.data.object;
    if(session?.metadata?.kind==='professional_membership'){
      const applied=applyProfessionalMembershipSession(session,event.type);
      result={received:true,handled:true,professionalMembership:true,activated:applied.activated,accountId:applied.accountId||''};
    } else {
      const applied = applyStripeCheckoutSession(session, event.type);
      result = { received:true, handled:true, foundCase: applied.found, caseId: applied.caseId || applied.case?.id || '' };
    }
  } else {
    store.addAudit({ actor:'stripe', action:'stripe_webhook_received_unhandled', details:{ type:event?.type || 'unknown' } });
  }
  return json(res, 200, result);
}

async function handleApi(req, res, urlObj){
  const pathName = urlObj.pathname;
  const sensitiveRead = req.method === 'GET' && (/^\/api\/cases\//.test(pathName) || /^\/api\/community-partners\//.test(pathName) || (pathName === '/api/admin/cases' || pathName.startsWith('/api/owner/control-center') || pathName.startsWith('/api/owner/professional-marketplace') || pathName === '/api/system/master-rules-pack') || pathName === '/api/launch-readiness' || pathName === '/api/checkout/confirm' || pathName.startsWith('/api/professional/') || pathName.startsWith('/api/public/nys-attorneys'));
  if (['POST','PUT','PATCH','DELETE'].includes(req.method) || sensitiveRead) {
    const limited = rateLimit(req, pathName);
    if (limited) return json(res, 429, { ok:false, error:'Too many requests. Please try again later.', retryAfterSeconds: limited.retryAfterSeconds });
  }
  if (req.method === 'GET' && pathName === '/health') {
    return json(res, 200, {
      ok: true, app: 'Smarter Justice', version: VERSION,
      timestamp: new Date().toISOString(),
      features: {
        separateFromImmigrationOasis: true,
        multiPracticeMvp: true,
        practiceAreas: PRACTICE_AREAS.length,
        umbrellaPortalRouter: true,
        portalCount: PORTALS.length,
        microPortalGateway: true,
        focusedPortalCards: true,
        smarterJusticeUmbrellaPositioning: true,
        immigrationOasisSeparatePortalCard: true,
        livePilotComingSoonPortalStatuses: true,
        privateOwnerControlCenterFoundation: true,
        portalPortfolioTracking: true,
        sharedPlatformStandardVersion: controlCenter.SHARED_STANDARD_VERSION,
        masterRulesPackVersion: masterRules.MASTER_RULES_PACK_VERSION,
        masterRulesPackChecksum: masterRules.checksum(),
        protectedMasterRulesPackApi: true,
        professionalMarketplaceFoundation: true,
        professionalMarketplaceStandardVersion: professionalMarketplace.PROFESSIONAL_MARKETPLACE_STANDARD_VERSION,
        marketplaceRevenueStandardVersion: professionalMarketplace.MARKETPLACE_REVENUE_STANDARD_VERSION,
        professionalSourcePlanVersion: professionalMarketplace.PROFESSIONAL_SOURCE_PLAN_VERSION,
        publicProfessionalDataSourceVersion: professionalSources.PUBLIC_PROFESSIONAL_DATA_SOURCE_VERSION,
        nysAttorneyOfficialSourceConnector: true,
        professionalPublicSourceSeedingFoundation: true,
        professionalClaimCorrectionWorkflowFoundation: true,
        professionalPaidMembershipEligibilityEngine: true,
        marketplaceRevenueArchitectureTracking: true,
        firmVolumeDiscountFoundation: true,
        nycFoundingProfessionalPilotFoundation: true,
        professionalOutreachPipelineFoundation: true,
        mobileQrProfessionalInterestFoundation: true,
        downtownBrooklyn26CourtStreetSeedProfiles: true,
        publicProfessionalDirectoryActivated: true,
        publicProfessionalProfileFinderActivated: true,
        centralProfessionalAccountsActivated: true,
        professionalStripeSubscriptionCheckoutFoundation: true,
        officialNysAttorneyPagination: true,
        shareablePublicDirectoryFilters: true,
        clearableProfessionalAndOfficialSearches: true,
        sourceGroundedProfileMetadata: true,
        professionalSetupChecklist: true,
        transparentFirmMembershipEstimator: true,
        mobileEnrollmentAutocomplete: true,
        freeFirstPricingClarity: true,
        publicConsultationBookingActivated: false,
        portalPromptGenerator: true,
        masterCoordinationPromptGenerator: true,
        portfolioManifestExport: true,
        controlCenterOwnerRoleSeparatedFromStaffAdmin: true,
        subcategoryCoverage: PRACTICE_AREAS.reduce((sum,p)=>sum+p.subcategories.length,0),
        homepageQuestionBox: true,
        characterCountdown2500: true,
        optionalUploadOnFreeQuestion: true,
        savedDashboard: true,
        dashboardEmptyStates: true,
        guidedHomepageStepFlow: true,
        simplifiedTopNavigation: true,
        uploadNoticePrimaryCta: true,
        focusedPracticeLandingPages: 15,
        conversionReadyPricingPage: true,
        aiProviderLayerFoundation: true,
        aiProviderFallbackWithoutKeys: true,
        matterPathEngine: true,
        matterPathStageDetection: true,
        matterPathCount: Object.keys(MATTER_PATHS).length,
        correctNextPathScreen: true,
        dynamicMissingInfoChecklist: true,
        formReadinessScorePerMatter: true,
        dashboardStageTimeline: true,
        staffWhyPathChosen: true,
        deeperQuestionTreesForHighValueAreas: true,
        friendlyValidationErrors: true,
        accessibilityPolishFoundation: true,
        staffQueueAttentionFilter: true,
        savedUploads: true,
        documentNoticeAnalyzer: true,
        noticeUploadEntryPage: true,
        documentTypeLabeling: true,
        practiceSpecificSmartQuestions: true,
        formReadinessLevels: true,
        verifiedFormPathRegistry: true,
        verifiedFormPathCount: FORM_PATHS.length,
        firstFormDraftStarterPackage: true,
        reviewReadyFormDrafts: true,
        reviewReadyDraftPathCount: REVIEW_READY_DRAFT_PATHS.length,
        verifiedFieldMappingFoundation: true,
        officialFieldMapDraftsConservative: true,
        humanReviewApprovalBeforeDelivery: true,
        reviewReadyDraftDownload: true,
        reviewReadyDraftUserMissingDetailUpdates: true,
        reviewReadyDraftStaffFieldOverrides: true,
        reviewReadyDraftApprovalGate: true,
        expandedTaxReviewDraftPaths: true,
        draftQualityChecks: true,
        draftPackageDownload: true,
        secureContinuationTokens: true,
        userCaseAccessRequiresContinuationToken: true,
        smtpEmailDeliveryScaffold: true,
        optionalPostgresPersistence: true,
        reviewPackageDownload: true,
        reviewDeliveryPackageFlow: true,
        requestMoreInformationWorkflow: true,
        futureAiFormEngineFoundation: true,
        jurisdictionAwareStateCountyCity: true,
        humanReviewSpecialistWorkflow: true,
        humanReviewSeparateFromAttorneyReview: true,
        attorneyReviewOption: true,
        cpaEaAccountantReviewOption: true,
        taxAttorneyReviewOption: true,
        taxPreparationAndResolutionDistinct: true,
        offerInCompromiseIncluded: true,
        professionalReviewLane: true,
        stripeCheckoutFoundation: true,
        stripeWebhookFoundation: true,
        checkoutSuccessCancelPages: true,
        paymentDeliveryGateStructure: true,
        ownerAdminStaffWorkflow: true,
        humanReviewWorkbenchFilters: true,
        adminAuditLogFoundation: true,
        launchReadinessChecklist: true,
        userLinkEmailTemplateSpool: true,
        uploadQuarantineFoundation: true,
        allowedUploadExtensions: ALLOWED_UPLOAD_EXTENSIONS,
        rateLimitFoundation: true,
        securityHeaders: true,
        productionStorageWarning: true,
        renderDiskStoragePathSupport: true,
        communityPartnerCreditDashboard: true,
        communityPartnerPrivateAccessKeys: true,
        communityPartnerAnonymizedReporting: true,
        adminCredentialsExcludedFromUrlsByDefault: true,
        configuredPortalUrlValidation: true,
        adminTokenRequiredNoDefault: true,
        ownerControlCenterTokenRequiredNoDefault: true,
        uploadLimits: { maxUploadsPerRequest: MAX_UPLOADS_PER_REQUEST, maxUploadBytes: MAX_UPLOAD_BYTES },
        ownerNotificationSpool: true,
        liveChatReady: Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID),
        contactSupportFallback: true,
        liveChatPublicConfigEndpoint: true,
        englishSpanishPublicSupport: true,
        referralProgram: true,
        communityPartnerTools: true,
        trackedQrFlyerFoundation: true,
        flyersAvoidPlainWebsiteAddress: true,
        officialSourceCatalog: true,
        officialSourceCatalogEntries: OFFICIAL_SOURCE_CATALOG.length,
        seoMetadataRobotsSitemapLlms: true,
        futureLeadMappingFieldsReady: true,
        leadSaleIntegrationsDisabledInV1: true,
        professionalDirectoryFoundationPrivateOnly: false
      },
      operationalReadiness: {
        sensitiveTrafficApproved: store.storageStatus().operationalForSensitiveTraffic && ownerAccounts.status().mfaRequiredForAll,
        detailedReadinessRequiresAuthentication: true
      }
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
    liveChat:{
      configured:Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID),
      propertyId:String(process.env.TAWK_PROPERTY_ID || ''),
      widgetId:String(process.env.TAWK_WIDGET_ID || '')
    }
  });
  if (req.method === 'GET' && pathName === '/api/practice-areas') return json(res, 200, { practiceAreas: listPracticeSummaries(), states: US_STATES, defaultDocumentTypes: DEFAULT_DOCUMENT_TYPES });
  if (req.method === 'GET' && pathName === '/api/portals') return json(res, 200, { ok:true, portals: listPortalSummaries(), statuses: ['Live — Separate Platform','Pilot — Start Here Now','In Development','Coming Soon','Available Now'] });
  if (req.method === 'GET' && pathName.startsWith('/api/portals/')) { const slug = decodeURIComponent(pathName.split('/').pop() || ''); const portal = getPortalBySlug(slug); return portal ? json(res, 200, { ok:true, portal }) : json(res, 404, { ok:false, error:'Portal not found.' }); }
  if (req.method === 'GET' && pathName === '/api/portal-recommendation') { const practiceSlug = urlObj.searchParams.get('practice') || ''; const portal = recommendPortalForPractice(practiceSlug); return json(res, 200, { ok:true, practiceSlug, portal }); }
  if (req.method === 'GET' && pathName.startsWith('/api/intake-schema/')) {
    const slug = decodeURIComponent(pathName.split('/').pop() || 'other');
    return json(res, 200, { ok:true, slug, schema: schemaForPractice(slug), matterPath: schemaForMatterPath(slug) });
  }
  if (req.method === 'GET' && pathName === '/api/matter-paths') return json(res, 200, { ok:true, matterPaths: MATTER_PATHS });
  if (req.method === 'GET' && pathName === '/api/ai-status') return json(res, 200, { ok:true, enabled:/^true|1|yes$/i.test(String(process.env.AI_REVIEW_ENABLED || '')), providers: aiProviders.configuredProviders(), fallbackWithoutKeys:true });
  if (req.method === 'GET' && pathName === '/api/official-source-catalog') return json(res, 200, { catalog: listCatalog(), readinessLevels: FORM_READINESS_LEVELS });
  if (req.method === 'GET' && pathName === '/api/form-paths') return json(res, 200, { formPaths: FORM_PATHS, readinessLevels: FORM_PATH_READINESS, reviewReadyDraftPaths: REVIEW_READY_DRAFT_PATHS, reviewReadyDraftLevels: REVIEW_READY_DRAFT_LEVELS });
  if (req.method === 'GET' && pathName === '/api/review-ready-draft-paths') return json(res, 200, { ok:true, draftPaths: REVIEW_READY_DRAFT_PATHS, levels: REVIEW_READY_DRAFT_LEVELS });
  if (req.method === 'GET' && pathName === '/api/launch-readiness') {
    if (!requireAdmin(req, urlObj)) return json(res, 403, { ok:false, error:'Admin access is required.' });
    return json(res, 200, { ok:true, version: VERSION, checklist: launchReadinessChecklist() });
  }
  if (req.method === 'POST' && pathName === '/api/free-question') {
    const body = await parseJson(req);
    const question = String(body.question || '').slice(0, 2500);
    if (!question.trim()) return json(res, 400, { ok:false, error:'Please describe what happened or what you need help with.' });
    const id = store.uid('case');
    const continuationToken = store.secureToken('continue');
    const smartAnswers = collectSmartAnswers(body);
    const normalizedUploads = normalizeAttachmentInputs(body.attachments);
    const savedAttachments = normalizedUploads.accepted.map(a => store.saveAttachment(id, { ...a, documentType: body.documentType || smartAnswers.documentType || '' })).filter(Boolean);
    const analysis = buildStartingPoint({ question: enrichQuestion(body), practiceArea: body.practiceArea, subcategory: body.subcategory, state: body.state, county: body.county, city: body.city, attachments: savedAttachments, documentType: body.documentType || smartAnswers.documentType || '', smartAnswers });
    analysis.recommendedPortal = recommendPortalForPractice(analysis.practiceSlug, String(body.requestedPortal || ''));
    analysis.portalRouting = { umbrella:'Smarter Justice', recommendedPortalSlug: analysis.recommendedPortal.slug, recommendedPortalName: analysis.recommendedPortal.name, status: analysis.recommendedPortal.status, userMessage: analysis.recommendedPortal.userRouteMessage };
    analysis.aiReview = await aiProviders.generateMatterReview({ caseInput: { question, practiceArea: body.practiceArea, subcategory: body.subcategory, state: body.state, county: body.county, city: body.city, documentType: body.documentType || smartAnswers.documentType || '', smartAnswers }, analysis });
    const c = {
      id, continuationToken,
      createdAt: store.now(), updatedAt: store.now(),
      fullName: String(body.fullName || '').slice(0,120), email: String(body.email || '').slice(0,180), phone: String(body.phone || '').slice(0,80),
      language: body.language || 'en', question, practiceSlug: analysis.practiceSlug, practiceName: analysis.practiceName, subcategory: analysis.subcategory,
      jurisdiction: analysis.jurisdiction, status: 'Started — organized file created',
      humanReviewLane: analysis.humanReview, professionalReviewLane: analysis.professionalReview,
      paymentStatus: 'not requested yet', deliveryStatus: 'not ready for delivery', referralCode: body.referralCode || '',
      attachments: savedAttachments, analysis, correctNextPath: analysis.correctNextPath || analysis.matterPath?.userNextPathTitle || '',
      formPathEvaluation: analysis.formPathEvaluation || null, uploadWarnings: normalizedUploads.warnings || [],
      documentType: body.documentType || smartAnswers.documentType || '',
      deadlineDate: body.deadlineDate || smartAnswers.deadlineDate || '',
      dateReceived: body.dateReceived || smartAnswers.dateReceived || '',
      desiredHelp: body.desiredHelp || smartAnswers.desiredHelp || '',
      smartAnswers,
      futureLeadFieldsCaptured: { urgency: body.urgency || '', zipCode: body.zipCode || '', noticeOrDeadline: body.noticeOrDeadline || '', deadlineDate: body.deadlineDate || smartAnswers.deadlineDate || '', dateReceived: body.dateReceived || smartAnswers.dateReceived || '', agencyOrCourt: body.agencyOrCourt || body.courtOrAgency || smartAnswers.courtOrAgency || '', documentType: body.documentType || smartAnswers.documentType || '', amountInvolved: body.amountInvolved || smartAnswers.amountInvolved || '', opposingParty: body.opposingParty || smartAnswers.opposingParty || '', desiredHelp: body.desiredHelp || smartAnswers.desiredHelp || '', consentToContact: Boolean(body.consentToContact) },
      continuationLink: makeContinuationLink(continuationToken), tokenIssuedAt: store.now(), tokenExpiresAt: '', formDraftStatus: 'not generated yet', draftPackageReady: false,
      reviewReadyDraftStatus: 'not reviewed yet', reviewReadyDraftApprovedAt: '', reviewReadyDraftOverrides: {}, reviewReadyDraftFieldNotes: '', requestedPortal: String(body.requestedPortal || '').slice(0,80), recommendedPortal: analysis.recommendedPortal, staffNotes: []
    };
    c.reviewReadyDraft = buildReviewReadyDraftEvaluation(c);
    c.analysis.reviewReadyDraft = c.reviewReadyDraft;
    store.upsertCase(c);
    store.addAudit({ actor:'user', action:'starting_file_created', caseId:id, details:{ practice:c.practiceName, referralCode:c.referralCode, attachments:savedAttachments.length } });
    notification('new_free_question', { caseId: id, practice: c.practiceName, subcategory: c.subcategory, referralCode: c.referralCode, urgent: analysis.concerns });
    if (c.email) notification('free_question_received', { caseId:id, email:c.email, practice:c.practiceName, continuationLink:c.continuationLink });
    return json(res, 200, { ok:true, case: publicCase(c), message:'Your starting file was created.' });
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
    const saved = normalizedUploads.accepted.map(a => store.saveAttachment(c.id, a)).filter(Boolean);
    c.uploadWarnings = [...(c.uploadWarnings || []), ...(normalizedUploads.warnings || [])].slice(-20);
    c.attachments = [...(c.attachments || []), ...saved]; c.updatedAt = store.now();
    rebuildCaseAnalysis(c);
    c.analysis.aiReview = await aiProviders.generateMatterReview({ caseInput: { question:c.question, practiceArea:c.practiceSlug, subcategory:c.subcategory, state:c.jurisdiction.state, county:c.jurisdiction.county, city:c.jurisdiction.city, documentType:c.documentType || '', smartAnswers:c.smartAnswers || {} }, analysis:c.analysis });
    c.analysis.reviewReadyDraft = c.reviewReadyDraft;
    c.correctNextPath = c.analysis.correctNextPath || c.analysis.matterPath?.userNextPathTitle || '';
    store.upsertCase(c); store.addAudit({ actor:'user', action:'documents_added', caseId:c.id, details:{ count:saved.length } }); notification('case_upload_added', { caseId: c.id, email:c.email || '', count: saved.length, practice: c.practiceName, continuationLink:c.continuationLink });
    return json(res, 200, { ok:true, attachments: saved.map(publicAttachment).filter(Boolean), case: publicCase(c) });
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
    return json(res, 200, { ok:true, message: process.env.SMTP_HOST ? 'A private link email is queued.' : 'Private link request saved. SMTP must be configured to send real email.', notificationId: note.id });
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

  if (req.method === 'GET' && pathName === '/api/owner/auth/status') {
    const auth=ownerAccounts.accountFromRequest(req); const status=ownerAccounts.status();
    return json(res,200,{ok:true,authenticated:Boolean(auth),account:auth?.account || null,accountAuthenticationReady:status.accountAuthenticationReady,mfaRequiredForAll:status.mfaRequiredForAll,legacyTokenAllowed:process.env.NODE_ENV!=='production' || /^true|1|yes$/i.test(String(process.env.ALLOW_LEGACY_OWNER_TOKEN || ''))});
  }
  if (req.method === 'POST' && pathName === '/api/owner/auth/login') {
    const limited=rateLimit(req,'owner-login',{maxRequests:10,windowMs:15*60*1000}); if(limited) return json(res,429,{ok:false,error:'Too many sign-in attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds});
    const result=ownerAccounts.login(await parseJson(req),{ip:getIp(req),userAgent:req.headers['user-agent'] || ''});
    return result.error?json(res,401,{ok:false,error:result.error,mfaRequired:Boolean(result.mfaRequired)}):jsonWithCookie(res,200,{ok:true,account:result.account,expiresAt:result.session.expiresAt},result.session.cookie);
  }
  if (req.method === 'POST' && pathName === '/api/owner/auth/logout') { const result=ownerAccounts.logout(req); return jsonWithCookie(res,200,{ok:true},result.cookie); }
  if (req.method === 'POST' && pathName === '/api/owner/auth/mfa/begin') { const result=ownerAccounts.beginMfa(req); if(result.unauthorized)return json(res,401,{ok:false,error:'Owner sign-in is required.'}); return json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/auth/mfa/confirm') { const body=await parseJson(req); const result=ownerAccounts.confirmMfa(req,body.code); if(result.unauthorized)return json(res,401,{ok:false,error:'Owner sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/auth/recovery-codes/rotate') { const result=ownerAccounts.rotateRecoveryCodes(req,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Owner sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/owner/auth/sessions/revoke-others') { const result=ownerAccounts.revokeOtherSessions(req); return result.unauthorized?json(res,401,{ok:false,error:'Owner sign-in is required.'}):json(res,200,{ok:true,...result}); }

  if (req.method === 'GET' && pathName === '/api/public/professionals') {
    return json(res,200,{ok:true,...professionalMarketplace.searchPublicProfessionals({q:urlObj.searchParams.get('q'),borough:urlObj.searchParams.get('borough'),practiceArea:urlObj.searchParams.get('practice'),professionalType:urlObj.searchParams.get('type'),portal:urlObj.searchParams.get('portal'),limit:urlObj.searchParams.get('limit'),offset:urlObj.searchParams.get('offset')})});
  }
  if (req.method === 'GET' && pathName.startsWith('/api/public/professionals/')) {
    const id=decodeURIComponent(pathName.split('/').pop()||''); const professional=professionalMarketplace.getPublicProfessional(id);
    return professional?json(res,200,{ok:true,professional}):json(res,404,{ok:false,error:'Professional profile not found.'});
  }
  if (req.method === 'GET' && pathName === '/api/public/firms') return json(res,200,{ok:true,...professionalMarketplace.searchPublicFirms({q:urlObj.searchParams.get('q'),borough:urlObj.searchParams.get('borough'),practiceArea:urlObj.searchParams.get('practice'),limit:urlObj.searchParams.get('limit'),offset:urlObj.searchParams.get('offset')})});
  if (req.method === 'GET' && pathName.startsWith('/api/public/firms/')) { const id=decodeURIComponent(pathName.split('/').pop()||''); const firm=professionalMarketplace.getPublicFirm(id); return firm?json(res,200,{ok:true,firm}):json(res,404,{ok:false,error:'Firm profile not found.'}); }
  if (req.method === 'GET' && pathName === '/api/public/nys-attorneys') {
    try { const result=await professionalSources.previewNysAttorneys({firstName:urlObj.searchParams.get('firstName'),lastName:urlObj.searchParams.get('lastName'),registrationNumber:urlObj.searchParams.get('registrationNumber'),county:urlObj.searchParams.get('county'),city:urlObj.searchParams.get('city'),state:urlObj.searchParams.get('state'),companyName:urlObj.searchParams.get('companyName'),streetAddress:urlObj.searchParams.get('streetAddress'),limit:urlObj.searchParams.get('limit'),offset:urlObj.searchParams.get('offset')}); return json(res,200,{ok:true,officialSource:true,source:result.source,queryUrl:result.queryUrl,count:result.count,professionals:result.rows.map(x=>({displayName:x.displayName,professionalType:x.professionalType,officeLocations:x.officeLocations,jurisdictions:x.jurisdictions,publicFacts:x.publicFacts,sourceRecords:x.sourceRecords,claimable:true,disclosure:'Official public registration information. This record is not a Smarter Justice membership, endorsement, or consultation offer.'}))}); } catch(err){ return json(res,502,{ok:false,error:'The official New York attorney data source could not be reached. Try again later.',detail:process.env.NODE_ENV==='test'?err.message:undefined}); }
  }
  if (req.method === 'POST' && pathName === '/api/professional/auth/signup') { const limited=rateLimit(req,'professional-signup',{maxRequests:8,windowMs:60*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many account-creation attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const result=professionalAccounts.createAccount(await parseJson(req)); return result.error?json(res,400,{ok:false,error:result.error}):jsonWithCookie(res,201,{ok:true,account:result.account,message:'Your central Smarter Justice professional account was created. Complete profile verification and membership setup to become eligible for platform consultations.'},result.session.cookie); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/login') { const limited=rateLimit(req,'professional-login',{maxRequests:10,windowMs:15*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many sign-in attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const result=professionalAccounts.login(await parseJson(req)); return result.error?json(res,401,{ok:false,error:result.error,mfaRequired:Boolean(result.mfaRequired)}):jsonWithCookie(res,200,{ok:true,account:result.account},result.session.cookie); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/logout') { const result=professionalAccounts.logout(req); return jsonWithCookie(res,200,{ok:true},result.cookie); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/password-reset/request') { const limited=rateLimit(req,'professional-password-reset-request',{maxRequests:5,windowMs:60*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many password-reset requests. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const body=await parseJson(req); const result=await professionalAccounts.requestPasswordReset(body.email); return json(res,200,{ok:true,message:'If an active account matches that address, a password-reset message will be sent.',...(process.env.NODE_ENV==='test'&&result.testToken?{testToken:result.testToken}:{})}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/password-reset/confirm') { const limited=rateLimit(req,'professional-password-reset-confirm',{maxRequests:10,windowMs:30*60*1000}); if(limited)return json(res,429,{ok:false,error:'Too many password-reset attempts. Try again later.',retryAfterSeconds:limited.retryAfterSeconds}); const body=await parseJson(req); const result=professionalAccounts.resetPassword(body.token,body.password); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,message:'Your password was reset. Sign in again on all devices.'}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/mfa/begin') { const result=professionalAccounts.beginMfa(req); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/mfa/confirm') { const body=await parseJson(req); const result=professionalAccounts.confirmMfa(req,body.code); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/mfa/disable') { const result=professionalAccounts.disableMfa(req,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); return result.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && pathName === '/api/professional/auth/sessions/revoke-others') { const result=professionalAccounts.revokeOtherSessions(req); return result.unauthorized?json(res,401,{ok:false,error:'Professional sign-in is required.'}):json(res,200,{ok:true,...result}); }
  if (req.method === 'GET' && pathName === '/api/professional/session') { const auth=professionalAccounts.accountFromRequest(req); return auth?json(res,200,{ok:true,account:auth.account}):json(res,401,{ok:false,error:'Professional sign-in is required.'}); }
  if (req.method === 'GET' && pathName === '/api/professional/dashboard') { const dashboard=professionalAccounts.dashboard(req); return dashboard?json(res,200,{ok:true,...dashboard}):json(res,401,{ok:false,error:'Professional sign-in is required.'}); }
  if (req.method === 'POST' && pathName === '/api/professional/claim-profile') { const auth=professionalAccounts.accountFromRequest(req); if(!auth) return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const body=await parseJson(req); const result=professionalAccounts.attachClaim(auth.account.id,String(body.professionalId||'')); return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,message:'Your claim request was saved. Smarter Justice must verify identity and credentials before the profile is marked claimed.'}); }
  if (req.method === 'POST' && pathName === '/api/professional/claim-firm') { const auth=professionalAccounts.accountFromRequest(req); if(!auth) return json(res,401,{ok:false,error:'Professional sign-in is required.'}); const body=await parseJson(req); const result=professionalAccounts.attachFirmClaim(auth.account.id,String(body.firmId||'')); return result.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,message:'Your firm profile claim was saved. Smarter Justice must verify identity and authority before account control is granted.'}); }
  if (req.method === 'POST' && pathName.startsWith('/api/professional/profiles/')) { const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalAccounts.updateProfessionalForAccount(req,id,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That profile is not connected to this account.'}); return result?.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
  if (req.method === 'POST' && /^\/api\/professional\/firms\/[^/]+\/professionals$/.test(pathName)) { const parts=pathName.split('/'); const id=decodeURIComponent(parts[4]||''); const result=professionalAccounts.addProfessionalToFirm(req,id,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That firm is not connected to this account.'}); return result?.error?json(res,400,{ok:false,error:result.error}):json(res,201,{ok:true,...result,message:'The professional profile was added to the central firm workspace. Verification and marketplace eligibility remain separate.'}); }
  if (req.method === 'POST' && pathName.startsWith('/api/professional/firms/')) { const id=decodeURIComponent(pathName.split('/').pop()||''); const result=professionalAccounts.updateFirmForAccount(req,id,await parseJson(req)); if(result.unauthorized)return json(res,401,{ok:false,error:'Professional sign-in is required.'}); if(result.forbidden)return json(res,403,{ok:false,error:'That firm is not connected to this account.'}); return result?.error?json(res,400,{ok:false,error:result.error}):json(res,200,{ok:true,...result}); }
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
  if (req.method === 'GET' && pathName === '/api/owner/control-center') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, version:VERSION, systemLaunchReadiness:launchReadinessChecklist(), marketplaceFeatureStatus:professionalMarketplace.publicFeatureStatus(), ...controlCenter.getControlCenterData() });
  }
  if (req.method === 'GET' && pathName === '/api/owner/control-center/export') {
    if (!requireOwner(req)) return json(res, 403, { ok:false, error:'Private owner access is required.' });
    return json(res, 200, { ok:true, exportVersion:'1.0.0', appVersion:VERSION, systemLaunchReadiness:launchReadinessChecklist(), marketplaceFeatureStatus:professionalMarketplace.publicFeatureStatus(), ...controlCenter.getControlCenterData() });
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
  if (req.method === 'GET' && pathName === '/api/owner/professional-accounts') {
    if (!requireOwner(req)) return json(res,403,{ok:false,error:'Private owner access is required.'});
    return json(res,200,{ok:true,...professionalAccounts.ownerSummary()});
  }
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
const server = http.createServer(async (req,res) => {
  const urlObj = new URL(req.url, BASE_URL);
  try {
    if (req.method === 'POST' && urlObj.pathname === '/webhooks/stripe') return await handleStripeWebhook(req, res);
    if (urlObj.pathname === '/health' || urlObj.pathname.startsWith('/api/')) return await handleApi(req, res, urlObj);
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
    server.listen(port, () => console.log(`Smarter Justice v${VERSION} listening on ${port}`));
  }).catch(err => {
    console.error('Storage initialization failed', err);
    process.exit(1);
  });
}
module.exports = server;
