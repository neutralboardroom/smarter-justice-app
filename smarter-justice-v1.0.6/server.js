const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');
const { URL } = require('url');
const { PRACTICE_AREAS, listPracticeSummaries, getPracticeBySlug } = require('./data/practiceAreas');
const { OFFICIAL_SOURCE_CATALOG, FORM_READINESS_LEVELS, listCatalog } = require('./data/officialSourceCatalog');
const { FORM_PATHS, FORM_PATH_READINESS, recommendFormPaths, evaluateFormPathReadiness } = require('./data/formPaths');
const { schemaForPractice, DEFAULT_DOCUMENT_TYPES } = require('./data/intakeSchemas');
const { US_STATES } = require('./data/jurisdictions');
const store = require('./lib/store');
const mailer = require('./lib/mailer');
const { buildStartingPoint } = require('./lib/router');

const VERSION = '1.0.6';
const PUBLIC = path.join(__dirname, 'public');
const MAX_UPLOADS_PER_REQUEST = Number(process.env.MAX_UPLOADS_PER_REQUEST || 6);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 8 * 1024 * 1024);
const ALLOWED_UPLOAD_EXTENSIONS = (process.env.ALLOWED_UPLOAD_EXTENSIONS || '.pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.doc,.docx,.rtf,.eml,.msg').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const ALLOWED_UPLOAD_MIME_PREFIXES = (process.env.ALLOWED_UPLOAD_MIME_PREFIXES || 'application/pdf,image/,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument,application/rtf,message/rfc822,application/octet-stream').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
const WEBHOOK_TOLERANCE_SECONDS = Number(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS || 300);
const BODY_LIMIT_BYTES = Number(process.env.BODY_LIMIT_BYTES || 14 * 1024 * 1024);
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:' + (process.env.PORT || 3000);
const OWNER_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL || 'reachrgnow@gmail.com';
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 80);
const rateBuckets = new Map();

function securityHeaders(extra={}){
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https://api.qrserver.com; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://checkout.stripe.com",
    ...extra
  };
}
function json(res, status, data){
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, securityHeaders({ 'Content-Type':'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store' }));
  res.end(body);
}
function text(res, status, body, type='text/plain; charset=utf-8'){
  res.writeHead(status, securityHeaders({ 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'Cache-Control':'no-store' }));
  res.end(body);
}
function getIp(req){ return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'; }
function rateLimit(req, routeKey){
  if (process.env.NODE_ENV === 'test') return null;
  const key = `${getIp(req)}:${routeKey}`;
  const now = Date.now();
  const current = rateBuckets.get(key) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > current.reset) { current.count = 0; current.reset = now + RATE_LIMIT_WINDOW_MS; }
  current.count += 1; rateBuckets.set(key, current);
  if (current.count > RATE_LIMIT_MAX) return { retryAfterSeconds: Math.ceil((current.reset - now) / 1000) };
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
function publicCase(c){
  if (!c) return null;
  return {
    id: c.id,
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
    attachments: c.attachments || [],
    documentType: c.documentType || '',
    deadlineDate: c.deadlineDate || '',
    dateReceived: c.dateReceived || '',
    desiredHelp: c.desiredHelp || '',
    smartAnswers: c.smartAnswers || {},
    futureLeadFieldsCaptured: c.futureLeadFieldsCaptured || {},
    analysis: c.analysis,
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
    paymentRequestedAt: c.paymentRequestedAt || '',
    paymentConfirmedAt: c.paymentConfirmedAt || ''
  };
}
function requireAdmin(urlObj){
  const token = urlObj.searchParams.get('token') || '';
  const configured = process.env.ADMIN_TOKEN || '';
  return Boolean(token && configured && token === configured);
}
function makeContinuationLink(token){ return `${BASE_URL.replace(/\/$/,'')}/dashboard.html?case=${encodeURIComponent(token)}`; }
function notification(kind, payload){
  const userKinds = new Set(['free_question_received','private_continuation_link_requested','more_information_needed','payment_received','payment_received_webhook','file_ready','case_upload_added']);
  const to = userKinds.has(kind) && payload?.email ? payload.email : OWNER_EMAIL;
  const note = store.addNotification({ kind, to, payload, delivery: mailer.configured() ? 'smtp-queued' : 'spooled-no-smtp' });
  store.addAudit({ actor: 'system', action: `notification:${kind}`, caseId: payload?.caseId || '', details: { to } });
  mailer.sendNotification(note).then(result => {
    if (result.sent) store.addAudit({ actor:'system', action:'email_sent', caseId: payload?.caseId || '', details:{ kind, to } });
  }).catch(err => store.addAudit({ actor:'system', action:'email_send_failed', caseId: payload?.caseId || '', details:{ kind, to, error:err.message } }));
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
  return `${base}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
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
  const storageMode = currentStorageMode();
  const items = [
    ['adminToken', Boolean(process.env.ADMIN_TOKEN), 'Set a long ADMIN_TOKEN before staff use.'],
    ['appBaseUrl', Boolean(process.env.APP_BASE_URL), 'Set APP_BASE_URL to the live Render/custom domain.'],
    ['smtp', Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS), 'Configure SMTP for owner and user confirmations.'],
    ['stripeSecret', Boolean(process.env.STRIPE_SECRET_KEY), 'Configure Stripe secret key for Checkout.'],
    ['stripeWebhook', Boolean(process.env.STRIPE_WEBHOOK_SECRET), 'Configure Stripe webhook signing secret for payment confirmation.'],
    ['starterPrice', Boolean(process.env.STRIPE_STARTER_REVIEW_PRICE_ID), 'Add at least one Stripe Price ID for starter review.'],
    ['storage', !/warning|not-ready/.test(storageMode), 'Use Postgres plus persistent/object upload storage before sensitive paid uploads.'],
    ['databasePersistence', store.storageStatus().databaseReady || !process.env.DATABASE_URL, 'If DATABASE_URL is set, Postgres should initialize successfully.'],
    ['liveChat', Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID), 'Configure tawk.to or use contact fallback.'],
    ['ownerEmail', Boolean(OWNER_EMAIL), 'Owner notification email is configured.'],
    ['uploadLimits', MAX_UPLOADS_PER_REQUEST <= 6 && MAX_UPLOAD_BYTES <= 8 * 1024 * 1024, 'Upload limits are set conservatively.']
  ];
  return { storageMode, readyForPaidTraffic: items.every(item => item[1]), items: items.map(([key, ok, message]) => ({ key, ok, message })) };
}
function buildReviewPackageHtml(c){
  const concerns = (c.analysis?.concerns || []).map(x=>`<li>${htmlEscape(x)}</li>`).join('') || '<li>No immediate concern detected yet.</li>';
  const steps = (c.analysis?.nextSteps || []).map(x=>`<li>${htmlEscape(x)}</li>`).join('') || '<li>Continue answering starting questions.</li>';
  const files = (c.attachments || []).map(a=>`<li>${htmlEscape(a.originalName || a.name)} — ${htmlEscape(a.documentType || a.mimeType || '')} (${Math.round((a.sizeBytes||0)/1024)} KB)</li>`).join('') || '<li>No documents uploaded yet.</li>';
  const paths = (c.analysis?.verifiedFormPaths || []).map(p=>`<li><strong>${htmlEscape(p.title)}</strong> — ${htmlEscape(p.readinessLabel)}<br><small>${htmlEscape(p.deliveryType || '')}</small>${p.missingFields?.length ? `<br><em>Missing helpful details:</em> ${htmlEscape(p.missingFields.join(', '))}` : ''}</li>`).join('') || '<li>No verified form path selected yet. Start with an organized file and human review.</li>';
  const smart = Object.entries(c.smartAnswers || {}).filter(([,v])=>v).map(([k,v])=>`<tr><th>${htmlEscape(k.replace(/([A-Z])/g,' $1'))}</th><td>${htmlEscape(v)}</td></tr>`).join('') || '<tr><td colspan="2">No extra details saved yet.</td></tr>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Smarter Justice Review Package ${htmlEscape(c.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#142536;margin:32px;max-width:900px}h1,h2{color:#0f2f4a}.box{border:1px solid #d9e2ec;border-radius:14px;padding:16px;margin:14px 0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e2ec;padding:8px;text-align:left;vertical-align:top}small,.fine{color:#596b7a}</style></head><body><h1>Smarter Justice organized review package</h1><p class="fine">Private support service. Not a law firm. Not the government. No guaranteed approval, timing, benefits, tax outcome, settlement, legal outcome, or case result.</p><div class="box"><h2>File summary</h2><p><strong>Practice area:</strong> ${htmlEscape(c.practiceName)} ${c.subcategory ? '— '+htmlEscape(c.subcategory) : ''}</p><p><strong>Status:</strong> ${htmlEscape(c.status)}</p><p><strong>Human Review Specialist:</strong> ${htmlEscape(c.humanReviewLane)}</p><p><strong>Professional review:</strong> ${htmlEscape(c.professionalReviewLane)}</p><p><strong>Payment:</strong> ${htmlEscape(c.paymentStatus)}</p><p><strong>Delivery:</strong> ${htmlEscape(c.deliveryStatus || 'not ready for delivery')}</p>${c.userActionNeeded ? `<p><strong>Action needed:</strong> ${htmlEscape(c.userActionNeeded)}</p>` : ''}${c.userFacingNote ? `<p><strong>Message from Smarter Justice:</strong> ${htmlEscape(c.userFacingNote)}</p>` : ''}<p><strong>State/local:</strong> ${htmlEscape([c.jurisdiction?.city,c.jurisdiction?.county,c.jurisdiction?.state].filter(Boolean).join(', ') || 'Not provided')}</p></div><div class="box"><h2>Possible concerns that may need review</h2><ul>${concerns}</ul></div><div class="box"><h2>Suggested next steps</h2><ul>${steps}</ul></div><div class="box"><h2>Suggested verified-form path foundation</h2><ul>${paths}</ul></div><div class="box"><h2>Uploaded documents</h2><ul>${files}</ul></div><div class="box"><h2>Starting details saved</h2><table>${smart}</table></div><p class="fine">Users remain responsible for reviewing, signing, filing, and submitting any official forms unless a separate professional engagement says otherwise. Official government forms are often free from the government.</p></body></html>`;
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
  return `<!doctype html><html><head><meta charset="utf-8"><title>Smarter Justice Draft Package ${htmlEscape(c.id)}</title><style>body{font-family:Arial,sans-serif;line-height:1.45;color:#142536;margin:32px;max-width:920px}h1,h2{color:#0f2f4a}.box{border:1px solid #d9e2ec;border-radius:14px;padding:16px;margin:14px 0;background:#fff}table{border-collapse:collapse;width:100%}th,td{border:1px solid #d9e2ec;padding:8px;text-align:left;vertical-align:top}.fine{color:#596b7a}.warning{background:#fff7ed;border-color:#f4c790}</style></head><body><h1>Smarter Justice form-draft starter package</h1><p class="fine">This is not a filed form and not legal or tax advice. It organizes the user's answers for Human Review Specialist review and, where supported later, official draft preparation after verification.</p><div class="box"><h2>Selected path</h2><p><strong>${htmlEscape(primary?.title || 'No verified form path selected yet')}</strong></p><p><strong>Readiness:</strong> ${htmlEscape(primary?.readinessLabel || c.analysis?.formReadiness?.label || 'Worksheet first')}</p><p><strong>Delivery type:</strong> ${htmlEscape(primary?.deliveryType || 'Organized starter file first')}</p><p><strong>Draft status:</strong> ${htmlEscape(c.formDraftStatus || 'not generated yet')}</p></div><div class="box"><h2>Official forms/sources to verify</h2><ul>${forms}</ul><p class="fine">Always verify the latest official source, instructions, fees, filing method, and signature requirements before preparing or delivering any completed form.</p></div><div class="box warning"><h2>Missing or review-sensitive details</h2><ul>${missing}</ul></div><div class="box"><h2>Organized starter facts</h2><table>${factRows}</table></div><div class="box"><h2>Human Review Specialist checklist</h2><ul>${checklist}</ul></div><p class="fine">Smarter Justice is a private support service, not a law firm and not the government. Official government forms are often free from the government. No approval, refund, benefit, tax outcome, settlement, timing, filing acceptance, or case result is guaranteed.</p></body></html>`;
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
  const c = caseId ? store.findCase(caseId) : null;
  if (!c) return { ok:false, status:404, data:{ ok:false, error:'File not found for payment request.' } };
  const serviceType = body.serviceType || 'starter_review';
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const priceId = stripePriceFor(serviceType);
  c.paymentStatus = stripeConfigured && priceId ? 'payment link created' : 'payment step requested';
  c.paymentRequestedAt = store.now();
  c.status = c.status || 'Started — organized file created';
  c.updatedAt = store.now(); store.upsertCase(c);
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
  const c = token ? store.findCase(token) : null;
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
    const applied = applyStripeCheckoutSession(event.data.object, event.type);
    result = { received:true, handled:true, foundCase: applied.found, caseId: applied.caseId || applied.case?.id || '' };
  } else {
    store.addAudit({ actor:'stripe', action:'stripe_webhook_received_unhandled', details:{ type:event?.type || 'unknown' } });
  }
  return json(res, 200, result);
}

async function handleApi(req, res, urlObj){
  const pathName = urlObj.pathname;
  if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    const limited = rateLimit(req, pathName);
    if (limited) return json(res, 429, { ok:false, error:'Too many requests. Please try again later.', retryAfterSeconds: limited.retryAfterSeconds });
  }
  if (req.method === 'GET' && pathName === '/health') {
    return json(res, 200, {
      ok: true, app: 'Smarter Justice', version: VERSION, ownerNotificationEmail: OWNER_EMAIL,
      timestamp: new Date().toISOString(), baseUrl: BASE_URL,
      features: {
        separateFromImmigrationOasis: true,
        multiPracticeMvp: true,
        practiceAreas: PRACTICE_AREAS.length,
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
        draftPackageDownload: true,
        secureContinuationTokens: true,
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
        adminTokenRequiredNoDefault: true,
        uploadLimits: { maxUploadsPerRequest: MAX_UPLOADS_PER_REQUEST, maxUploadBytes: MAX_UPLOAD_BYTES },
        ownerNotificationSpool: true,
        liveChatReady: true,
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
        attorneyProfileDirectoryDisabledInV1: true
      },
      credentials: {
        smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
        stripeStarterPriceConfigured: Boolean(process.env.STRIPE_STARTER_REVIEW_PRICE_ID),
        stripeTaxPriceConfigured: Boolean(process.env.STRIPE_TAX_REVIEW_PRICE_ID),
        tawkConfigured: Boolean(process.env.TAWK_PROPERTY_ID && process.env.TAWK_WIDGET_ID),
        adminTokenConfigured: Boolean(process.env.ADMIN_TOKEN),
        storageMode: currentStorageMode(),
        storageStatus: store.storageStatus(),
        stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET)
      }
    });
  }
  if (req.method === 'GET' && pathName === '/api/practice-areas') return json(res, 200, { practiceAreas: listPracticeSummaries(), states: US_STATES, defaultDocumentTypes: DEFAULT_DOCUMENT_TYPES });
  if (req.method === 'GET' && pathName.startsWith('/api/intake-schema/')) {
    const slug = decodeURIComponent(pathName.split('/').pop() || 'other');
    return json(res, 200, { ok:true, slug, schema: schemaForPractice(slug) });
  }
  if (req.method === 'GET' && pathName === '/api/official-source-catalog') return json(res, 200, { catalog: listCatalog(), readinessLevels: FORM_READINESS_LEVELS });
  if (req.method === 'GET' && pathName === '/api/form-paths') return json(res, 200, { formPaths: FORM_PATHS, readinessLevels: FORM_PATH_READINESS });
  if (req.method === 'GET' && pathName === '/api/launch-readiness') {
    if (!requireAdmin(urlObj)) return json(res, 403, { ok:false, error:'Admin token required.' });
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
    const c = {
      id, continuationToken,
      createdAt: store.now(), updatedAt: store.now(),
      fullName: String(body.fullName || '').slice(0,120), email: String(body.email || '').slice(0,180), phone: String(body.phone || '').slice(0,80),
      language: body.language || 'en', question, practiceSlug: analysis.practiceSlug, practiceName: analysis.practiceName, subcategory: analysis.subcategory,
      jurisdiction: analysis.jurisdiction, status: 'Started — organized file created',
      humanReviewLane: analysis.humanReview, professionalReviewLane: analysis.professionalReview,
      paymentStatus: 'not requested yet', deliveryStatus: 'not ready for delivery', referralCode: body.referralCode || '',
      attachments: savedAttachments, analysis,
      formPathEvaluation: analysis.formPathEvaluation || null, uploadWarnings: normalizedUploads.warnings || [],
      documentType: body.documentType || smartAnswers.documentType || '',
      deadlineDate: body.deadlineDate || smartAnswers.deadlineDate || '',
      dateReceived: body.dateReceived || smartAnswers.dateReceived || '',
      desiredHelp: body.desiredHelp || smartAnswers.desiredHelp || '',
      smartAnswers,
      futureLeadFieldsCaptured: { urgency: body.urgency || '', zipCode: body.zipCode || '', noticeOrDeadline: body.noticeOrDeadline || '', deadlineDate: body.deadlineDate || smartAnswers.deadlineDate || '', dateReceived: body.dateReceived || smartAnswers.dateReceived || '', agencyOrCourt: body.agencyOrCourt || body.courtOrAgency || smartAnswers.courtOrAgency || '', documentType: body.documentType || smartAnswers.documentType || '', amountInvolved: body.amountInvolved || smartAnswers.amountInvolved || '', opposingParty: body.opposingParty || smartAnswers.opposingParty || '', desiredHelp: body.desiredHelp || smartAnswers.desiredHelp || '', consentToContact: Boolean(body.consentToContact) },
      continuationLink: makeContinuationLink(continuationToken), tokenIssuedAt: store.now(), tokenExpiresAt: '', formDraftStatus: 'not generated yet', draftPackageReady: false, staffNotes: []
    };
    store.upsertCase(c);
    store.addAudit({ actor:'user', action:'starting_file_created', caseId:id, details:{ practice:c.practiceName, referralCode:c.referralCode, attachments:savedAttachments.length } });
    notification('new_free_question', { caseId: id, practice: c.practiceName, subcategory: c.subcategory, ownerEmail: OWNER_EMAIL, referralCode: c.referralCode, urgent: analysis.concerns });
    if (c.email) notification('free_question_received', { caseId:id, email:c.email, practice:c.practiceName, continuationLink:c.continuationLink });
    return json(res, 200, { ok:true, case: publicCase(c), message:'Your starting file was created.' });
  }
  if (req.method === 'GET' && pathName.startsWith('/api/cases/') && pathName.endsWith('/review-package')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = store.findCase(id);
    if (!c) return json(res, 404, { ok:false, error:'File not found.' });
    return text(res, 200, buildReviewPackageHtml(c), 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && pathName.startsWith('/api/cases/') && pathName.endsWith('/draft-package')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = store.findCase(id);
    if (!c) return json(res, 404, { ok:false, error:'File not found.' });
    store.addAudit({ actor:'user', action:'draft_package_opened', caseId:c.id, details:{ formDraftStatus:c.formDraftStatus || '' } });
    return text(res, 200, buildDraftPackageHtml(c), 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && pathName.startsWith('/api/cases/')) {
    const id = decodeURIComponent(pathName.split('/').pop());
    const c = store.findCase(id);
    if (!c) return json(res, 404, { ok:false, error:'Case not found.' });
    return json(res, 200, { ok:true, case: publicCase(c) });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/cases/') && pathName.endsWith('/upload')) {
    const parts = pathName.split('/'); const id = decodeURIComponent(parts[3]);
    const c = store.findCase(id); if (!c) return json(res, 404, { ok:false, error:'Case not found.' });
    const body = await parseJson(req);
    const normalizedUploads = normalizeAttachmentInputs(body.attachments);
    const saved = normalizedUploads.accepted.map(a => store.saveAttachment(c.id, a)).filter(Boolean);
    c.uploadWarnings = [...(c.uploadWarnings || []), ...(normalizedUploads.warnings || [])].slice(-20);
    c.attachments = [...(c.attachments || []), ...saved]; c.updatedAt = store.now();
    c.analysis = buildStartingPoint({ question: c.question, practiceArea: c.practiceSlug, subcategory: c.subcategory, state: c.jurisdiction.state, county: c.jurisdiction.county, city: c.jurisdiction.city, attachments: c.attachments, documentType: c.documentType || '', smartAnswers: c.smartAnswers || {} });
    store.upsertCase(c); store.addAudit({ actor:'user', action:'documents_added', caseId:c.id, details:{ count:saved.length } }); notification('case_upload_added', { caseId: c.id, email:c.email || '', count: saved.length, practice: c.practiceName, continuationLink:c.continuationLink });
    return json(res, 200, { ok:true, attachments: saved, case: publicCase(c) });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/cases/') && pathName.endsWith('/email-link')) {
    const id = decodeURIComponent(pathName.split('/')[3] || '');
    const c = store.findCase(id);
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
    const code = makePartnerCode(body.name, body.requestedCode);
    const partner = store.upsertPartner({ id: store.uid('partner'), code, name: String(body.name || 'Community Partner').slice(0,140), contactName: body.contactName || '', email: body.email || '', phone: body.phone || '', type: body.type || '', createdAt: store.now(), credits: 0, starts: 0, dashboardUrl: `${BASE_URL}/community-partner-tools.html?code=${encodeURIComponent(code)}`, flyerUrl: `${BASE_URL}/partner-flyer.html?code=${encodeURIComponent(code)}` });
    notification('community_partner_registered', { code, name: partner.name, email: partner.email });
    store.addAudit({ actor:'community_partner', action:'partner_registered', details:{ code, name:partner.name } });
    return json(res, 200, { ok:true, partner });
  }
  if (req.method === 'GET' && pathName.startsWith('/api/community-partners/')) {
    const code = decodeURIComponent(pathName.split('/').pop());
    const partner = store.allPartners().find(p => p.code === code);
    if (!partner) return json(res, 404, { ok:false, error:'Community Partner code not found.' });
    const cases = store.allCases().filter(c => c.referralCode === code).map(publicCase);
    return json(res, 200, { ok:true, partner: { ...partner, starts: cases.length, credits: cases.filter(c=>/paid|waived/i.test(c.paymentStatus || '')).length }, referredStarts: cases });
  }
  if (req.method === 'GET' && pathName === '/api/qr') {
    const data = urlObj.searchParams.get('data') || BASE_URL;
    return text(res, 200, svgQr(data), 'image/svg+xml');
  }
  if (req.method === 'GET' && pathName === '/api/admin/cases') {
    if (!requireAdmin(urlObj)) return json(res, 403, { ok:false, error:'Admin token required.' });
    return json(res, 200, { ok:true, cases: store.allCases().map(publicCase), notifications: store.readJson('notifications.json', []), partners: store.allPartners(), auditLog: store.auditLog().slice(0,200) });
  }
  if (req.method === 'POST' && pathName.startsWith('/api/admin/cases/')) {
    if (!requireAdmin(urlObj)) return json(res, 403, { ok:false, error:'Admin token required.' });
    const id = decodeURIComponent(pathName.split('/')[4] || '');
    const c = store.findCase(id); if (!c) return json(res, 404, { ok:false, error:'Case not found.' });
    const body = await parseJson(req);
    const changed = {};
    for (const field of ['status','humanReviewLane','professionalReviewLane','paymentStatus','deliveryStatus','userActionNeeded','formDraftStatus']) if (body[field]) { changed[field] = { from:c[field], to:String(body[field]).slice(0,200) }; c[field] = String(body[field]).slice(0,200); }
    if (body.userFacingNote) { c.userFacingNote = String(body.userFacingNote).slice(0,2500); c.moreInfoRequestedAt = store.now(); changed.userFacingNote = { to: '[updated]' }; }
    if (/ready|generated/i.test(String(c.formDraftStatus || ''))) c.draftPackageReady = true;
    if (/more information|waiting for user/i.test(String(c.status || '') + ' ' + String(c.userActionNeeded || ''))) notification('more_information_needed', { caseId:c.id, email:c.email || '', message:c.userFacingNote || c.userActionNeeded || '' });
    if (!Array.isArray(c.staffNotes)) c.staffNotes = [];
    if (body.staffNote) c.staffNotes.push({ at: store.now(), note: String(body.staffNote).slice(0,2000) });
    c.updatedAt = store.now(); store.upsertCase(c);
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
  store.init().then(() => {
    server.listen(port, () => console.log(`Smarter Justice v${VERSION} listening on ${port}`));
  }).catch(err => {
    console.error('Storage initialization failed', err);
    process.exit(1);
  });
}
module.exports = server;
