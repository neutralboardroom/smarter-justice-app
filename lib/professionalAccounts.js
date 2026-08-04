const crypto = require('crypto');
const store = require('./store');
const marketplace = require('./professionalMarketplace');
const mailer = require('./mailer');
const security = require('./accountSecurity');
const {getInitialLaunchPilot,portalIdForInterest} = require('../data/initialLaunchPilots');
const portalPresence = require('./portalPresenceManagement');

const STORE_KEY = 'professionalAccounts.json';
const SESSION_COOKIE = 'sj_professional_session';
const SESSION_DAYS = Number(process.env.PROFESSIONAL_SESSION_DAYS || 14);
const PASSWORD_MIN_LENGTH = 12;
const NY_ATTORNEY_SOURCE_URL = 'https://data.ny.gov/Transparency/NYS-Attorney-Registrations/eqw2-r5nb';

function clean(value, max = 500) { return String(value == null ? '' : value).trim().slice(0, max); }
function email(value) { const raw = clean(value, 220).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : ''; }
function now() { return store.now(); }
function initialState() { return { schemaVersion:'1.7.0', accounts:[], sessions:[], passwordResetRequests:[], emailVerificationRequests:[], updatedAt:'' }; }
function normalizeCommunicationPreferences(input = {}, current = {}) {
  const preferredLanguage = ['en','es'].includes(input.preferredLanguage) ? input.preferredLanguage : (['en','es'].includes(current.preferredLanguage) ? current.preferredLanguage : 'en');
  const optional = (key, fallback) => Object.prototype.hasOwnProperty.call(input, key) ? Boolean(input[key]) : (Object.prototype.hasOwnProperty.call(current, key) ? Boolean(current[key]) : fallback);
  return {
    preferredLanguage,
    essentialNotices:true,
    profileAndDirectoryUpdates:optional('profileAndDirectoryUpdates', true),
    membershipAndProgramUpdates:optional('membershipAndProgramUpdates', true),
    researchAndFeedbackInvitations:optional('researchAndFeedbackInvitations', false),
    updatedAt:input.updatedAt || current.updatedAt || ''
  };
}
function normalizeAccount(account = {}) {
  return {
    ...account,
    professionalIds:Array.isArray(account.professionalIds) ? account.professionalIds : [],
    firmIds:Array.isArray(account.firmIds) ? account.firmIds : [],
    pendingClaimProfessionalIds:Array.isArray(account.pendingClaimProfessionalIds) ? account.pendingClaimProfessionalIds : [],
    pendingClaimFirmIds:Array.isArray(account.pendingClaimFirmIds) ? account.pendingClaimFirmIds : [],
    emailVerifiedAt:account.emailVerifiedAt || (account.status === 'active' ? (account.createdAt || '') : ''),
    communicationPreferences:normalizeCommunicationPreferences(account.communicationPreferences || {}),
    entryContext:account.entryContext&&typeof account.entryContext==='object'?account.entryContext:{intent:'',portalId:'',localProfileId:'',returnTo:''},
    mfa:{ enabled:Boolean(account.mfa?.enabled), secret:account.mfa?.secret || '', pendingSecret:account.mfa?.pendingSecret || '', recoveryCodeHashes:Array.isArray(account.mfa?.recoveryCodeHashes) ? account.mfa.recoveryCodeHashes : [], enabledAt:account.mfa?.enabledAt || '' }
  };
}
function readState() {
  const raw = store.readJson(STORE_KEY, initialState());
  return {
    ...initialState(),
    ...(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}),
    accounts:Array.isArray(raw?.accounts) ? raw.accounts.map(normalizeAccount) : [],
    sessions:Array.isArray(raw?.sessions) ? raw.sessions : [],
    passwordResetRequests:Array.isArray(raw?.passwordResetRequests) ? raw.passwordResetRequests : [],
    emailVerificationRequests:Array.isArray(raw?.emailVerificationRequests) ? raw.emailVerificationRequests : []
  };
}
function writeState(state) { const next = { ...state, schemaVersion:'1.7.0', updatedAt:now() }; store.writeJson(STORE_KEY, next); return next; }
function base64url(buffer) { return Buffer.from(buffer).toString('base64url'); }
function hashToken(token) { return crypto.createHash('sha256').update(String(token || '')).digest('hex'); }
function hashPassword(password, salt = crypto.randomBytes(16)) { const derived = crypto.scryptSync(String(password), salt, 64, { N:16384, r:8, p:1 }); return { salt:base64url(salt), hash:base64url(derived) }; }
function verifyPassword(password, account) {
  try {
    const salt = Buffer.from(account.passwordSalt, 'base64url');
    const expected = Buffer.from(account.passwordHash, 'base64url');
    const actual = crypto.scryptSync(String(password), salt, expected.length, { N:16384, r:8, p:1 });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch { return false; }
}
function parseCookies(req) {
  const result = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) result[decodeURIComponent(part.slice(0, i).trim())] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return result;
}
function sessionCookie(token, clear = false) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
  const maxAge = clear ? 0 : SESSION_DAYS * 86400;
  return `${SESSION_COOKIE}=${clear ? '' : encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
function publicAccount(account) {
  const normalized = normalizeAccount(account);
  return {
    id:normalized.id, email:normalized.email, displayName:normalized.displayName, accountType:normalized.accountType,
    status:normalized.status, professionalIds:normalized.professionalIds, firmIds:normalized.firmIds,
    pendingClaimProfessionalIds:normalized.pendingClaimProfessionalIds, pendingClaimFirmIds:normalized.pendingClaimFirmIds,
    createdAt:normalized.createdAt, lastLoginAt:normalized.lastLoginAt || '', membershipTarget:normalized.membershipTarget || null, mfaEnabled:Boolean(normalized.mfa?.enabled),
    emailVerified:Boolean(normalized.emailVerifiedAt), emailVerifiedAt:normalized.emailVerifiedAt || '',
    communicationPreferences:normalizeCommunicationPreferences(normalized.communicationPreferences),
    entryContext:{...normalized.entryContext}
  };
}
function cleanupSessions(state) { const t = Date.now(); state.sessions = state.sessions.filter(x => Date.parse(x.expiresAt) > t); }
function issueSession(accountId) {
  const state = readState(); cleanupSessions(state);
  const token = store.secureToken('prosession'); const createdAt = now(); const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  state.sessions.push({ id:store.uid('prosession', 8), accountId, tokenHash:hashToken(token), createdAt, expiresAt, lastSeenAt:createdAt });
  writeState(state); return { token, expiresAt, cookie:sessionCookie(token) };
}
function accountFromRequest(req) {
  const token = parseCookies(req)[SESSION_COOKIE] || ''; if (!token) return null;
  const state = readState(); cleanupSessions(state); const session = state.sessions.find(x => x.tokenHash === hashToken(token));
  if (!session) { writeState(state); return null; }
  const account = state.accounts.find(x => x.id === session.accountId && x.status === 'active'); if (!account) return null;
  session.lastSeenAt = now(); writeState(state); return { account:publicAccount(account), rawAccount:account, session };
}
function officialAttorneySeedInput(input, address, displayName) {
  const registrationNumber = clean(input.registrationNumber || input.officialRegistrationNumber, 80);
  if (!registrationNumber) return {};
  return {
    seededFromPublicInfo:true,
    externalSourceId:`nys-attorney-registration:${registrationNumber}`,
    externalSourceIds:[`nys-attorney-registration:${registrationNumber}`],
    publicFacts:{ registrationNumber, directoryInclusion:'Official New York attorney registration dataset record selected during signup.' },
    sourceRecords:[{
      sourceType:'official attorney registration dataset', sourceName:'NYS Attorney Registrations', sourceUrl:NY_ATTORNEY_SOURCE_URL,
      authorityLevel:'primary', reviewStatus:'pending review', externalSourceId:registrationNumber,
      datasetId:'eqw2-r5nb', publisher:'New York State Unified Court System',
      factsSupported:['Attorney name','New York registration number','Public registration record selected during signup'],
      termsOrUseNotes:'Imported only from official public data. Credential and identity verification remain required before profile claim or marketplace eligibility.',
      notes:`Signup selected official registration record ${registrationNumber} for ${displayName || address}.`
    }],
    credentials:[{
      credentialType:'New York attorney registration', jurisdiction:'New York', identifier:registrationNumber,
      status:'pending', verificationSource:NY_ATTORNEY_SOURCE_URL,
      notes:'Official record selected during signup. Owner verification is required before the credential may be marked active.'
    }]
  };
}
async function createAccount(input = {}) {
  const state = readState(); const address = email(input.email); const password = String(input.password || '');
  const displayName = clean(input.displayName || input.contactName, 180); const accountType = ['individual','firm'].includes(input.accountType) ? input.accountType : 'individual';
  if (!address) return { error:'Add a valid professional email address.' };
  if (password.length < PASSWORD_MIN_LENGTH) return { error:`Use a password with at least ${PASSWORD_MIN_LENGTH} characters.` };
  if (displayName.length < 2) return { error:'Add your name or firm contact name.' };
  if (state.accounts.some(x => x.email === address)) return { error:'An account with that email address already exists.' };
  const pw = hashPassword(password);
  const account = normalizeAccount({
    id:store.uid('proacct',10), email:address, passwordSalt:pw.salt, passwordHash:pw.hash, displayName, accountType, status:'pending-email-verification', emailVerifiedAt:'',
    professionalIds:[], firmIds:[], pendingClaimProfessionalIds:[], pendingClaimFirmIds:[], membershipTarget:null, createdAt:now(), updatedAt:now(), lastLoginAt:now(),
    termsAcceptedAt:input.acceptTerms ? now() : '', privacyAcceptedAt:input.acceptPrivacy ? now() : '', sourceCampaignCode:clean(input.campaignCode,80), requestedClaimProfessionalId:'', requestedClaimFirmId:'', requestedMembershipStart:Boolean(input.startMembership), requestedBillingCadence:['monthly','annual'].includes(input.billingCadence) ? input.billingCadence : 'monthly', pendingProfessionalDraft:null, pendingFirmDraft:null,
    entryContext:(()=>{ const requestedPortal=clean(input.entryPortalId||input.portal,100); const pilot=getInitialLaunchPilot(requestedPortal); const intent=['claim','create'].includes(clean(input.entryIntent,40))?clean(input.entryIntent,40):(clean(input.claimProfessionalId||input.claimFirmId,180)?'claim':'create'); const returnTo=clean(input.returnTo,500); return {intent,portalId:pilot?pilot.portalId:'',localProfileId:clean(input.entryProfileId,180),returnTo:/^https:\/\/[a-z0-9.-]+\/?/i.test(returnTo)?returnTo:'',receivedAt:now()}; })(),
    communicationPreferences:normalizeCommunicationPreferences({ preferredLanguage:input.preferredLanguage || 'en' })
  });
  if (!account.termsAcceptedAt || !account.privacyAcceptedAt) return { error:'Accept the professional membership terms and privacy notice to create an account.' };
  if (accountType === 'firm') {
    const requestedFirmId=clean(input.claimFirmId,180);
    if (!requestedFirmId && clean(input.firmName,180).length < 2) return { error:'Add the firm name before creating a firm account.' };
    if (requestedFirmId) {
      const requestedFirm=marketplace.getOwnerData().firms.find(x=>x.id===requestedFirmId || x.publicProfileSlug===requestedFirmId);
      if (!requestedFirm) return { error:'The firm profile you selected could not be found. Return to the directory and try again.' };
      account.requestedClaimFirmId = requestedFirm.id;
    }
    if (!requestedFirmId) {
      account.pendingFirmDraft = {
        name:clean(input.firmName || displayName,180), email:address, phone:clean(input.phone,80), website:clean(input.website,500),
        locations:input.officeLocation ? [clean(input.officeLocation,500)] : [], jurisdictions:Array.isArray(input.jurisdictions) ? input.jurisdictions : ['New York'],
        practiceAreas:Array.isArray(input.practiceAreas) ? input.practiceAreas : [], languages:Array.isArray(input.languages) ? input.languages : [], serviceRegions:Array.isArray(input.serviceRegions) ? input.serviceRegions : [],
        portalEligibility:Array.isArray(input.portalEligibility) ? input.portalEligibility.map(id=>portalIdForInterest(id)?id:(getInitialLaunchPilot(id)?.centralInterestId||id)) : ['general-smarter-justice-start'], seatCount:Math.max(1,Math.min(500,Number(input.seatCount || 2)||2)),
        billingAdministratorName:displayName, billingAdministratorEmail:address, outreachCampaignId:clean(input.campaignCode,80), sourceOrigin:'professional-self-entry', dataAuthority:'professional-supplied', portalPublicationState:'not distributed'
      };
    }
  } else {
    const requestedProfessionalId=clean(input.claimProfessionalId,180);
    if (requestedProfessionalId) {
      const requestedProfessional=marketplace.getOwnerData().professionals.find(x=>x.id===requestedProfessionalId || x.publicProfileSlug===requestedProfessionalId);
      if (!requestedProfessional) return { error:'The professional profile you selected could not be found. Return to the directory and try again.' };
      account.requestedClaimProfessionalId = requestedProfessional.id;
    } else {
      account.pendingProfessionalDraft = {
        officialSeed:officialAttorneySeedInput(input, address, displayName), displayName, firstName:clean(input.firstName,120), lastName:clean(input.lastName,120),
        professionalType:clean(input.professionalType || 'attorney',80), email:address, phone:clean(input.phone,80), website:clean(input.website,500),
        officeLocations:input.officeLocation ? [clean(input.officeLocation,500)] : [], jurisdictions:Array.isArray(input.jurisdictions) ? input.jurisdictions : ['New York'],
        practiceAreas:Array.isArray(input.practiceAreas) ? input.practiceAreas : [], serviceRoles:Array.isArray(input.serviceRoles) ? input.serviceRoles : [], languages:Array.isArray(input.languages) ? input.languages : [], serviceRegions:Array.isArray(input.serviceRegions) ? input.serviceRegions : [],
        consultationModes:Array.isArray(input.consultationModes) ? input.consultationModes : [], availabilityStatus:clean(input.availabilityStatus || 'not set',80),
        portalEligibility:Array.isArray(input.portalEligibility) ? input.portalEligibility.map(id=>portalIdForInterest(id)?id:(getInitialLaunchPilot(id)?.centralInterestId||id)) : ['general-smarter-justice-start'], credentials:professionalSuppliedCredentials(input),
        outreachCampaignId:clean(input.campaignCode,80), sourceOrigin:'professional-self-entry', dataAuthority:'professional-supplied', portalPublicationState:'not distributed'
      };
    }
  }
  state.accounts.push(account); writeState(state);
  await store.flush();
  store.addAudit({ actor:'professional-account', action:'professional_account_created', details:{ accountId:account.id, accountType, emailDomain:address.split('@')[1] || '', campaignCode:account.sourceCampaignCode, emailVerificationRequired:true } });
  const verification = await createEmailVerificationRequest(account.id);
  await store.flush();
  return { account:publicAccount(account), verification, message:'Your account was created. Verify your email address before signing in or requesting profile control.' };
}

async function createEmailVerificationRequest(accountId) {
  const state = readState();
  const account = state.accounts.find(item => item.id === accountId);
  if (!account) return { accepted:true };
  if (account.emailVerifiedAt && account.status === 'active') return { accepted:true, alreadyVerified:true };
  state.emailVerificationRequests = state.emailVerificationRequests.filter(item => Date.parse(item.expiresAt) > Date.now() && !item.usedAt && item.accountId !== account.id);
  const token = store.secureToken('proverify');
  const createdAt = now();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  state.emailVerificationRequests.push({ id:store.uid('proverify',8), accountId:account.id, tokenHash:hashToken(token), createdAt, expiresAt, usedAt:'' });
  writeState(state);
  await store.flush();
  const base = String(process.env.APP_BASE_URL || '').replace(/\/$/,'');
  const verificationLink = `${base || 'http://localhost:3000'}/professional-login.html#verify_token=${encodeURIComponent(token)}`;
  let delivery = { sent:false, reason:'delivery-error' };
  try {
    delivery = await mailer.sendNotification({ kind:'professional_email_verification', to:account.email, payload:{ message:'Verify your professional account email address before signing in or requesting profile control.', actionLabel:'Verify professional email', actionLink:verificationLink } });
  } catch (error) { delivery = { sent:false, reason:clean(error.message || 'delivery-error',120) }; }
  store.addAudit({ actor:'professional-account', action:'professional_email_verification_requested', details:{ accountId:account.id, delivery:delivery.sent ? 'sent' : clean(delivery.reason || 'not-sent',80) } });
  await store.flush();
  return { accepted:true, sent:Boolean(delivery.sent), deliveryReason:delivery.sent ? '' : clean(delivery.reason || 'not-sent',120), ...(process.env.NODE_ENV === 'test' ? { testToken:token } : {}) };
}
async function requestEmailVerification(addressValue) {
  const state = readState();
  const address = email(addressValue);
  const account = state.accounts.find(item => item.email === address);
  if (!account || account.emailVerifiedAt) return { accepted:true };
  return createEmailVerificationRequest(account.id);
}
async function verifyEmail(tokenValue) {
  const state = readState();
  const tokenHash = hashToken(String(tokenValue || ''));
  const request = state.emailVerificationRequests.find(item => item.tokenHash === tokenHash && !item.usedAt && Date.parse(item.expiresAt) > Date.now());
  if (!request) return { error:'This email-verification link is invalid or expired.' };
  const account = state.accounts.find(item => item.id === request.accountId);
  if (!account) return { error:'This professional account could not be found.' };
  if (account.pendingFirmDraft) {
    const draft = account.pendingFirmDraft;
    const created = marketplace.createFirm(draft, 'verified-professional-signup');
    if (created.error) return { error:created.error };
    marketplace.updateFirm(created.firm.id,{claimStatus:'claimed',profileStatus:'private draft',ownerApprovalStatus:'pending',publicProfileEnabled:false,sourceOrigin:'professional-self-entry',dataAuthority:'professional-supplied',portalPublicationState:'not distributed'},'verified-professional-signup');
    account.firmIds = [created.firm.id];
    account.membershipTarget = { kind:'firm', id:created.firm.id, planId:'nyc-founding-firm', seatCount:created.firm.seatCount || 2 };
    account.pendingFirmDraft = null;
  }
  if (account.pendingProfessionalDraft) {
    const draft = account.pendingProfessionalDraft;
    const officialSeed = draft.officialSeed || {};
    const created = marketplace.createProfessional({ ...officialSeed, ...draft, officialSeed:undefined }, 'verified-professional-signup');
    if (created.error) return { error:created.error };
    marketplace.updateProfessional(created.professional.id,{claimStatus:'claimed',profileStatus:'private draft',ownerApprovalStatus:'pending',publicProfileEnabled:false,sourceOrigin:officialSeed.seededFromPublicInfo?'official-record-selected-during-signup':'professional-self-entry',dataAuthority:officialSeed.seededFromPublicInfo?'source-supported-and-professional-supplied':'professional-supplied',portalPublicationState:'not distributed'},'verified-professional-signup');
    account.professionalIds = [created.professional.id];
    account.membershipTarget = { kind:'professional', id:created.professional.id, planId:'nyc-founding-professional', seatCount:1 };
    if (officialSeed.seededFromPublicInfo) {
      marketplace.updateProfessional(created.professional.id, {
        profileStatus:'claim pending', claimStatus:'verification pending', publicProfileEnabled:false,
        ownerApprovalStatus:'pending', verificationStatus:'in progress'
      }, 'verified-professional-signup');
    }
    account.pendingProfessionalDraft = null;
  }
  const verifiedAt = now();
  request.usedAt = verifiedAt;
  account.emailVerifiedAt = verifiedAt;
  account.status = 'active';
  account.updatedAt = verifiedAt;
  state.emailVerificationRequests = state.emailVerificationRequests.filter(item => item.accountId !== account.id || item.id === request.id);
  const requestedProfessionalId = account.requestedClaimProfessionalId || '';
  const requestedFirmId = account.requestedClaimFirmId || '';
  account.requestedClaimProfessionalId = '';
  account.requestedClaimFirmId = '';
  writeState(state);
  const claimResults = {};
  if (requestedProfessionalId) claimResults.professionalClaim = attachClaim(account.id, requestedProfessionalId);
  if (requestedFirmId) claimResults.firmClaim = attachFirmClaim(account.id, requestedFirmId);
  const session = issueSession(account.id);
  store.addAudit({ actor:'professional-account', action:'professional_email_verified', details:{ accountId:account.id, deferredProfessionalClaim:Boolean(requestedProfessionalId), deferredFirmClaim:Boolean(requestedFirmId) } });
  await store.flush();
  return { account:getAccountById(account.id), session, ...claimResults };
}

function validateSecondFactor(account, input = {}) {
  if (!account.mfa?.enabled) return { ok:true, method:'not-enabled' };
  const code = String(input.code || input.mfaCode || '').trim();
  if (security.verifyTotp(account.mfa.secret, code)) return { ok:true, method:'totp' };
  const recovery = security.consumeRecoveryCode(code, account.mfa.recoveryCodeHashes || []);
  if (recovery.valid) { account.mfa.recoveryCodeHashes = recovery.remaining; return { ok:true, method:'recovery' }; }
  return { ok:false, error:'Enter a current authenticator code or an unused recovery code.', mfaRequired:true };
}
function login(input = {}) {
  const state = readState(); const address = email(input.email); const account = state.accounts.find(x => x.email === address);
  if (!account || !verifyPassword(input.password, account)) return { error:'Email or password was not recognized.' };
  if (!account.emailVerifiedAt || account.status === 'pending-email-verification') return { error:'Verify your email address before signing in.', emailVerificationRequired:true };
  if (account.status !== 'active') return { error:'This professional account is not active.' };
  const secondFactor = validateSecondFactor(account, input); if (!secondFactor.ok) { writeState(state); return secondFactor; }
  account.lastLoginAt = now(); account.updatedAt = now(); writeState(state);
  store.addAudit({ actor:'professional-account', action:'professional_account_login', details:{ accountId:account.id, secondFactor:secondFactor.method } });
  return { account:publicAccount(account), session:issueSession(account.id) };
}
function logout(req) {
  const token = parseCookies(req)[SESSION_COOKIE] || ''; const state = readState();
  if (token) state.sessions = state.sessions.filter(x => x.tokenHash !== hashToken(token)); writeState(state);
  return { cookie:sessionCookie('', true) };
}

async function requestPasswordReset(addressValue) {
  const state = readState(); const address = email(addressValue); const account = state.accounts.find(x => x.email === address && x.status === 'active');
  state.passwordResetRequests = state.passwordResetRequests.filter(x => Date.parse(x.expiresAt) > Date.now() && !x.usedAt);
  if (!account) { writeState(state); return { accepted:true }; }
  state.passwordResetRequests = state.passwordResetRequests.filter(x => x.accountId !== account.id);
  const token = store.secureToken('proreset'); const createdAt = now(); const expiresAt = new Date(Date.now() + 30 * 60000).toISOString();
  state.passwordResetRequests.push({ id:store.uid('proreset',8), accountId:account.id, tokenHash:hashToken(token), createdAt, expiresAt, usedAt:'' }); writeState(state);
  const resetLink = `${String(process.env.APP_BASE_URL || '').replace(/\/$/,'')}/professional-login.html#reset_token=${encodeURIComponent(token)}`;
  let delivery = { sent:false, reason:'delivery-error' };
  try {
    delivery = await mailer.sendNotification({ kind:'professional_password_reset', to:account.email, payload:{ message:'A password reset was requested for your professional account.', actionLabel:'Reset professional password', actionLink:resetLink } });
  } catch {}
  store.addAudit({ actor:'professional-account', action:'professional_password_reset_requested', details:{ accountId:account.id, delivery:delivery.sent ? 'sent' : clean(delivery.reason || 'not-sent',80) } });
  return { accepted:true, ...(process.env.NODE_ENV === 'test' ? { testToken:token } : {}) };
}
function resetPassword(tokenValue, password) {
  const state = readState(); const tokenHash = hashToken(String(tokenValue || '')); const request = state.passwordResetRequests.find(x => x.tokenHash === tokenHash && !x.usedAt && Date.parse(x.expiresAt) > Date.now());
  if (!request) return { error:'This password-reset link is invalid or expired.' };
  if (String(password || '').length < PASSWORD_MIN_LENGTH) return { error:`Use a password with at least ${PASSWORD_MIN_LENGTH} characters.` };
  const account = state.accounts.find(x => x.id === request.accountId && x.status === 'active'); if (!account) return { error:'This professional account is not active.' };
  const pw = hashPassword(password); account.passwordSalt = pw.salt; account.passwordHash = pw.hash; account.updatedAt = now(); for (const item of state.passwordResetRequests) if (item.accountId === account.id) item.usedAt = now(); state.sessions = state.sessions.filter(x => x.accountId !== account.id); writeState(state);
  store.addAudit({ actor:'professional-account', action:'professional_password_reset_completed', details:{ accountId:account.id } }); return { account:publicAccount(account) };
}
function beginMfa(req) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id); const secret = security.generateTotpSecret(); account.mfa.pendingSecret = secret; account.updatedAt = now(); writeState(state);
  return { secret, otpAuthUri:security.otpAuthUri({issuer:'Smarter Justice',label:account.email,secret}), account:publicAccount(account) };
}
function confirmMfa(req, code) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id); const secret = account.mfa?.pendingSecret || '';
  if (!secret || !security.verifyTotp(secret,code)) return { error:'The authenticator code could not be verified.' };
  const recoveryCodes = security.generateRecoveryCodes(10); account.mfa = {enabled:true,secret,pendingSecret:'',recoveryCodeHashes:security.hashRecoveryCodes(recoveryCodes),enabledAt:now()}; account.updatedAt=now(); state.sessions=state.sessions.filter(x=>x.accountId!==account.id || x.id===auth.session.id); writeState(state);
  store.addAudit({ actor:'professional-account', action:'professional_mfa_enabled', details:{ accountId:account.id } }); return { account:publicAccount(account), recoveryCodes };
}
function disableMfa(req, input = {}) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id);
  if (!verifyPassword(String(input.password || ''),account)) return { error:'Enter your current password.' };
  if (account.mfa?.enabled && !security.verifyTotp(account.mfa.secret,input.code)) return { error:'Enter a current authenticator code.' };
  account.mfa={enabled:false,secret:'',pendingSecret:'',recoveryCodeHashes:[],enabledAt:''}; account.updatedAt=now(); writeState(state); store.addAudit({actor:'professional-account',action:'professional_mfa_disabled',details:{accountId:account.id}}); return {account:publicAccount(account)};
}
function revokeOtherSessions(req) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); state.sessions = state.sessions.filter(x => x.id === auth.session.id); writeState(state); store.addAudit({actor:'professional-account',action:'professional_other_sessions_revoked',details:{accountId:auth.account.id}}); return {revoked:true};
}

function attachClaim(accountId, professionalId) {
  const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return { error:'Professional account not found.' };
  const owner = marketplace.getOwnerData(); const pro = owner.professionals.find(x => x.id === professionalId || x.publicProfileSlug === professionalId);
  if (!pro) return { error:'Professional profile not found.' };
  if ((account.professionalIds || []).includes(pro.id)) return { account:publicAccount(account), alreadyLinked:true };
  if ((account.pendingClaimProfessionalIds || []).includes(pro.id)) return { account:publicAccount(account), alreadyPending:true };
  const duplicateOwner = state.accounts.find(x => x.id !== account.id && (x.professionalIds || []).includes(pro.id));
  if (duplicateOwner) return { error:'That profile is already connected to another professional account.' };
  const duplicatePending = state.accounts.find(x => x.id !== account.id && (x.pendingClaimProfessionalIds || []).includes(pro.id));
  if (duplicatePending) return { error:'A claim request for that profile is already under review.' };
  const request = marketplace.createProfileRequest({
    profileId:pro.id, requestType:'claim', requesterName:account.displayName, requesterEmail:account.email,
    requesterRelationship:'Professional account holder requesting profile control',
    details:'Professional account requests control of this public profile. Identity, authority, and credential review are required before account control is granted.',
    evidenceUrls:[]
  }, 'professional-account');
  if (request.error) return request;
  account.pendingClaimProfessionalIds = [...(account.pendingClaimProfessionalIds || []), pro.id]; account.updatedAt = now(); writeState(state);
  store.addAudit({ actor:'professional-account', action:'public_profile_claim_requested', details:{ accountId:account.id, professionalId:pro.id, profileRequestId:request.request.id } });
  return { account:publicAccount(account), profileRequest:request.request };
}
function attachFirmClaim(accountId, firmId) {
  const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return { error:'Professional account not found.' };
  const owner = marketplace.getOwnerData(); const firm = owner.firms.find(x => x.id === firmId || x.publicProfileSlug === firmId);
  if (!firm) return { error:'Firm profile not found.' };
  if ((account.firmIds || []).includes(firm.id)) return { account:publicAccount(account), alreadyLinked:true };
  if ((account.pendingClaimFirmIds || []).includes(firm.id)) return { account:publicAccount(account), alreadyPending:true };
  const duplicateOwner = state.accounts.find(x => x.id !== account.id && (x.firmIds || []).includes(firm.id));
  if (duplicateOwner) return { error:'That firm profile is already connected to another account.' };
  const duplicatePending = state.accounts.find(x => x.id !== account.id && (x.pendingClaimFirmIds || []).includes(firm.id));
  if (duplicatePending) return { error:'A claim request for that firm profile is already under review.' };
  const request = marketplace.createProfileRequest({
    profileId:firm.id, requestType:'claim', requesterName:account.displayName, requesterEmail:account.email,
    requesterRelationship:'Firm account holder requesting firm profile control',
    details:'A firm account requests control of this public firm profile. Identity and authority review are required before account control is granted.',
    evidenceUrls:[]
  }, 'professional-account');
  if (request.error) return request;
  account.pendingClaimFirmIds = [...(account.pendingClaimFirmIds || []), firm.id]; account.updatedAt = now(); writeState(state);
  store.addAudit({ actor:'professional-account', action:'public_firm_profile_claim_requested', details:{ accountId:account.id, firmId:firm.id, profileRequestId:request.request.id } });
  return { account:publicAccount(account), profileRequest:request.request };
}
function ownerApproveFirmClaim(accountId, firmId, profileRequestId = '') {
  const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return { error:'Professional account not found.' };
  const owner = marketplace.getOwnerData(); const firm = owner.firms.find(x => x.id === firmId || x.publicProfileSlug === firmId); if (!firm) return { error:'Firm profile not found.' };
  const otherOwner = state.accounts.find(x => x.id !== account.id && (x.firmIds || []).includes(firm.id)); if (otherOwner) return { error:'That firm profile is already connected to another account.' };
  const pendingForAccount = (account.pendingClaimFirmIds || []).includes(firm.id);
  if (!pendingForAccount && !(account.firmIds || []).includes(firm.id)) return { error:'That firm profile is not pending approval for this account.' };
  if (profileRequestId) {
    const request = owner.profileRequests.find(x => x.id === profileRequestId);
    if (!request || request.profileId !== firm.id || request.requesterEmail !== account.email || request.requestType !== 'claim') return { error:'The selected firm claim request does not match this account and profile.' };
  }
  account.pendingClaimFirmIds = (account.pendingClaimFirmIds || []).filter(x => x !== firm.id);
  if (!(account.firmIds || []).includes(firm.id)) account.firmIds.push(firm.id);
  account.membershipTarget = { kind:'firm', id:firm.id, planId:'nyc-founding-firm', seatCount:firm.seatCount || 2 }; account.updatedAt = now(); writeState(state);
  marketplace.updateFirm(firm.id, { claimStatus:'claimed', profileStatus:firm.verificationStatus === 'verified' ? 'verified' : 'claimed' }, 'owner-firm-claim-approval');
  if (profileRequestId) marketplace.updateProfileRequest(profileRequestId, { status:'approved', resolutionNotes:'Owner approved account control of this firm profile. Membership, credential verification, and marketplace eligibility remain separate.' });
  store.addAudit({ actor:'owner-control-center', action:'firm_profile_account_link_approved', details:{ accountId:account.id, firmId:firm.id, profileRequestId } });
  return { account:publicAccount(account), firmId:firm.id };
}
function ownerApproveClaim(accountId, professionalId, profileRequestId = '') {
  const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return { error:'Professional account not found.' };
  const owner = marketplace.getOwnerData(); const pro = owner.professionals.find(x => x.id === professionalId || x.publicProfileSlug === professionalId); if (!pro) return { error:'Professional profile not found.' };
  const otherOwner = state.accounts.find(x => x.id !== account.id && (x.professionalIds || []).includes(pro.id)); if (otherOwner) return { error:'That profile is already connected to another professional account.' };
  const pendingForAccount = (account.pendingClaimProfessionalIds || []).includes(pro.id);
  if (!pendingForAccount && !(account.professionalIds || []).includes(pro.id)) return { error:'That profile is not pending approval for this professional account.' };
  if (profileRequestId) {
    const request = owner.profileRequests.find(x => x.id === profileRequestId);
    if (!request || request.profileId !== pro.id || request.requesterEmail !== account.email || request.requestType !== 'claim') return { error:'The selected profile claim request does not match this account and profile.' };
  }
  account.pendingClaimProfessionalIds = (account.pendingClaimProfessionalIds || []).filter(x => x !== pro.id);
  if (!(account.professionalIds || []).includes(pro.id)) account.professionalIds.push(pro.id);
  account.membershipTarget = { kind:'professional', id:pro.id, planId:'nyc-founding-professional', seatCount:1 }; account.updatedAt = now(); writeState(state);
  marketplace.updateProfessional(pro.id, { claimStatus:'claimed', profileStatus:pro.verificationStatus === 'verified' ? 'verified' : 'claimed' }, 'owner-claim-approval');
  if (profileRequestId) marketplace.updateProfileRequest(profileRequestId, { status:'approved', resolutionNotes:'Owner approved account control of this profile. Credential verification and marketplace eligibility remain separate.' });
  store.addAudit({ actor:'owner-control-center', action:'professional_profile_account_link_approved', details:{ accountId:account.id, professionalId:pro.id, profileRequestId } });
  return { account:publicAccount(account), professionalId:pro.id };
}
function dashboard(req) {
  const auth = accountFromRequest(req); if (!auth) return null; const owner = marketplace.getOwnerData();
  const professionals = owner.professionals.filter(x => (auth.rawAccount.professionalIds || []).includes(x.id));
  const pendingClaimProfiles = owner.professionals.filter(x => (auth.rawAccount.pendingClaimProfessionalIds || []).includes(x.id));
  const firms = owner.firms.filter(x => (auth.rawAccount.firmIds || []).includes(x.id));
  const pendingClaimFirms = owner.firms.filter(x => (auth.rawAccount.pendingClaimFirmIds || []).includes(x.id));
  const requests = owner.profileRequests.filter(x => x.requesterEmail === auth.rawAccount.email || professionals.some(p => p.id === x.profileId) || pendingClaimProfiles.some(p => p.id === x.profileId) || firms.some(f => f.id === x.profileId) || pendingClaimFirms.some(f => f.id === x.profileId));
  return { account:auth.account, professionals, pendingClaimProfiles, firms, pendingClaimFirms, profileRequests:requests, membershipPlans:owner.membershipPlans.filter(x => ['active','pilot'].includes(x.status)), firmVolumeDiscountTiers:owner.firmVolumeDiscountTiers, pilotControls:{ status:owner.pilotControls?.status || 'paused', ownerApprovalRequired:Boolean(owner.pilotControls?.ownerApprovalRequired) }, pilotCapacity:owner.pilotCapacity || {}, featureStatus:marketplace.publicFeatureStatus(), portalPresence:portalPresence.viewForAccount(auth.rawAccount) };
}
function updateProfessionalForAccount(req, professionalId, input) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  if (!(auth.rawAccount.professionalIds || []).includes(professionalId)) return { forbidden:true };
  const current=marketplace.getOwnerData().professionals.find(row=>row.id===professionalId); if(!current)return {error:'Professional profile not found.'};
  if (input.expectedRevision != null && Number(input.expectedRevision)!==Number(current.profileRevision||1)) return { conflict:true, error:'This profile changed in another session. Refresh before saving so newer information is not overwritten.', currentRevision:Number(current.profileRevision||1) };
  if (Object.prototype.hasOwnProperty.call(input,'displayName') && clean(input.displayName,180).length < 2) return { error:'Add the professional’s public display name.' };
  const proposedCredentials=professionalSuppliedCredentials(input,current.credentials||[]);
  const proposedIdentifiers=new Set(proposedCredentials.map(item=>clean(item.identifier,180).toLowerCase()).filter(Boolean));
  const credentialConflict=marketplace.getOwnerData().professionals.find(row=>row.id!==professionalId && (row.credentials||[]).some(item=>proposedIdentifiers.has(clean(item.identifier,180).toLowerCase())));
  if(credentialConflict) return { error:'That credential identifier is already connected to another professional record. Use the existing record or contact professional support for duplicate review.', duplicateProfessionalId:credentialConflict.id };
  const permitted = {
    displayName:input.displayName, firstName:input.firstName, lastName:input.lastName, email:auth.rawAccount.email,
    phone:input.phone, website:input.website, photoUrl:input.photoUrl, biography:input.biography, languages:input.languages,
    officeLocations:input.officeLocations, jurisdictions:input.jurisdictions, practiceAreas:input.practiceAreas, serviceRoles:input.serviceRoles,
    availabilityStatus:input.availabilityStatus, consultationModes:input.consultationModes, serviceRegions:input.serviceRegions, availabilityNote:input.availabilityNote,
    portalEligibility:input.portalEligibility, consultationServices:input.consultationServices,
    credentials:proposedCredentials, verificationStatus:proposedCredentials.some(item=>item.status==='active')?current.verificationStatus:'pending'
  };
  return marketplace.updateProfessional(professionalId, permitted, 'professional-account');
}
function updateFirmForAccount(req, firmId, input) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  if (!(auth.rawAccount.firmIds || []).includes(firmId)) return { forbidden:true };
  const current=marketplace.getOwnerData().firms.find(row=>row.id===firmId); if(!current)return {error:'Firm record not found.'};
  if (input.expectedRevision != null && Number(input.expectedRevision)!==Number(current.profileRevision||1)) return { conflict:true, error:'This firm workspace changed in another session. Refresh before saving so newer information is not overwritten.', currentRevision:Number(current.profileRevision||1) };
  if (Object.prototype.hasOwnProperty.call(input,'name') && clean(input.name,180).length < 2) return { error:'Add the firm name.' };
  const seatCount=Math.max(1,Math.min(500,Number(input.seatCount)||1));
  const permitted = {
    name:input.name, email:auth.rawAccount.email, phone:input.phone, website:input.website, locations:input.locations,
    jurisdictions:input.jurisdictions, practiceAreas:input.practiceAreas, languages:input.languages, serviceRegions:input.serviceRegions,
    portalEligibility:input.portalEligibility, seatCount,
    billingAdministratorName:input.billingAdministratorName, billingAdministratorEmail:auth.rawAccount.email
  };
  return marketplace.updateFirm(firmId, permitted, 'professional-account');
}
function addProfessionalToFirm(req, firmId, input = {}) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  if (!(auth.rawAccount.firmIds || []).includes(firmId)) return { forbidden:true };
  const owner = marketplace.getOwnerData(); const firm = owner.firms.find(x => x.id === firmId); if (!firm) return { error:'Firm record not found.' };
  const currentCount = owner.professionals.filter(x => x.firmId === firmId && !['archived'].includes(x.profileStatus)).length;
  if (currentCount >= Number(firm.seatCount || 1)) return { error:'Add or purchase another firm seat before adding another professional profile.' };
  const displayName = clean(input.displayName || [input.firstName,input.lastName].filter(Boolean).join(' '),180);
  if (displayName.length < 2) return { error:'Add the professional’s name.' };
  const created = marketplace.createProfessional({
    displayName, firstName:input.firstName, lastName:input.lastName, professionalType:input.professionalType || 'attorney',
    email:input.email, phone:input.phone, website:input.website, firmId,
    officeLocations:Array.isArray(input.officeLocations) ? input.officeLocations : (input.officeLocation ? [input.officeLocation] : firm.locations),
    jurisdictions:input.jurisdictions || firm.jurisdictions || ['New York'], practiceAreas:input.practiceAreas || [], serviceRoles:input.serviceRoles || [],
    portalEligibility:input.portalEligibility || firm.portalEligibility || ['general-smarter-justice-start'],
    outreachCampaignId:firm.outreachCampaignId || '',
    membership:{ coveredByFirmId:firmId, status:'none', planId:'', seatCount:1, foundingRate:Boolean(firm.membership?.foundingRate) }
  }, 'firm-professional-account');
  if (created.error) return created;
  if (!(auth.rawAccount.professionalIds || []).includes(created.professional.id)) {
    const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id);
    account.professionalIds = [...(account.professionalIds || []), created.professional.id]; account.updatedAt = now(); writeState(state);
  }
  store.addAudit({ actor:'professional-account', action:'firm_professional_profile_added', details:{ accountId:auth.account.id, firmId, professionalId:created.professional.id } });
  return { professional:created.professional, account:getAccountById(auth.account.id) };
}


function manualProfessionalInput(input = {}, account = {}, firm = null) {
  const displayName = clean(input.displayName || [input.firstName,input.lastName].filter(Boolean).join(' ') || account.displayName,180);
  return {
    displayName,
    firstName:clean(input.firstName,120),
    lastName:clean(input.lastName,120),
    professionalType:clean(input.professionalType || 'attorney',80),
    email:email(input.email) || account.email,
    phone:clean(input.phone,80),
    website:clean(input.website,500),
    photoUrl:clean(input.photoUrl,500),
    biography:clean(input.biography,8000),
    firmId:firm?.id || clean(input.firmId,180),
    officeLocations:Array.isArray(input.officeLocations) ? input.officeLocations : (input.officeLocation ? [clean(input.officeLocation,500)] : (firm?.locations || [])),
    jurisdictions:Array.isArray(input.jurisdictions) ? input.jurisdictions : (firm?.jurisdictions || ['New York']),
    practiceAreas:Array.isArray(input.practiceAreas) ? input.practiceAreas : [],
    serviceRoles:Array.isArray(input.serviceRoles) ? input.serviceRoles : [],
    languages:Array.isArray(input.languages) ? input.languages : [],
    serviceRegions:Array.isArray(input.serviceRegions) ? input.serviceRegions : [],
    consultationModes:Array.isArray(input.consultationModes) ? input.consultationModes : [],
    availabilityStatus:clean(input.availabilityStatus || 'not configured',80),
    availabilityNote:clean(input.availabilityNote,1200),
    portalEligibility:Array.isArray(input.portalEligibility) ? input.portalEligibility.map(id=>portalIdForInterest(id)?id:(getInitialLaunchPilot(id)?.centralInterestId||id)) : ['general-smarter-justice-start'],
    outreachCampaignId:clean(input.campaignCode || account.sourceCampaignCode,80),
    sourceOrigin:'professional-self-entry',
    dataAuthority:'professional-supplied',
    portalPublicationState:'not distributed',
    credentials:professionalSuppliedCredentials(input), reviewStatus:'draft', membership:{ coveredByFirmId:firm?.id || '', status:'none', planId:'nyc-founding-professional', seatCount:1, foundingRate:true }
  };
}

function credentialIdentity(item = {}) {
  return [clean(item.credentialType,180),clean(item.jurisdiction,140),clean(item.identifier,180)].map(value=>value.toLowerCase()).join('|');
}
function professionalSuppliedCredentials(input = {}, existing = []) {
  const source = Array.isArray(input.credentials) ? input.credentials : [];
  const compact = source.length ? source : (input.credentialType || input.credentialIdentifier || input.credentialJurisdiction ? [{credentialType:input.credentialType,jurisdiction:input.credentialJurisdiction,identifier:input.credentialIdentifier,verificationSource:input.credentialVerificationSource}] : []);
  return compact.slice(0,10).map((item,index)=>{
    const candidate={
      id:clean(item.id || existing[index]?.id,180),
      credentialType:clean(item.credentialType,180), jurisdiction:clean(item.jurisdiction,140), identifier:clean(item.identifier,180),
      verificationSource:clean(item.verificationSource,500), expirationDate:clean(item.expirationDate,80),
      notes:clean(item.notes || 'Professional supplied this credential for independent verification.',1200)
    };
    const prior=(candidate.id && existing.find(row=>clean(row.id,180)===candidate.id)) || existing.find(row=>credentialIdentity(row)===credentialIdentity(candidate)) || null;
    const unchanged=Boolean(prior && credentialIdentity(prior)===credentialIdentity(candidate));
    return {...candidate,status:unchanged && prior.status==='active'?'active':'pending',verifiedAt:unchanged && prior.status==='active'?(prior.verifiedAt||''):''};
  }).filter(item=>item.credentialType || item.jurisdiction || item.identifier);
}
function normalizedIdentity(value){ return clean(value,500).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
function createProfessionalForAccount(req, input = {}) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id); if (!account) return { unauthorized:true };
  const owned = account.professionalIds || [];
  if (owned.length >= 10) return { error:'This account already controls the maximum number of professional profile records. Contact professional support for additional profiles.' };
  const owner = marketplace.getOwnerData();
  const firmId = clean(input.firmId,180);
  const firm = firmId && (account.firmIds || []).includes(firmId) ? owner.firms.find(x => x.id === firmId) : null;
  if (firmId && !firm) return { error:'Select a firm workspace connected to this account.' };
  const candidate=manualProfessionalInput(input, account, firm);
  const duplicateOwned=owner.professionals.find(row=>owned.includes(row.id) && normalizedIdentity(row.displayName)===normalizedIdentity(candidate.displayName) && normalizedIdentity(row.firmId)===normalizedIdentity(candidate.firmId));
  if(duplicateOwned) return {error:'A matching professional profile is already connected to this account. Open and update the existing profile instead.',existingProfessionalId:duplicateOwned.id};
  const created = marketplace.createProfessional(candidate,'professional-self-entry');
  if (created.error) return created;
  marketplace.updateProfessional(created.professional.id,{claimStatus:'claimed',profileStatus:'private draft',ownerApprovalStatus:'pending',publicProfileEnabled:false,sourceOrigin:'professional-self-entry',dataAuthority:'professional-supplied',portalPublicationState:'not distributed'},'professional-self-entry');
  account.professionalIds = [...owned, created.professional.id];
  if (!account.membershipTarget) account.membershipTarget = {kind:'professional',id:created.professional.id,planId:'nyc-founding-professional',seatCount:1};
  account.updatedAt = now(); writeState(state);
  store.addAudit({actor:'professional-account',action:'manual_professional_profile_created',details:{accountId:account.id,professionalId:created.professional.id,firmId:firm?.id||'',publicProfileEnabled:false,portalPublicationState:'not distributed'}});
  return {professional:marketplace.getOwnerData().professionals.find(x=>x.id===created.professional.id),account:publicAccount(account),message:'Your private professional profile workspace was created. Complete the information, select relevant portals, and submit it for review. Payment and publication remain separate.'};
}

function createFirmForAccount(req, input = {}) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id); if (!account) return { unauthorized:true };
  if ((account.firmIds || []).length >= 10) return { error:'This account already controls the maximum number of firm workspaces. Contact professional support for additional organizations.' };
  const name = clean(input.name || input.firmName,180); if (name.length < 2) return { error:'Add the firm name.' };
  const owner=marketplace.getOwnerData(); const duplicateOwned=owner.firms.find(row=>(account.firmIds||[]).includes(row.id)&&normalizedIdentity(row.name)===normalizedIdentity(name)); if(duplicateOwned)return {error:'A matching firm workspace is already connected to this account. Open and update the existing firm instead.',existingFirmId:duplicateOwned.id};
  const created = marketplace.createFirm({
    name,email:account.email,phone:clean(input.phone,80),website:clean(input.website,500),
    locations:Array.isArray(input.locations)?input.locations:(input.officeLocation?[clean(input.officeLocation,500)]:[]),
    jurisdictions:Array.isArray(input.jurisdictions)?input.jurisdictions:['New York'],
    practiceAreas:Array.isArray(input.practiceAreas)?input.practiceAreas:[],languages:Array.isArray(input.languages)?input.languages:[],
    serviceRegions:Array.isArray(input.serviceRegions)?input.serviceRegions:[],portalEligibility:Array.isArray(input.portalEligibility)?input.portalEligibility:['general-smarter-justice-start'],
    seatCount:Math.max(1,Math.min(500,Number(input.seatCount||1)||1)),billingAdministratorName:account.displayName,billingAdministratorEmail:account.email,
    outreachCampaignId:clean(input.campaignCode || account.sourceCampaignCode,80),sourceOrigin:'professional-self-entry',dataAuthority:'professional-supplied',portalPublicationState:'not distributed'
  },'professional-self-entry');
  if (created.error) return created;
  marketplace.updateFirm(created.firm.id,{claimStatus:'claimed',profileStatus:'private draft',ownerApprovalStatus:'pending',publicProfileEnabled:false,sourceOrigin:'professional-self-entry',dataAuthority:'professional-supplied',portalPublicationState:'not distributed'},'professional-self-entry');
  account.firmIds = [...(account.firmIds||[]),created.firm.id];
  if (!account.membershipTarget) account.membershipTarget = {kind:'firm',id:created.firm.id,planId:'nyc-founding-firm',seatCount:created.firm.seatCount||1};
  account.updatedAt=now(); writeState(state);
  store.addAudit({actor:'professional-account',action:'manual_firm_workspace_created',details:{accountId:account.id,firmId:created.firm.id,publicProfileEnabled:false,portalPublicationState:'not distributed'}});
  return {firm:marketplace.getOwnerData().firms.find(x=>x.id===created.firm.id),account:publicAccount(account),message:'Your private firm workspace was created. Add offices and professionals, then submit the relevant profiles for review. Payment and publication remain separate.'};
}

function ownerCreateProfileForAccount(input = {}) {
  const state = readState(); const accountId=clean(input.accountId,180); const address=email(input.accountEmail || input.email);
  const account=state.accounts.find(x => x.id===accountId || (address && x.email===address));
  if (!account) return { error:'A matching professional account was not found. Create the marketplace record without an account, or ask the attorney to create an account first.' };
  const kind=String(input.kind||'professional').toLowerCase();
  if (kind==='firm') {
    const created=marketplace.createFirm({name:input.name||input.firmName,email:account.email,phone:input.phone,website:input.website,locations:input.locations,jurisdictions:input.jurisdictions,practiceAreas:input.practiceAreas,languages:input.languages,serviceRegions:input.serviceRegions,portalEligibility:input.portalEligibility,seatCount:input.seatCount,billingAdministratorName:account.displayName,billingAdministratorEmail:account.email,sourceOrigin:'owner-assisted-entry',dataAuthority:'professional-supplied-with-owner-assistance',portalPublicationState:'not distributed'},'owner-assisted-entry');
    if(created.error)return created;
    marketplace.updateFirm(created.firm.id,{claimStatus:'claimed',profileStatus:'private draft',ownerApprovalStatus:'pending',publicProfileEnabled:false,sourceOrigin:'owner-assisted-entry',dataAuthority:'professional-supplied-with-owner-assistance',portalPublicationState:'not distributed'},'owner-assisted-entry');
    account.firmIds=[...(account.firmIds||[]),created.firm.id]; if(!account.membershipTarget)account.membershipTarget={kind:'firm',id:created.firm.id,planId:'nyc-founding-firm',seatCount:created.firm.seatCount||1}; account.updatedAt=now();writeState(state);
    return {account:publicAccount(account),firm:marketplace.getOwnerData().firms.find(x=>x.id===created.firm.id)};
  }
  const created=marketplace.createProfessional({...manualProfessionalInput(input,account,null),sourceOrigin:'owner-assisted-entry',dataAuthority:'professional-supplied-with-owner-assistance'},'owner-assisted-entry');
  if(created.error)return created;
  marketplace.updateProfessional(created.professional.id,{claimStatus:'claimed',profileStatus:'private draft',ownerApprovalStatus:'pending',publicProfileEnabled:false,sourceOrigin:'owner-assisted-entry',dataAuthority:'professional-supplied-with-owner-assistance',portalPublicationState:'not distributed'},'owner-assisted-entry');
  account.professionalIds=[...(account.professionalIds||[]),created.professional.id]; if(!account.membershipTarget)account.membershipTarget={kind:'professional',id:created.professional.id,planId:'nyc-founding-professional',seatCount:1}; account.updatedAt=now();writeState(state);
  return {account:publicAccount(account),professional:marketplace.getOwnerData().professionals.find(x=>x.id===created.professional.id)};
}

function submitProfessionalProfileForReview(req, professionalId) {
  const auth=accountFromRequest(req); if(!auth)return {unauthorized:true};
  if(!(auth.rawAccount.professionalIds||[]).includes(professionalId))return {forbidden:true};
  const current=marketplace.getOwnerData().professionals.find(row=>row.id===professionalId); if(!current)return {error:'Professional profile not found.'};
  const readiness=marketplace.professionalProfileReadiness(current);
  if(!readiness.readyForReview)return {error:'Complete the required profile items before submitting for review.',profileReadiness:readiness};
  const result=marketplace.updateProfessional(professionalId,{reviewStatus:'submitted',reviewSubmittedAt:now(),submittedRevision:readiness.profileRevision,verificationStatus:current.verificationStatus==='verified'?'verified':'pending',ownerApprovalStatus:current.ownerApprovalStatus==='approved'?'approved':'pending',publicProfileEnabled:false,portalPublicationState:'not distributed'},'professional-review-submission');
  store.addAudit({actor:'professional-account',action:'professional_profile_submitted_for_review',details:{accountId:auth.account.id,professionalId,profileRevision:readiness.profileRevision,focusedPortalIds:readiness.focusedPortalIds}});
  return {...result,message:'Your profile was submitted for identity, credential, and portal review. No payment was taken and nothing was published.'};
}
function submitFirmForReview(req, firmId) {
  const auth=accountFromRequest(req); if(!auth)return {unauthorized:true};
  if(!(auth.rawAccount.firmIds||[]).includes(firmId))return {forbidden:true};
  const current=marketplace.getOwnerData().firms.find(row=>row.id===firmId); if(!current)return {error:'Firm workspace not found.'};
  const readiness=marketplace.firmProfileReadiness(current);
  if(!readiness.readyForReview)return {error:'Complete the required firm items before submitting for review.',profileReadiness:readiness};
  const result=marketplace.updateFirm(firmId,{reviewStatus:'submitted',reviewSubmittedAt:now(),submittedRevision:readiness.profileRevision,verificationStatus:current.verificationStatus==='verified'?'verified':'pending',ownerApprovalStatus:current.ownerApprovalStatus==='approved'?'approved':'pending',publicProfileEnabled:false,portalPublicationState:'not distributed'},'firm-review-submission');
  store.addAudit({actor:'professional-account',action:'firm_workspace_submitted_for_review',details:{accountId:auth.account.id,firmId,profileRevision:readiness.profileRevision,focusedPortalIds:readiness.focusedPortalIds}});
  return {...result,message:'Your firm workspace was submitted for authority and portal review. Individual professional credentials, payment, and publication remain separate.'};
}
function updateCommunicationPreferences(req, input = {}) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState();
  const account = state.accounts.find(item => item.id === auth.account.id);
  if (!account) return { unauthorized:true };
  const current = normalizeCommunicationPreferences(account.communicationPreferences || {});
  const next = normalizeCommunicationPreferences({
    preferredLanguage:input.preferredLanguage,
    profileAndDirectoryUpdates:input.profileAndDirectoryUpdates,
    membershipAndProgramUpdates:input.membershipAndProgramUpdates,
    researchAndFeedbackInvitations:input.researchAndFeedbackInvitations,
    updatedAt:now()
  }, current);
  account.communicationPreferences = next;
  account.updatedAt = now();
  writeState(state);
  store.addAudit({ actor:'professional-account', action:'professional_communication_preferences_updated', details:{ accountId:account.id, preferredLanguage:next.preferredLanguage, profileAndDirectoryUpdates:next.profileAndDirectoryUpdates, membershipAndProgramUpdates:next.membershipAndProgramUpdates, researchAndFeedbackInvitations:next.researchAndFeedbackInvitations, essentialNotices:true } });
  return { account:publicAccount(account), communicationPreferences:next, message:'Communication preferences saved. Essential security, legal, account, and billing notices remain enabled.' };
}


function updatePortalProfileForAccount(req, targetKind, targetId, portalId, input = {}) {
  const auth=accountFromRequest(req); if(!auth)return {unauthorized:true};
  const owned=targetKind==='firm'?(auth.rawAccount.firmIds||[]):(auth.rawAccount.professionalIds||[]);
  if(!owned.includes(targetId))return {forbidden:true};
  return portalPresence.updatePortalProfile(targetKind,targetId,portalId,input,'professional-account');
}
function submitPortalProfileForReview(req, targetKind, targetId, portalId, input = {}) {
  const auth=accountFromRequest(req); if(!auth)return {unauthorized:true};
  const owned=targetKind==='firm'?(auth.rawAccount.firmIds||[]):(auth.rawAccount.professionalIds||[]);
  if(!owned.includes(targetId))return {forbidden:true};
  return portalPresence.submitPortalProfile(targetKind,targetId,portalId,input.expectedRevision,'professional-account');
}

function setMembershipTarget(accountId, target) { const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return null; account.membershipTarget = target; account.updatedAt = now(); writeState(state); return publicAccount(account); }
function getAccountById(id) { const state = readState(); const account = state.accounts.find(x => x.id === id); return account ? publicAccount(account) : null; }
function ownerSummary() { const state = readState(); return { accounts:state.accounts.map(publicAccount), activeSessions:state.sessions.filter(x => Date.parse(x.expiresAt) > Date.now()).length, pendingProfileClaims:state.accounts.reduce((n,x) => n + (x.pendingClaimProfessionalIds || []).length + (x.pendingClaimFirmIds || []).length, 0) }; }

function securityStatus() {
  const state = readState(); cleanupSessions(state);
  const activeAccounts = state.accounts.filter(item => item.status === 'active');
  const mfaEnabledAccounts = activeAccounts.filter(item => item.mfa?.enabled);
  const verifiedAccounts = activeAccounts.filter(item => Boolean(item.emailVerifiedAt));
  const pendingResetRequests = state.passwordResetRequests.filter(item => !item.usedAt && Date.parse(item.expiresAt) > Date.now());
  return {
    accountCount:state.accounts.length,
    activeAccountCount:activeAccounts.length,
    activeSessions:state.sessions.length,
    mfaEnabledAccounts:mfaEnabledAccounts.length,
    emailVerifiedAccounts:verifiedAccounts.length,
    accountsWithRecoveryCodes:activeAccounts.filter(item => (item.mfa?.recoveryCodeHashes || []).length > 0).length,
    pendingPasswordResetRequests:pendingResetRequests.length,
    passwordResetFoundation:true,
    mfaFoundation:true,
    sessionRevocationFoundation:true,
    emailVerificationFoundation:true,
    allActiveAccountsEmailVerified:activeAccounts.length === verifiedAccounts.length,
    authenticatedEmailConfigured:mailer.configured(),
    authenticatedEmailStatus:mailer.status(),
    allActiveAccountsMfaEnabled:activeAccounts.length > 0 && mfaEnabledAccounts.length === activeAccounts.length
  };
}


module.exports = {
  STORE_KEY, SESSION_COOKIE, PASSWORD_MIN_LENGTH, sessionCookie, accountFromRequest, createAccount, login, logout, requestEmailVerification, verifyEmail, requestPasswordReset, resetPassword, beginMfa, confirmMfa, disableMfa, revokeOtherSessions,
  attachClaim, attachFirmClaim, ownerApproveClaim, ownerApproveFirmClaim, dashboard, createProfessionalForAccount, createFirmForAccount, ownerCreateProfileForAccount, updateProfessionalForAccount, updateFirmForAccount, submitProfessionalProfileForReview, submitFirmForReview, updatePortalProfileForAccount, submitPortalProfileForReview, addProfessionalToFirm, updateCommunicationPreferences, setMembershipTarget, getAccountById, ownerSummary, securityStatus
};
